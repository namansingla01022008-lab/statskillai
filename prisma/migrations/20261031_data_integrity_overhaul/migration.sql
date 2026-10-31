-- MIGRATION: 20261031_data_integrity_overhaul (UP)
-- Description: Adds Career, Dataset tables; alters Course with verified metadata, status, topic, lastVerifiedAt, sourceUrl

-- 1. Alter Course Table
ALTER TABLE "Course" 
  ADD COLUMN IF NOT EXISTS "topic" TEXT NOT NULL DEFAULT 'Statistical Inference',
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceName" TEXT NOT NULL DEFAULT 'Official Portal',
  ADD COLUMN IF NOT EXISTS "licenseNote" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS "lastVerifiedAt" TIMESTAMP(3);

-- Populate sourceUrl with portalUrl if empty for existing records before setting NOT NULL
UPDATE "Course" SET "sourceUrl" = "portalUrl" WHERE "sourceUrl" IS NULL OR "sourceUrl" = '';
ALTER TABLE "Course" ALTER COLUMN "sourceUrl" SET NOT NULL;
ALTER TABLE "Course" ALTER COLUMN "duration" DROP NOT NULL;
ALTER TABLE "Course" ALTER COLUMN "domain" SET DEFAULT 'Statistical';
ALTER TABLE "Course" ALTER COLUMN "source" SET DEFAULT 'SWAYAM';
ALTER TABLE "Course" ALTER COLUMN "level" SET DEFAULT 'Intermediate';
ALTER TABLE "Course" ALTER COLUMN "portalUrl" SET DEFAULT '';

-- Create unique index and topic/status indices for Course
CREATE INDEX IF NOT EXISTS "Course_sourceUrl_idx" ON "Course"("sourceUrl");
CREATE INDEX IF NOT EXISTS "Course_status_idx" ON "Course"("status");
CREATE INDEX IF NOT EXISTS "Course_topic_idx" ON "Course"("topic");

-- 2. Create Career Table
CREATE TABLE IF NOT EXISTS "Career" (
    "id" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "pathway" TEXT NOT NULL,
    "requiredSkills" TEXT NOT NULL DEFAULT '[]',
    "requiredQualification" TEXT NOT NULL,
    "entryRoute" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unverified',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Career_sourceUrl_key" ON "Career"("sourceUrl");
CREATE INDEX IF NOT EXISTS "Career_status_idx" ON "Career"("status");
CREATE INDEX IF NOT EXISTS "Career_pathway_idx" ON "Career"("pathway");

-- 3. Create Dataset Table
CREATE TABLE IF NOT EXISTS "Dataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "licence" TEXT NOT NULL DEFAULT 'GODL-India',
    "attributionText" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Dataset_sourceUrl_key" ON "Dataset"("sourceUrl");
CREATE INDEX IF NOT EXISTS "Dataset_publisher_idx" ON "Dataset"("publisher");
