import { readFile } from "fs/promises";
import path from "path";

/**
 * مسار تنزيل ملفات حزمة النشر مع رأس Content-Disposition: attachment
 * لفرض المتصفح/المعاينة على بدء التنزيل فوراً بدل محاولة العرض.
 *
 * /api/download/zip   → marsaa-platform-deploy.zip
 * /api/download/guide → DEPLOY-GUIDE-AR.md
 */
const FILES: Record<string, { file: string; type: string; name: string }> = {
  zip: {
    file: "marsaa-platform-deploy.zip",
    type: "application/zip",
    name: "marsaa-platform-deploy.zip",
  },
  guide: {
    file: "DEPLOY-GUIDE-AR.md",
    type: "text/markdown; charset=utf-8",
    name: "DEPLOY-GUIDE-AR.md",
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const spec = FILES[file];

  if (!spec) {
    return new Response("الملف غير موجود", { status: 404 });
  }

  const fullPath = path.join(process.cwd(), "public", spec.file);

  try {
    const data = await readFile(fullPath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": spec.type,
        "Content-Length": String(data.length),
        "Content-Disposition": `attachment; filename="${spec.name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("تعذر قراءة الملف من الخادم", { status: 500 });
  }
}
