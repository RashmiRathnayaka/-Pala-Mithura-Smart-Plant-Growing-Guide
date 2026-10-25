/**
 * Local reminders (watering, fertilizer, harvest). The backend computes each crop's own
 * schedule (GET /my-plants/reminders); the app schedules them as local notifications.
 * Local notifications work in Expo Go; remote push needs a development build.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './api';

const supported = Platform.OS !== 'web';
const MAX_SCHEDULED = 40; // stay well under OS limits (iOS allows 64)

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission() {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Garden reminders',
      // AndroidImportance is re-exported via `export *`, which the import plugin cannot see.
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Replaces all scheduled reminders with the latest schedule from the server. */
export async function syncReminders(t, loc) {
  if (!supported) return { scheduled: 0, permitted: false };
  const permitted = await ensurePermission();
  if (!permitted) return { scheduled: 0, permitted: false };
  const { items } = await api.get('/my-plants/reminders');
  await Notifications.cancelAllScheduledNotificationsAsync();
  const titles = { watering: 'remindWaterTitle', fertilizer: 'remindFertTitle', harvest: 'remindHarvestTitle' };
  const now = Date.now();
  let count = 0;
  for (const r of items) {
    if (count >= MAX_SCHEDULED) break;
    const when = new Date(r.dueAt).getTime();
    if (when <= now + 60000) continue;
    const plantName = r.nickname || loc(r.plantName);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${t(titles[r.type])} – ${plantName}`,
        body: r.type === 'fertilizer' && r.timing ? loc(r.timing) : plantName,
        data: { userPlantId: r.userPlantId, type: r.type },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(when), channelId: 'reminders' },
    });
    count += 1;
  }
  return { scheduled: count, permitted: true };
}
