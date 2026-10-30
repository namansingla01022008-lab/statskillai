-- MIGRATION: 20261031_data_integrity_overhaul (DOWN)
-- Description: Reverts Career and Dataset tables, removes sourceUrl, topic, status, lastVerifiedAt from Course

DROP TABLE IF EXISTS "Dataset";
DROP TABLE IF EXISTS "Career";

DROP INDEX IF EXISTS "Course_topic_idx";
DROP INDEX IF EXISTS "Course_status_idx";
DROP INDEX IF EXISTS "Course_sourceUrl_key";

ALTER TABLE "Course"
  DROP COLUMN IF EXISTS "lastVerifiedAt",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "licenseNote",
  DROP COLUMN IF EXISTS "sourceName",
  DROP COLUMN IF EXISTS "sourceUrl",
  DROP COLUMN IF EXISTS "language",
  DROP COLUMN IF EXISTS "topic";
