import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '../middleware/upload.js';
import { prisma } from './prisma.js';

/** True when the path still belongs to some record — then it must not be removed from disk. */
async function isStillReferenced(url: string): Promise<boolean> {
  const [banner, category, product, variant, certImage, certFile] = await Promise.all([
    // A banner holds four artworks and the same file may legitimately serve
    // more than one breakpoint, so all four columns have to be consulted.
    prisma.banner.count({
      where: { OR: [{ image: url }, { imageSm: url }, { imageMd: url }, { imageLg: url }] },
    }),
    prisma.category.count({ where: { image: url } }),
    prisma.product.count({ where: { image: url } }),
    prisma.productVariant.count({ where: { image: url } }),
    prisma.certificate.count({ where: { image: url } }),
    prisma.certificate.count({ where: { fileUrl: url } }),
  ]);
  return banner + category + product + variant + certImage + certFile > 0;
}

/**
 * Removes a previously uploaded file from disk.
 * Only touches paths under /uploads/, and only when no record references them any more
 * (seed data intentionally shares one image across a category and its products).
 * Never throws: a failed cleanup must not fail the request that triggered it.
 */
export async function deleteUpload(url?: string | null): Promise<void> {
  if (!url || typeof url !== 'string') return;
  if (!url.startsWith('/uploads/')) return;

  const name = path.basename(url);
  // Guard against traversal — basename already strips it, but be explicit.
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) return;

  try {
    if (await isStillReferenced(url)) return;
    await unlink(path.join(UPLOAD_DIR, name));
  } catch {
    /* already gone, or the reference check failed — leave the file in place */
  }
}

/** Deletes several upload paths, ignoring blanks. */
export async function deleteUploads(urls: (string | null | undefined)[]): Promise<void> {
  await Promise.all(urls.map((u) => deleteUpload(u)));
}

/** Deletes `oldUrl` when it has been replaced by a different `newUrl`. */
export async function deleteReplaced(oldUrl?: string | null, newUrl?: string | null): Promise<void> {
  if (oldUrl && oldUrl !== newUrl) await deleteUpload(oldUrl);
}
