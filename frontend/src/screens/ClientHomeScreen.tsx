import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StepsScreen from './StepsScreen';
import ClientDietScreen from './ClientDietScreen';
import ClientMealOptionsScreen from './ClientMealOptionsScreen';
import ClientExerciseScreen from './ClientExerciseScreen';
import ClientProgressScreen from './ClientProgressScreen';
import WorkoutScreen from './WorkoutScreen';
import SettingsScreen from './SettingsScreen';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme';
import { AppIcon } from '../components/AppIcon';

const Tab = createBottomTabNavigator();
const ExerciseStack = createNativeStackNavigator();
const DietStack = createNativeStackNavigator();

function ExerciseStackNavigator({ userId }: { userId: number }) {
  return (
    <ExerciseStack.Navigator screenOptions={{ headerShown: false }}>
      <ExerciseStack.Screen name="ExerciseList">
        {(props) => <ClientExerciseScreen {...props} clientId={userId} />}
      </ExerciseStack.Screen>
      <ExerciseStack.Screen name="Workout" component={WorkoutScreen} />
    </ExerciseStack.Navigator>
  );
}

function DietStackNavigator({ userId }: { userId: number }) {
  return (
    <DietStack.Navigator screenOptions={{ headerShown: false }}>
      <DietStack.Screen name="DietList">
        {(props) => <ClientDietScreen {...props} clientId={userId} />}
      </DietStack.Screen>
      <DietStack.Screen name="ClientMealOptions" component={ClientMealOptionsScreen} />
    </DietStack.Navigator>
  );
}

export default function ClientHomeScreen() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: palette.primaryLight,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="Steps"
        component={StepsScreen}
        options={{
          tabBarLabel: 'Pasos',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="footsteps-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Diet"
        children={() => <DietStackNavigator userId={user.id} />}
        options={{
          tabBarLabel: 'Dieta',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="nutrition-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Exercise"
        children={() => <ExerciseStackNavigator userId={user.id} />}
        options={{
          tabBarLabel: 'Ejercicio',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        children={() => <ClientProgressScreen clientId={user.id} />}
        options={{
          tabBarLabel: 'Progreso',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
