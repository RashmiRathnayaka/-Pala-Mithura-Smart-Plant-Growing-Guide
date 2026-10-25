const ApiError = require('../utils/ApiError');

/**
 * Validates req.body / req.query / req.params against zod schemas.
 * Parsed (coerced, stripped) values are stored on req.valid.{body,query,params}.
 * (Express 5 makes req.query read-only, so we never overwrite it.)
 */
function validate(schemas) {
  return (req, _res, next) => {
    req.valid = req.valid || {};
    for (const key of ['params', 'query', 'body']) {
      if (!schemas[key]) continue;
      const result = schemas[key].safeParse(req[key] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((i) => ({
          field: [key, ...i.path].join('.'),
          message: i.message,
        }));
        return next(ApiError.badRequest('Validation failed', details));
      }
      req.valid[key] = result.data;
    }
    next();
  };
}

module.exports = validate;
