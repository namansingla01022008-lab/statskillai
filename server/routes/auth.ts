import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
  authenticate,
  AuthenticatedRequest,
  validatePassword,
  validateEmail,
} from '../middleware/auth';

const router = Router();

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, profileType, department, designation } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
    }

    // Email format validation
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Password strength validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements.',
        details: passwordCheck.errors,
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12); // 12 rounds for stronger security
    const assignedRole = (['learner', 'mentor', 'admin'].includes(role) ? role : 'learner') as 'learner' | 'mentor' | 'admin';
    const assignedProfileType = profileType || 'Student';

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: assignedRole,
        profileType: assignedProfileType,
        department: department || '',
        designation: designation || '',
      },
    });

    // Create default learner profile if registering as learner
    if (assignedRole === 'learner') {
      await prisma.learnerProfile.create({
        data: {
          userId: user.id,
          fullName: user.name,
          profileType: assignedProfileType,
          organisationOrInstitution: department || 'National University',
          skills: JSON.stringify(['Statistical Analysis', 'Python', 'Critical Thinking']),
          interests: JSON.stringify(['Official Statistics', 'E-Governance']),
          targetDomainScores: JSON.stringify({ Technical: 70, Statistical: 70, Digital: 70, Behavioural: 70 }),
          completeness: 60,
        },
      });
    }

    // Create mentor profile if registering as mentor
    if (assignedRole === 'mentor') {
      await prisma.mentor.create({
        data: {
          userId: user.id,
          name: user.name,
          title: designation || 'Domain Expert',
          organisation: department || 'Independent',
          field: 'Statistics & Data Science',
          experienceYears: 0,
          languages: JSON.stringify(['English']),
          bio: '',
          isVerified: false,
          availability: 'Flexible',
        },
      });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: user.id });

    res.cookie('statskill_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('statskill_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileType: user.profileType,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Use a generic error to avoid user enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: user.id });

    res.cookie('statskill_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('statskill_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileType: user.profileType,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Refresh JWT token using refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = (req as any).cookies?.statskill_refresh;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists.' });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    };

    const newToken = signToken(tokenPayload);

    res.cookie('statskill_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token: newToken });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Token refresh failed.' });
  }
});

// Demo account switcher (Preserves one-click testing across roles with real JWT sessions)
// This is a development convenience endpoint. In production, demo accounts use standard login.
router.post('/demo-switch', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Demo user not found in database.' });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    };

    const token = signToken(tokenPayload);

    res.cookie('statskill_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileType: user.profileType,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (err: any) {
    console.error('Demo switch error:', err);
    res.status(500).json({ error: err.message || 'Demo switch failed.' });
  }
});

// Get currently authenticated user profile
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        profile: true,
        mentorProfile: true,
        settings: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileType: user.profileType,
        department: user.department,
        designation: user.designation,
        avatar: user.avatar,
      },
      profile: user.profile ? {
        ...user.profile,
        skills: JSON.parse(user.profile.skills || '[]'),
        interests: JSON.parse(user.profile.interests || '[]'),
        previousTrainings: JSON.parse(user.profile.previousTrainings || '[]'),
        targetDomainScores: JSON.parse(user.profile.targetDomainScores || '{}'),
      } : null,
      mentor: user.mentorProfile ? {
        ...user.mentorProfile,
        languages: JSON.parse(user.mentorProfile.languages || '[]'),
      } : null,
      settings: user.settings,
    });
  } catch (err: any) {
    console.error('Me endpoint error:', err);
    res.status(500).json({ error: 'Failed to fetch user session.' });
  }
});

// Change password (authenticated users only)
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    // Validate new password strength
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: 'New password does not meet security requirements.',
        details: passwordCheck.errors,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('statskill_token');
  res.clearCookie('statskill_refresh');
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;

