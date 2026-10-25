const multer = require('multer');
const mongoose = require('mongoose');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? `Each image must be ${env.maxImageSizeMb} MB or smaller`
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Too many files or unexpected file field'
          : err.message;
    error = new ApiError(400, msg, err.code);
  } else if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Validation failed', details);
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid value for ${err.path}`);
  } else if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`${field} already exists`, 'DUPLICATE');
  } else if (err && err.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON body');
  } else if (!(err instanceof ApiError)) {
    console.error('[error]', err);
    error = new ApiError(500, 'Something went wrong. Please try again.', 'INTERNAL');
  }

  const body = { success: false, error: { code: error.code, message: error.message } };
  if (error.details) body.error.details = error.details;
  if (!env.isProd && error.status === 500 && err.stack) body.error.stack = err.stack;
  res.status(error.status || 500).json(body);
}

module.exports = { notFound, errorHandler };
