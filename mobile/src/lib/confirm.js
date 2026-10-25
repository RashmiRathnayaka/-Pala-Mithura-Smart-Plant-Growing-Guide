import { Alert, Platform } from 'react-native';

/** Cross-platform confirm dialog (Alert buttons are not supported on web). */
export function confirmAction({ title, message = '', confirmText, cancelText, destructive = true, onConfirm }) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}${message ? `\n\n${message}` : ''}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

/** Cross-platform message box. */
export function notify(title, message = '') {
  if (Platform.OS === 'web') globalThis.alert?.(`${title}${message ? `\n\n${message}` : ''}`);
  else Alert.alert(title, message);
}
