const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/** Checks the file's magic bytes so a renamed non-image cannot slip through. */
function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxImageSizeMb * 1024 * 1024, files: 6 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new ApiError(415, 'Only JPEG, PNG or WebP images are allowed', 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
});

/** Verifies the actual bytes of every uploaded file after multer has buffered it. */
function verifyImageBytes(req, _res, next) {
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : req.file ? [req.file] : [];
  for (const f of files) {
    const real = sniffImageType(f.buffer);
    if (!real) return next(new ApiError(415, `"${f.originalname}" is not a valid image`, 'INVALID_FILE_TYPE'));
    f.mimetype = real;
  }
  next();
}

const uploadImages = (field = 'photos', max = 6) => [multerInstance.array(field, max), verifyImageBytes];
const uploadImage = (field = 'image') => [multerInstance.single(field), verifyImageBytes];

module.exports = { uploadImages, uploadImage, sniffImageType, ALLOWED_MIME };
