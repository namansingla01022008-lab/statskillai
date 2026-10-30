import { OfflineStorage, OutboxMutation } from './offlineStorage';
import { ApiService } from './apiService';

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
}

let isSyncRunning = false;

export const SyncService = {
  /**
   * Preloads minimal, non-confidential data for offline access.
   * Strictly adheres to the Data Policy:
   * - Display name and role only (no email, phone, personal IDs)
   * - Learning path: step titles, ordering, statuses
   * - Gap analysis: domain scores and recommendations
   * - Course metadata: titles, domains, short descriptions
   * - Preloaded questions: text and options ONLY
   */
  async preloadOfflineCache(user: { id: string; name: string; role: string }): Promise<void> {
    try {
      await OfflineStorage.checkUserConsistency(user.id);
      await OfflineStorage.requestPersistentStorage();

      // 1. Cache minimal user identity
      await OfflineStorage.setCache('user_minimal', {
        name: user.name,
        role: user.role,
      }, user.id);

      // 2. Preload & cache learning path
      try {
        const pathData = await ApiService.getLearningPath();
        if (pathData) {
          const minimalPath = {
            id: pathData.id,
            title: pathData.title,
            careerGoal: pathData.careerGoal,
            progressPercent: pathData.progressPercent,
            isCompleted: pathData.isCompleted,
            steps: (pathData.steps || []).map((s: any) => ({
              id: s.id,
              title: s.title,
              domain: s.domain,
              type: s.type,
              estimatedDuration: s.estimatedDuration,
              source: s.source,
              rationale: s.rationale,
              status: s.status,
              isMentorRecommended: s.isMentorRecommended,
              courseId: s.courseId,
              orderIndex: s.orderIndex,
            })),
          };
          await OfflineStorage.setCache('learning_path', minimalPath, user.id);
        }
      } catch (err) {
        console.warn('[SyncService] Could not preload learning path:', err);
      }

      // 3. Preload & cache gap analysis
      try {
        const gapData = await ApiService.getGapAnalysis();
        if (gapData) {
          const minimalGap = {
            overallScore: gapData.overallScore,
            domainScores: gapData.domainScores,
            targetScores: gapData.targetScores,
            summary: gapData.summary,
            strengths: gapData.strengths,
            gaps: gapData.gaps,
            priorityOrder: gapData.priorityOrder,
          };
          await OfflineStorage.setCache('gap_analysis', minimalGap, user.id);
        }
      } catch (err) {
        console.warn('[SyncService] Could not preload gap analysis:', err);
      }

      // 4. Preload & cache course catalog metadata
      try {
        const courses = await ApiService.getCourses();
        if (courses && courses.length > 0) {
          const minimalCourses = courses.map((c) => ({
            id: c.id,
            title: c.title,
            domain: c.domain,
            provider: c.provider,
            source: c.source,
            duration: c.duration,
            level: c.level,
            description: c.description,
          }));
          await OfflineStorage.setCache('course_catalog', minimalCourses, user.id);
        }
      } catch (err) {
        console.warn('[SyncService] Could not preload course catalog:', err);
      }

      // 5. Preload & cache questions (text & options ONLY)
      try {
        const questions = await ApiService.getOfflineQuestions();
        if (questions && questions.length > 0) {
          await OfflineStorage.setCache('offline_questions', questions, user.id);
        }
      } catch (err) {
        console.warn('[SyncService] Could not preload offline questions:', err);
      }

      console.info('[SyncService] Offline preloading completed successfully.');
    } catch (err) {
      console.warn('[SyncService] Error during offline cache preloading:', err);
    }
  },

  /**
   * Synchronizes the outbox queue with the backend server.
   * Processes mutations in FIFO order and handles idempotency.
   */
  async syncOutbox(): Promise<SyncResult> {
    if (isSyncRunning) {
      return { syncedCount: 0, failedCount: 0, skippedCount: 0, errors: ['Sync already in progress'] };
    }

    isSyncRunning = true;
    const errors: string[] = [];
    let syncedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    try {
      const outbox = await OfflineStorage.getOutbox();
      if (outbox.length === 0) {
        return { syncedCount: 0, failedCount: 0, skippedCount: 0, errors: [] };
      }

      // Check authentication session
      if (!ApiService.getToken()) {
        return {
          syncedCount: 0,
          failedCount: outbox.length,
          skippedCount: 0,
          errors: ['Session unauthenticated. Please re-login to sync offline mutations.'],
        };
      }

      console.info(`[SyncService] Starting sync of ${outbox.length} pending mutations...`);

      // Batch send to POST /api/offline/sync
      const response = await ApiService.syncOfflineMutations(outbox);

      if (response && Array.isArray(response.processed)) {
        for (const item of response.processed) {
          if (item.status === 'synced') {
            await OfflineStorage.removeMutation(item.mutationId);
            syncedCount++;
          } else if (item.status === 'skipped') {
            await OfflineStorage.removeMutation(item.mutationId);
            skippedCount++;
          } else {
            await OfflineStorage.updateMutationStatus(item.mutationId, 'failed', item.error);
            failedCount++;
            if (item.error) errors.push(item.error);
          }
        }
      }

      // If any mutation was processed, refresh live cache snapshots
      if (syncedCount > 0) {
        try {
          const path = await ApiService.getLearningPath();
          if (path) {
            await OfflineStorage.setCache('learning_path', path);
          }
          const gaps = await ApiService.getGapAnalysis();
          if (gaps) {
            await OfflineStorage.setCache('gap_analysis', gaps);
          }
        } catch {}
      }

      console.info(`[SyncService] Sync finished: ${syncedCount} synced, ${skippedCount} skipped, ${failedCount} failed.`);
      return { syncedCount, failedCount, skippedCount, errors };
    } catch (err: any) {
      console.error('[SyncService] Sync failed with exception:', err);
      errors.push(err.message || 'Network error during synchronization.');
      return { syncedCount, failedCount, skippedCount, errors };
    } finally {
      isSyncRunning = false;
    }
  },
};

