import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import CleaningScreen from '../screens/CleaningScreen';
import TaskListScreen from '../screens/TaskListScreen';
import LaundryScreen from '../screens/LaundryScreen';
import GroceryScreen from '../screens/GroceryScreen';
import HouseholdScreen from '../screens/HouseholdScreen';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.iconText, !focused && styles.iconTextInactive]}>
        {emoji}
      </Text>
    </View>
  );
}

function FoyerButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Household')}
      style={styles.foyerBtn}
    >
      <Text style={styles.foyerBtnText}>🏡</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 60,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryPale,
  },
  iconText: {
    fontSize: 22,
  },
  iconTextInactive: {
    opacity: 0.5,
  },
  foyerBtn: {
    marginRight: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  foyerBtnText: { fontSize: 22 },
});

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: { color: Colors.textDark, fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          headerRight: () => <FoyerButton />,
        }}
      />
      <Tab.Screen
        name="Cleaning"
        component={CleaningScreen}
        options={{
          title: 'Mode ménage',
          tabBarLabel: 'Ménage',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧹" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{
          title: 'Toutes les tâches',
          tabBarLabel: 'Tâches',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Laundry"
        component={LaundryScreen}
        options={{
          title: 'Lessive',
          tabBarLabel: 'Lessive',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👕" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Grocery"
        component={GroceryScreen}
        options={{
          title: 'Courses 🛒',
          tabBarLabel: 'Courses',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: { color: Colors.textDark, fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        headerBackTitle: 'Retour',
        headerTintColor: Colors.primary,
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Household"
        component={HouseholdScreen}
        options={{ title: 'Mon foyer', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

