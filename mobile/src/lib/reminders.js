/**
 * Local reminders (watering, fertilizer, harvest). The backend computes each crop's own
 * schedule (GET /my-plants/reminders); the app schedules them as local notifications.
 *
 * expo-notifications is loaded lazily: Expo Go on Android no longer ships all of its native
 * parts, and importing it at startup crashes the app there. In Expo Go on Android and on web,
 * reminders are simply skipped. They work in a development or production build.
 */
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { api } from './api';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const supported = Platform.OS !== 'web' && !(isExpoGo && Platform.OS === 'android');
const MAX_SCHEDULED = 40; // stay well under OS limits (iOS allows 64)

let Notifications = null;
function loadNotifications() {
  if (!supported) return null;
  if (Notifications) return Notifications;
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.warn('[reminders] notifications unavailable:', err.message);
    Notifications = null;
  }
  return Notifications;
}

export const remindersSupported = () => !!loadNotifications();

async function ensurePermission(N) {
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('reminders', {
      name: 'Garden reminders',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  const req = await N.requestPermissionsAsync();
  return req.granted;
}

/** Replaces all scheduled reminders with the latest schedule from the server. */
export async function syncReminders(t, loc) {
  const N = loadNotifications();
  if (!N) return { scheduled: 0, permitted: false, supported: false };
  const permitted = await ensurePermission(N);
  if (!permitted) return { scheduled: 0, permitted: false, supported: true };
  const { items } = await api.get('/my-plants/reminders');
  await N.cancelAllScheduledNotificationsAsync();
  const titles = { watering: 'remindWaterTitle', fertilizer: 'remindFertTitle', harvest: 'remindHarvestTitle' };
  const now = Date.now();
  let count = 0;
  for (const r of items) {
    if (count >= MAX_SCHEDULED) break;
    const when = new Date(r.dueAt).getTime();
    if (when <= now + 60000) continue;
    const plantName = r.nickname || loc(r.plantName);
    await N.scheduleNotificationAsync({
      content: {
        title: `${t(titles[r.type])} – ${plantName}`,
        body: r.type === 'fertilizer' && r.timing ? loc(r.timing) : plantName,
        data: { userPlantId: r.userPlantId, type: r.type },
      },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: new Date(when), channelId: 'reminders' },
    });
    count += 1;
  }
  return { scheduled: count, permitted: true, supported: true };
}
