// ============ التخزين الآمن للملفات ============
import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

const MIME_WHITELIST: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const EXT_WHITELIST = new Set(["pdf", "jpg", "jpeg", "png"]);
const MAX_SIZE_MB = 10;

/** حفظ ملف مرفوع داخل عزل المكتب: storage/{officeId}/... — التحقق من الصيغة والحجم */
export async function saveUpload(
  file: File,
  officeId: string,
  folder: string
): Promise<{ path: string; size: number; mime: string; name: string }> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!EXT_WHITELIST.has(ext)) {
    throw new Error(`الصيغة غير مسموحة (.${ext}) — المسموح: PDF, JPG, PNG`);
  }
  const mime = file.type || (ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`);
  if (!MIME_WHITELIST[mime]) {
    // تسامح مع بعض المتصفحات التي ترسل أنواعاً فارغة
    if (mime && !Object.keys(MIME_WHITELIST).includes(mime)) {
      throw new Error("نوع الملف غير مدعوم");
    }
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`حجم الملف يتجاوز ${MAX_SIZE_MB} ميجابايت`);
  }
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "/");
  const dir = path.join(STORAGE_ROOT, officeId, safeFolder);
  await fs.mkdir(dir, { recursive: true });
  const id = crypto.randomBytes(12).toString("hex");
  const fileName = `${id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, fileName), buffer);
  return { path: `${officeId}/${safeFolder}/${fileName}`, size: file.size, mime, name: file.name };
}

/** قراءة ملف للتقديم عبر API بعد التحقق من الصلاحيات */
export async function readStoredFile(relPath: string): Promise<{ buffer: Buffer; mime: string } | null> {
  // منع اجتياز المسار
  const normalized = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const abs = path.join(STORAGE_ROOT, normalized);
  if (!abs.startsWith(STORAGE_ROOT)) return null;
  try {
    const buffer = await fs.readFile(abs);
    const ext = abs.split(".").pop()?.toLowerCase();
    const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
    return { buffer, mime };
  } catch {
    return null;
  }
}

export function storageSizeMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}
