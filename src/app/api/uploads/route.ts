import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error) return error;
  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (file.type && !file.type.startsWith("image/")) continue;
    if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ message: `${file.name} exceeds the 5 MB image size limit.` }, { status: 400 });
    const ext = (path.extname(file.name || "") || ".png").toLowerCase();
    if (!imageExtensions.has(ext)) continue;
    const filename = `${Date.now()}-${randomUUID()}${ext.toLowerCase()}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    urls.push(`/uploads/${filename}`);
    await auditAction({
      user,
      action: "FILE_UPLOAD",
      entity: "upload",
      entityId: filename,
      details: {
        originalName: file.name,
        storedUrl: `/uploads/${filename}`,
        size: file.size,
        mimeType: file.type || null,
      },
    });
  }

  return NextResponse.json({ urls });
}
