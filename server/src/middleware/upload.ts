import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const FILE_MIME = new Set(['application/pdf']);

// In-memory buffer; we post-process (resize images) before writing to disk.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME.has(file.mimetype) || FILE_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error('Разрешены только изображения (jpg, png, webp) и PDF'));
  },
});

function randomName(ext: string): string {
  return `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
}

/// Saves an uploaded file to disk. Images are resized to max 1600px wide and
/// re-encoded to webp; other files (PDF) are stored as-is. Returns the public URL path.
export async function saveUploadedFile(file: Express.Multer.File): Promise<string> {
  if (IMAGE_MIME.has(file.mimetype)) {
    const name = randomName('.webp');
    const buffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(path.join(UPLOAD_DIR, name), buffer);
    return `/uploads/${name}`;
  }
  const ext = path.extname(file.originalname) || '.pdf';
  const name = randomName(ext);
  await writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return `/uploads/${name}`;
}
