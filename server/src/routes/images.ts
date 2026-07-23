import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import sharp from 'sharp';
import { UPLOAD_DIR } from '../middleware/upload.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

export const imagesRouter = Router();

const CACHE_DIR = path.join(UPLOAD_DIR, '.cache');
mkdirSync(CACHE_DIR, { recursive: true });

// Whitelisted widths keep the cache bounded.
const WIDTHS = [320, 480, 640, 960, 1280, 1600];
const IMAGE_EXT = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif', '.gif']);

/**
 * GET /img/<file>?w=640
 * Serves a width-resized webp of an uploaded image, cached on disk.
 * Unknown widths fall back to the nearest allowed value.
 */
imagesRouter.get(
  '/:name',
  asyncHandler(async (req, res) => {
    const name = path.basename(req.params.name);
    if (!name || name.includes('..')) throw new HttpError(400, 'Некорректное имя файла');

    const ext = path.extname(name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) throw new HttpError(400, 'Не изображение');

    const source = path.join(UPLOAD_DIR, name);
    if (!existsSync(source)) throw new HttpError(404, 'Файл не найден');

    const requested = Number(req.query.w);
    const width = WIDTHS.includes(requested)
      ? requested
      : WIDTHS.reduce((best, w) => (Math.abs(w - requested) < Math.abs(best - requested) ? w : best), WIDTHS[0]);

    const cacheFile = path.join(CACHE_DIR, `${width}-${name}.webp`);

    if (!existsSync(cacheFile)) {
      await sharp(source)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(cacheFile);
    }

    res.type('image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    createReadStream(cacheFile).pipe(res);
  }),
);
