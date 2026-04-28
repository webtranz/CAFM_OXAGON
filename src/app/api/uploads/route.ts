import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (file.type && !file.type.startsWith("image/")) continue;
    const ext = path.extname(file.name || "") || ".png";
    const filename = `${Date.now()}-${randomUUID()}${ext.toLowerCase()}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    urls.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ urls });
}
