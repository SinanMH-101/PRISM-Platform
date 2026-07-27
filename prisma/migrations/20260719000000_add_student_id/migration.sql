-- Student IDs are optional for existing non-student accounts, but must be unique when supplied.
ALTER TABLE "User" ADD COLUMN "studentId" TEXT;

CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");
