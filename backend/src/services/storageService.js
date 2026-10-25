/**
 * Image storage. Two providers:
 *  - cloudinary: production storage (STORAGE_PROVIDER=cloudinary + credentials)
 *  - local:      files under backend/uploads, served at /uploads (safe fallback for local testing)
 *
 * Local images are stored with a *relative* URL (/uploads/...). The mobile app prefixes it
 * with the API base URL, so changing your LAN IP does not break stored images.
 */
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');

const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

let cloudinary = null;
let warned = false;

function activeProvider() {
  if (env.storageProvider === 'cloudinary') {
    const { cloudName, apiKey, apiSecret } = env.cloudinary;
    if (cloudName && apiKey && apiSecret) {
      if (!cloudinary) {
        cloudinary = require('cloudinary').v2;
        cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
      }
      return 'cloudinary';
    }
    if (!warned) {
      console.warn('[storage] STORAGE_PROVIDER=cloudinary but credentials are missing – falling back to local storage');
      warned = true;
    }
  }
  return 'local';
}

function safeSubfolder(sub) {
  return String(sub || 'misc').replace(/[^a-z0-9_-]/gi, '');
}

async function saveLocal(file, subfolder) {
  const dir = path.join(UPLOAD_ROOT, safeSubfolder(subfolder));
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${EXT[file.mimetype] || 'jpg'}`;
  await fs.writeFile(path.join(dir, name), file.buffer);
  const rel = `${safeSubfolder(subfolder)}/${name}`;
  return { url: `/uploads/${rel}`, publicId: rel, provider: 'local' };
}

function saveCloudinary(file, subfolder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${env.cloudinary.folder}/${safeSubfolder(subfolder)}`, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          provider: 'cloudinary',
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(file.buffer);
  });
}

async function saveImage(file, subfolder = 'misc') {
  return activeProvider() === 'cloudinary' ? saveCloudinary(file, subfolder) : saveLocal(file, subfolder);
}

async function saveImages(files = [], subfolder = 'misc') {
  return Promise.all(files.map((f) => saveImage(f, subfolder)));
}

async function deleteImage(image) {
  if (!image) return;
  try {
    if (image.provider === 'cloudinary' && activeProvider() === 'cloudinary') {
      await cloudinary.uploader.destroy(image.publicId);
    } else if (image.provider === 'local' && image.publicId) {
      const target = path.resolve(UPLOAD_ROOT, image.publicId);
      if (target.startsWith(UPLOAD_ROOT)) await fs.unlink(target);
    }
  } catch (err) {
    console.warn('[storage] could not delete image', image.publicId, err.message);
  }
}

/** Reads an image's bytes (used to send photos to the AI model). */
async function readImage(image) {
  if (image.provider === 'local') {
    const target = path.resolve(UPLOAD_ROOT, image.publicId);
    if (!target.startsWith(UPLOAD_ROOT)) throw new Error('Invalid image path');
    return fs.readFile(target);
  }
  const res = await fetch(image.url);
  if (!res.ok) throw new Error(`Could not download image (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

module.exports = { saveImage, saveImages, deleteImage, readImage, activeProvider, UPLOAD_ROOT };
