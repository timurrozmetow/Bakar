import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { upload, saveUploadedFile } from '../middleware/upload.js';

export const uploadsRouter = Router();

// POST /api/uploads  (multipart, field name "file") -> { url }
uploadsRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Файл не передан');
    const url = await saveUploadedFile(req.file);
    res.status(201).json({ url });
  }),
);
