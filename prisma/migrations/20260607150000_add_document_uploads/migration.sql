CREATE TABLE "DocumentUpload" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "assetTag" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "uploadedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocumentUpload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentUpload_category_assetTag_idx" ON "DocumentUpload"("category", "assetTag");
