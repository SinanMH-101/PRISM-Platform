ALTER TABLE "ContributionScore"
ADD COLUMN "educatorOverridePoints" INTEGER,
ADD COLUMN "educatorOverriddenAt" TIMESTAMP(3);

ALTER TABLE "ContributionScore"
ADD CONSTRAINT "ContributionScore_educatorOverridePoints_check"
CHECK ("educatorOverridePoints" IS NULL OR ("educatorOverridePoints" >= 0 AND "educatorOverridePoints" <= 100));
