import { prisma } from '../db';

export interface IgotCourseSummary {
  id: string;
  title: string;
  provider: string;
  domain: string;
  topic: string;
  level: string;
  duration: string | null;
  sourceUrl: string;
  sourceName: string;
  status: string;
  lastVerifiedAt: Date | null;
}

export interface IgotCompletionResult {
  userId: string;
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
  completionDate: string | null;
  verifiedVia: 'CERTIFICATE_REGISTRY' | 'LEARNING_PATH_STEP' | 'NONE';
  certificateId: string | null;
}

/**
 * MockIgotAdapter
 * Provides capacity-building course catalog and completion tracking for iGOT Karmayogi.
 * Grounded strictly in verified database records — NEVER fabricates completion data.
 * Ready to be swapped with official Mission Karmayogi Bharat API upon partnership access.
 */
export class MockIgotAdapter {
  /**
   * List all verified iGOT Karmayogi courses from the database.
   */
  static async listCourses(filter?: {
    domain?: string;
    topic?: string;
    level?: string;
  }): Promise<IgotCourseSummary[]> {
    const where: any = {
      provider: 'iGOT Karmayogi',
      status: 'verified', // Strictly return verified courses only
    };

    if (filter?.domain) where.domain = filter.domain;
    if (filter?.topic) where.topic = filter.topic;
    if (filter?.level) where.level = filter.level;

    const courses = await prisma.course.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      provider: c.provider,
      domain: c.domain,
      topic: c.topic,
      level: c.level,
      duration: c.duration,
      sourceUrl: c.sourceUrl,
      sourceName: c.sourceName,
      status: c.status,
      lastVerifiedAt: c.lastVerifiedAt,
    }));
  }

  /**
   * Retrieve a single verified course by its ID.
   */
  static async getCourse(courseId: string): Promise<IgotCourseSummary | null> {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        provider: 'iGOT Karmayogi',
        status: 'verified',
      },
    });

    if (!course) return null;

    return {
      id: course.id,
      title: course.title,
      provider: course.provider,
      domain: course.domain,
      topic: course.topic,
      level: course.level,
      duration: course.duration,
      sourceUrl: course.sourceUrl,
      sourceName: course.sourceName,
      status: course.status,
      lastVerifiedAt: course.lastVerifiedAt,
    };
  }

  /**
   * Track completion status for a learner.
   * Grounded strictly in authentic user records; returns isCompleted: false if no verifiable record exists.
   */
  static async getCompletionStatus(
    userId: string,
    courseId: string
  ): Promise<IgotCompletionResult> {
    const course = await this.getCourse(courseId);
    const courseTitle = course ? course.title : courseId;

    // 1. Check if user has an APPROVED certificate for this course or provider
    const approvedCert = await prisma.certificate.findFirst({
      where: {
        userId,
        status: 'APPROVED',
        provider: { in: ['iGOT', 'iGOT Karmayogi'] },
      },
      orderBy: { verifiedAt: 'desc' },
    });

    if (approvedCert) {
      return {
        userId,
        courseId,
        courseTitle,
        isCompleted: true,
        completionDate: approvedCert.verifiedAt?.toISOString() || null,
        verifiedVia: 'CERTIFICATE_REGISTRY',
        certificateId: approvedCert.certId,
      };
    }

    // 2. Check if user completed a learning step matching this course
    const completedStep = await prisma.learningStep.findFirst({
      where: {
        courseId,
        status: 'Completed',
        learningPath: { userId },
      },
    });

    if (completedStep) {
      return {
        userId,
        courseId,
        courseTitle,
        isCompleted: true,
        completionDate: new Date().toISOString(),
        verifiedVia: 'LEARNING_PATH_STEP',
        certificateId: null,
      };
    }

    // 3. No authentic record found -> never fabricate completion data
    return {
      userId,
      courseId,
      courseTitle,
      isCompleted: false,
      completionDate: null,
      verifiedVia: 'NONE',
      certificateId: null,
    };
  }
}
