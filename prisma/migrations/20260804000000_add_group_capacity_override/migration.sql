ALTER TABLE "Group" ADD COLUMN "capacityOverride" INTEGER;

ALTER TABLE "Group"
ADD CONSTRAINT "Group_capacityOverride_check"
CHECK ("capacityOverride" IS NULL OR "capacityOverride" > 0);
