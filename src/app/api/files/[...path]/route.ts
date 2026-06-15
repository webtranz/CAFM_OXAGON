import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { contentTypeForFile, resolvePrivateUploadPath, safeDownloadName } from "@/lib/private-files";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { error } = await requireUser();
  if (error) return error;

  const { path: segments } = await params;
  const filePath = resolvePrivateUploadPath(segments);
  if (!filePath) {
    return NextResponse.json({ message: "File not found." }, { status: 404 });
  }

  try {
    const body = await readFile(filePath);
    const filename = safeDownloadName(filePath);
    return new NextResponse(body, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Type": contentTypeForFile(filePath),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found." }, { status: 404 });
  }
}
