import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let isSyncing = false;
let lastSyncTime = 0;

export async function ensurePrismaSchema(): Promise<boolean> {
  // Avoid duplicate rapid pushes within 10 seconds
  const now = Date.now();
  if (isSyncing || now - lastSyncTime < 10000) {
    return false;
  }

  isSyncing = true;
  try {
    console.log('[DB Sync] Synchronizing Prisma schema to PostgreSQL database...');
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');
    console.log('[DB Sync Output]:', stdout || stderr);
    lastSyncTime = Date.now();
    return true;
  } catch (err: any) {
    console.error('[DB Sync Error]:', err?.message || err);
    return false;
  } finally {
    isSyncing = false;
  }
}
