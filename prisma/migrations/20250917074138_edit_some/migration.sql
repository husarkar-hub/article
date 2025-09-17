/*
  Warnings:

  - You are about to drop the column `username` on the `Admin` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Admin_username_idx";

-- DropIndex
DROP INDEX "public"."Admin_username_key";

-- AlterTable
ALTER TABLE "public"."Admin" DROP COLUMN "username";
