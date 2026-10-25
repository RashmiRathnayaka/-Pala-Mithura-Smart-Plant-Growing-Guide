/**
 * API base URL.
 * 1. EXPO_PUBLIC_API_URL from mobile/.env wins (e.g. http://192.168.1.20:5000).
 * 2. Otherwise, in development, use the same computer that serves the Expo bundle
 *    (works on a real phone on the same Wi-Fi without any config).
 * 3. Web falls back to localhost.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 5000;

function guessDevHost() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];
  if (host) return `http://${host}:${API_PORT}`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}`; // Android emulator → host machine
  return `http://localhost:${API_PORT}`;
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? `http://localhost:${API_PORT}` : guessDevHost())).replace(/\/$/, '');

/** Stored image URLs are relative (/uploads/...) for local storage, absolute for Cloudinary. */
export function imageUrl(url) {
  if (!url) return null;
  return url.startsWith('/') ? `${API_URL}${url}` : url;
}
