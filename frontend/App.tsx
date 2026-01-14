import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { palette } from './src/theme';
import LoadingScreen from './src/components/LoadingScreen';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import ClientDetailsScreen from './src/screens/ClientDetailsScreen';
import ClientHomeScreen from './src/screens/ClientHomeScreen';
import RoutineManagementScreen from './src/screens/RoutineManagementScreen';
import DietManagementScreen from './src/screens/DietManagementScreen';
import ProgressHistoryScreen from './src/screens/ProgressHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PendingApprovalScreen from './src/screens/PendingApprovalScreen';

const Stack = createNativeStackNavigator<any>();

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Cargando..." />;
  }

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : user.role === 'admin' ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
          <Stack.Screen name="RoutineManagement" component={RoutineManagementScreen as any} />
          <Stack.Screen name="DietManagement" component={DietManagementScreen} />
          <Stack.Screen 
            name="ProgressHistory" 
            component={ProgressHistoryScreen as any}
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: palette.background },
              headerTintColor: palette.primary,
              headerTitleStyle: { color: palette.text }
            }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      ) : user.is_approved === false ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="ClientHome" 
            component={ClientHomeScreen}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
