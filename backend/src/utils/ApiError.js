/**
 * Error with an HTTP status code and a machine-readable code.
 * The mobile app maps `code` to a Sinhala/English message.
 */
class ApiError extends Error {
  constructor(status, message, code = 'ERROR', details) {
    super(message);
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }
}

module.exports = ApiError;
