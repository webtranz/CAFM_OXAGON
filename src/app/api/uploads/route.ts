import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { auditAction } from "@/lib/audit";
import { privateFileUrl, privateUploadRoot } from "@/lib/private-files";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

function hasImageSignature(buffer: Buffer, ext: string) {
  if (ext === ".png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === ".jpg" || ext === ".jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (ext === ".gif") return buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  if (ext === ".webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error) return error;
  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  const uploadDir = path.join(privateUploadRoot, "images");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (file.type && !file.type.startsWith("image/")) continue;
    if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ message: `${file.name} exceeds the 5 MB image size limit.` }, { status: 400 });
    const ext = (path.extname(file.name || "") || ".png").toLowerCase();
    if (!imageExtensions.has(ext)) continue;
    const filename = `${Date.now()}-${randomUUID()}${ext.toLowerCase()}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasImageSignature(buffer, ext)) {
      return NextResponse.json({ message: `${file.name || "File"} is not a valid image.` }, { status: 400 });
    }
    await writeFile(path.join(uploadDir, filename), buffer);
    const storedUrl = privateFileUrl(`images/${filename}`);
    urls.push(storedUrl);
    await auditAction({
      user,
      action: "FILE_UPLOAD",
      entity: "upload",
      entityId: filename,
      details: {
        originalName: file.name,
        storedUrl,
        size: file.size,
        mimeType: file.type || null,
      },
    });
  }

  return NextResponse.json({ urls });
}
