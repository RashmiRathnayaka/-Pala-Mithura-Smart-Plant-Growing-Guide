const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function resolveUser(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token');
  }

  // Always load the user from the DB: role / active status may have changed since the token was issued.
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated', 'ACCOUNT_DISABLED');
  if (user.changedPasswordAfter(payload.iat)) throw ApiError.unauthorized('Password changed. Please log in again.');
  return user;
}

/** Requires a valid JWT. */
async function protect(req, _res, next) {
  const user = await resolveUser(req);
  if (!user) throw ApiError.unauthorized();
  req.user = user;
  next();
}

/** Attaches req.user when a valid token is present, but does not require one. */
async function optionalAuth(req, _res, next) {
  try {
    req.user = (await resolveUser(req)) || null;
  } catch {
    req.user = null;
  }
  next();
}

/** Role-based access control. Usage: authorize('instructor', 'admin') */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}

module.exports = { signToken, protect, optionalAuth, authorize };
