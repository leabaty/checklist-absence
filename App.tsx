import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { HouseholdProvider } from './src/context/HouseholdContext';
import { TaskProvider } from './src/context/TaskContext';
import {
  requestNotificationPermission,
  scheduleAllNotifications,
} from './src/notifications';
import { Colors } from './src/theme/colors';

export default function App() {
  useEffect(() => {
    (async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleAllNotifications();
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <HouseholdProvider>
          <TaskProvider>
            <NavigationContainer>
              <StatusBar style="dark" translucent={false} backgroundColor={Colors.background} />
              <AppNavigator />
            </NavigationContainer>
          </TaskProvider>
        </HouseholdProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
