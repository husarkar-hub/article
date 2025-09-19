/*
  Warnings:

  - The values [VIEWER] on the enum `AdminRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AdminRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."AdminRole_new" USING ("role"::text::"public"."AdminRole_new");
ALTER TYPE "public"."AdminRole" RENAME TO "AdminRole_old";
ALTER TYPE "public"."AdminRole_new" RENAME TO "AdminRole";
DROP TYPE "public"."AdminRole_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'EDITOR';
COMMIT;
