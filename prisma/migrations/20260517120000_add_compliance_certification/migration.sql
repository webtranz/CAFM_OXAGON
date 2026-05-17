CREATE TABLE "ComplianceCertificate" (
    "id" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assetTag" TEXT,
    "location" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "risk" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "renewalLeadDays" INTEGER NOT NULL DEFAULT 30,
    "evidenceUrl" TEXT,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComplianceCertificate_certificateNo_key" ON "ComplianceCertificate"("certificateNo");
