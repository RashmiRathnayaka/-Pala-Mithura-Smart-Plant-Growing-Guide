const { Notification, User } = require('../models');
const { ROLES } = require('../utils/constants');

/**
 * In-app notifications (stored in MongoDB, fetched by the app).
 * Push delivery via Expo can be added later using User.pushToken.
 */
async function notify(userId, { type, title, body = {}, data = {} }) {
  return Notification.create({ user: userId, type, title, body, data });
}

async function notifyRecommendationReady(rec) {
  return notify(rec.user, {
    type: 'recommendation_ready',
    title: { si: 'මූලික AI විශ්ලේෂණය සූදානම්', en: 'Preliminary AI analysis ready' },
    body: {
      si: 'ඔබේ ශාක ගැටලුව සඳහා මූලික යෝජනා සූදානම්. කෘෂිකර්ම උපදේශකවරයෙකු එය සමාලෝචනය කරනු ඇත.',
      en: 'Preliminary suggestions for your plant problem are ready. An Agricultural Instructor will review them.',
    },
    data: { recommendationId: rec._id.toString(), code: rec.recommendationCode },
  });
}

async function notifyReviewCompleted(rec) {
  const decision = rec.review.decision;
  const si = {
    accepted: 'උපදේශකවරයා AI නිර්දේශය අනුමත කළා.',
    modified: 'උපදේශකවරයා නිර්දේශය සංශෝධනය කර අනුමත කළා.',
    rejected: 'උපදේශකවරයා AI නිර්දේශය ප්‍රතික්ෂේප කළා. හේතුව සහ උපදෙස් බලන්න.',
  }[decision];
  const en = {
    accepted: 'The instructor approved the AI recommendation.',
    modified: 'The instructor modified and approved the recommendation.',
    rejected: 'The instructor rejected the AI recommendation. See the reason and advice.',
  }[decision];
  return notify(rec.user, {
    type: 'review_completed',
    title: { si: 'උපදේශක සමාලෝචනය අවසන්', en: 'Instructor review completed' },
    body: { si, en },
    data: { recommendationId: rec._id.toString(), code: rec.recommendationCode, decision },
  });
}

async function notifyInstructorsNewItem(rec) {
  const instructors = await User.find({ role: ROLES.INSTRUCTOR, isActive: true }).select('_id').lean();
  if (!instructors.length) return;
  await Notification.insertMany(
    instructors.map((i) => ({
      user: i._id,
      type: 'new_review_item',
      title: { si: 'සමාලෝචනය සඳහා නව නිර්දේශයක්', en: 'New recommendation to review' },
      body: { si: `${rec.recommendationCode} සමාලෝචනය සඳහා පෝලිමේ ඇත.`, en: `${rec.recommendationCode} is waiting in the review queue.` },
      data: { recommendationId: rec._id.toString(), code: rec.recommendationCode },
    }))
  );
}

module.exports = { notify, notifyRecommendationReady, notifyReviewCompleted, notifyInstructorsNewItem };
