const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../middleware/auth');
const storage = require('../services/storageService');

const authResponse = (user) => ({ success: true, token: signToken(user), user });

/** Public registration always creates a normal user. Instructors/admins are created by an admin. */
async function register(req, res) {
  const { name, email, password, phone, district, language } = req.valid.body;
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  const user = await User.create({ name, email, password, phone, district, language, role: 'user' });
  res.status(201).json(authResponse(user));
}

async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password', 'INVALID_CREDENTIALS');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated', 'ACCOUNT_DISABLED');
  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });
  res.json(authResponse(user));
}

async function me(req, res) {
  res.json({ success: true, user: req.user });
}

async function updateMe(req, res) {
  const allowed = ['name', 'phone', 'district', 'agroZone', 'language'];
  for (const key of allowed) if (req.valid.body[key] !== undefined) req.user[key] = req.valid.body[key];
  if (req.valid.body.instructorProfile && req.user.role === 'instructor') {
    req.user.instructorProfile = { ...req.user.instructorProfile.toObject?.(), ...req.valid.body.instructorProfile };
  }
  await req.user.save();
  res.json({ success: true, user: req.user });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.valid.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect', 'INVALID_CREDENTIALS');
  }
  user.password = newPassword;
  await user.save();
  res.json(authResponse(user));
}

async function uploadAvatar(req, res) {
  if (!req.file) throw ApiError.badRequest('Please choose an image');
  const old = req.user.avatar?.publicId ? { ...req.user.avatar.toObject?.() } : null;
  const saved = await storage.saveImage(req.file, 'avatars');
  req.user.avatar = { url: saved.url, publicId: saved.publicId, provider: saved.provider };
  await req.user.save();
  if (old) await storage.deleteImage(old);
  res.json({ success: true, user: req.user });
}

async function setPushToken(req, res) {
  req.user.pushToken = req.valid.body.token || '';
  await req.user.save();
  res.json({ success: true });
}

module.exports = { register, login, me, updateMe, changePassword, uploadAvatar, setPushToken };
