import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Database & Socket.io
import { checkDatabaseConnection } from './server/db';
import { initSocketIO } from './server/socket';

// Modular Routers
import authRouter from './server/routes/auth';
import profileRouter from './server/routes/profile';
import assessmentsRouter from './server/routes/assessments';
import gapsRouter from './server/routes/gaps';
import pathsRouter from './server/routes/paths';
import coursesRouter from './server/routes/courses';
import opportunitiesRouter from './server/routes/opportunities';
import mentorshipRouter from './server/routes/mentorship';
import analyticsRouter from './server/routes/analytics';
import quizzesRouter from './server/routes/quizzes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiters for security hardening
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
});

const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // limit each IP to 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Initialize Socket.io on the HTTP server
  initSocketIO(httpServer);

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for Vite HMR and dynamic inline stylesheets
      crossOriginEmbedderPolicy: false,
    })
  );

  // Global Middlewares
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use('/api/', generalApiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // Health and config status
  app.get('/api/health', async (req, res) => {
    const dbStatus = await checkDatabaseConnection();
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Modular Domain API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/assessments', assessmentsRouter);
  app.use('/api/gaps', gapsRouter);
  app.use('/api/paths', pathsRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/opportunities', opportunitiesRouter);
  app.use('/api/mentorship', mentorshipRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/quizzes', quizzesRouter);

  // Server-side Gemini generateContent
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'No GEMINI_API_KEY configured in environment.',
          fallbackRequired: true,
        });
      }

      const { prompt, systemInstruction, responseMimeType, responseSchema, inlineData } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let contents: any = prompt;
      if (inlineData) {
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: inlineData.mimeType,
                data: inlineData.data,
              },
            },
            {
              text: prompt || 'Analyze this material and fulfill the requested task.',
            },
          ],
        };
      }

      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (responseSchema) {
        config.responseSchema = responseSchema;
      }

      const CANDIDATE_MODELS = [
        process.env.GEMINI_MODEL,
        'gemini-3.5-flash',
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
      ].filter(Boolean) as string[];

      async function generateWithFallback(models: string[]) {
        let lastErr: any = null;
        for (const model of models) {
          try {
            return await ai.models.generateContent({ model, contents, config });
          } catch (err: any) {
            console.warn(`Model ${model} unavailable (${err?.message || err}). Trying next candidate...`);
            lastErr = err;
          }
        }
        throw lastErr;
      }

      const response = await generateWithFallback(CANDIDATE_MODELS);

      res.json({
        success: true,
        text: response.text,
      });
    } catch (error: any) {
      console.error('Gemini API Error:', error?.message || error);
      res.status(500).json({
        error: error?.message || 'Gemini API call failed',
        fallbackRequired: true,
      });
    }
  });

  // Server-side Gemini chat
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'No GEMINI_API_KEY configured in environment.',
          fallbackRequired: true,
        });
      }

      const { messages, systemInstruction } = req.body;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents = (messages || []).map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content || m.text || '' }],
      }));

      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const CANDIDATE_MODELS = [
        process.env.GEMINI_MODEL,
        'gemini-3.5-flash',
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
      ].filter(Boolean) as string[];

      async function chatWithFallback(models: string[]) {
        let lastErr: any = null;
        for (const model of models) {
          try {
            return await ai.models.generateContent({ model, contents, config });
          } catch (err: any) {
            console.warn(`Model ${model} unavailable (${err?.message || err}). Trying next candidate...`);
            lastErr = err;
          }
        }
        throw lastErr;
      }

      const response = await chatWithFallback(CANDIDATE_MODELS);

      res.json({
        success: true,
        text: response.text,
      });
    } catch (error: any) {
      console.error('Gemini Chat Error:', error?.message || error);
      res.status(500).json({
        error: error?.message || 'Chat generation failed',
        fallbackRequired: true,
      });
    }
  });

  // Mount Vite in dev mode or serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[StatSkillAI Server] Running at http://0.0.0.0:${PORT} with Socket.io WebSockets`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
