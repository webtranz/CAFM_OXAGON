import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { canManageDepartmentRecord } from "@/lib/access-control";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const documentCategories: Record<string, string> = {
  OM_MANUAL: "operation-maintenance-management",
  WARRANTY_GUARANTEE: "equipment-warranties-and-guarantees",
  SUPPORT_CONTRACT_SLA: "support-contracts-and-slas",
};
const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".txt", ".csv", ".xlsx", ".docx", ".pptx"]);

function safeSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function hasExecutableSignature(buffer: Buffer) {
  const start = buffer.subarray(0, 4).toString("utf8");
  return start.startsWith("MZ") || start.startsWith("\u007fELF") || start.startsWith("#!");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const category = String(formData.get("category") || "");
    const assetTag = String(formData.get("assetTag") || "").trim();
    const assetFolder = safeSegment(assetTag);
    const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    const folder = documentCategories[category];

    if (!folder) return NextResponse.json({ message: "Invalid document category." }, { status: 400 });
    if (!assetTag || !assetFolder) return NextResponse.json({ message: "Asset Number is required." }, { status: 400 });
    if (!files.length) return NextResponse.json({ message: "Select at least one file." }, { status: 400 });

    const asset = await prisma.asset.findUnique({ where: { tag: assetTag } });
    if (!asset) return NextResponse.json({ message: "Asset Number was not found." }, { status: 404 });

    const user = await getCurrentUser();
    if (!canManageDepartmentRecord(user, asset.departmentCode)) {
      return NextResponse.json({ message: "You do not have permission to upload documents for this asset." }, { status: 403 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "document-management", folder, assetFolder);
    await mkdir(uploadDir, { recursive: true });

    const saved = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ message: `${file.name} exceeds the 20 MB file size limit.` }, { status: 400 });
      }

      const originalName = file.name || "document";
      const ext = path.extname(originalName).toLowerCase();
      if (!allowedExtensions.has(ext)) {
        return NextResponse.json({ message: `${originalName} is not an allowed document type.` }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (hasExecutableSignature(buffer)) {
        return NextResponse.json({ message: `${originalName} was rejected by security checks.` }, { status: 400 });
      }

      const baseName = safeSegment(path.basename(originalName, ext)) || "document";
      const fileName = `${Date.now()}-${randomUUID()}-${baseName}${ext}`;
      await writeFile(path.join(uploadDir, fileName), buffer, { mode: 0o644 });

      const fileUrl = `/uploads/document-management/${folder}/${assetFolder}/${fileName}`;
      const record = await prisma.documentUpload.create({
        data: {
          category,
          assetTag,
          fileName: originalName,
          fileUrl,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          checksum: createHash("sha256").update(buffer).digest("hex"),
          uploadedBy: user?.email || user?.name || null,
        },
      });
      saved.push(record);
    }

    return NextResponse.json({ documents: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to upload document." }, { status: 500 });
  }
}
