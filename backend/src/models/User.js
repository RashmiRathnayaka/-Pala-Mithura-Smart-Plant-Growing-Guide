const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER, index: true },
    isActive: { type: Boolean, default: true },
    language: { type: String, enum: ['si', 'en'], default: 'si' },
    district: { type: String, trim: true, default: '' },
    agroZone: { type: String, trim: true, default: '' },
    avatar: { url: String, publicId: String, provider: String },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }],
    instructorProfile: {
      qualification: { type: String, default: '' },
      organization: { type: String, default: '' },
      serviceArea: { type: String, default: '' },
    },
    pushToken: { type: String, default: '' },
    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** True if the password changed after the JWT was issued (token must be rejected). */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIssuedAtSec) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAtSec;
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.pushToken;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
