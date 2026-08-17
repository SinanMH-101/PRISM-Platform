ALTER TABLE "ContributionScore"
ALTER COLUMN "points" TYPE DECIMAL(12, 8) USING "points"::DECIMAL(12, 8),
ALTER COLUMN "educatorOverridePoints" TYPE DECIMAL(12, 8) USING "educatorOverridePoints"::DECIMAL(12, 8);
