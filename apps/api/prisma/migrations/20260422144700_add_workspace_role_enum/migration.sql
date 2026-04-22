-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member');

-- AlterTable
ALTER TABLE "WorkspaceMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "WorkspaceMember" ALTER COLUMN "role" TYPE "WorkspaceRole" USING ("role"::"WorkspaceRole");
ALTER TABLE "WorkspaceMember" ALTER COLUMN "role" SET DEFAULT 'owner';
