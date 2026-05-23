import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Configure how notifications are displayed when app is in foreground ────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Request permission ──────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Rappels quotidiens',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C4622A',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Schedule all recurring notifications ───────────────────────────────────
export async function scheduleAllNotifications(): Promise<void> {
  // Cancel previous to avoid duplicates on re-schedule
  await Notifications.cancelAllScheduledNotificationsAsync();

  const channel = Platform.OS === 'android' ? 'reminders' : undefined;

  // 🐱 Matin 10h — nourriture + eau
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🐱 Mitsu — matin',
      body: "Vérifie la nourriture et l'eau de Mitsu !",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
      ...(channel && { channelId: channel }),
    },
  });

  // 🐱 Soir 20h — nourriture + eau + litière
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🐱 Mitsu — soir',
      body: 'Nourriture, eau et litière de Mitsu 🪣',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
      ...(channel && { channelId: channel }),
    },
  });

  // 🌿 Lundi 9h — arrosage des plantes (weekday: 2 = lundi, 1=dimanche)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌿 Plantes',
      body: "C'est lundi ! N'oublie pas d'arroser les plantes.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2,
      hour: 9,
      minute: 0,
      ...(channel && { channelId: channel }),
    },
  });
}
