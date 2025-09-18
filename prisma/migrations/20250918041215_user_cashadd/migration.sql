-- CreateTable
CREATE TABLE "public"."visitLogs" (
    "id" TEXT NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "visitTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "customData" JSONB,

    CONSTRAINT "visitLogs_pkey" PRIMARY KEY ("id")
);
