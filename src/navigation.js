import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from './AuthContext';

import Splash from './screens/Splash';
import Login from './screens/Login';
import Register from './screens/Register';
import Profile from './screens/Profile';
import RoomList from './screens/RoomList';
import RoomDetails from './screens/RoomDetails';
import MyRoom from './screens/MyRoom';
import NfcScan from './screens/NfcScan';
import Bill from './screens/Bill';
import Payment from './screens/Payment';
import History from './screens/History';

import AdminDashboard from './screens/admin/AdminDashboard';
import AdminUsers from './screens/admin/AdminUsers';
import AdminRooms from './screens/admin/AdminRooms';
import AdminReservations from './screens/admin/AdminReservations';
import AdminEditRoom from './screens/admin/AdminEditRoom';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icon = (e) => () => <Text style={{ fontSize: 20 }}>{e}</Text>;

const stackHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: '#fff' },
  headerTintColor: '#007AFF',
  headerTitleStyle: { fontWeight: '700', color: '#111' },
  headerBackTitle: 'Back',
};

function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen name="Rooms" component={RoomList} options={{ tabBarIcon: icon('🏥') }} />
      <Tab.Screen name="MyRoom" component={MyRoom} options={{ tabBarIcon: icon('🛏️'), title: 'My Room' }} />
      <Tab.Screen name="NFC" component={NfcScan} options={{ tabBarIcon: icon('📱') }} />
      <Tab.Screen name="Bill" component={Bill} options={{ tabBarIcon: icon('💳') }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} options={{ tabBarIcon: icon('📊') }} />
      <Tab.Screen name="Users" component={AdminUsers} options={{ tabBarIcon: icon('👥') }} />
      <Tab.Screen name="Rooms" component={AdminRooms} options={{ tabBarIcon: icon('🛏️') }} />
      <Tab.Screen name="Reservations" component={AdminReservations} options={{ tabBarIcon: icon('📋') }} />
    </Tab.Navigator>
  );
}

export default function Navigator() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} options={{ ...stackHeaderOptions, title: 'Create Account' }} />
          </>
        ) : user.role === 'admin' ? (
          <>
            <Stack.Screen name="Main" component={AdminTabs} />
            <Stack.Screen name="AdminEditRoom" component={AdminEditRoom} options={{ ...stackHeaderOptions, title: 'Edit Room' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={PatientTabs} />
            <Stack.Screen name="RoomDetails" component={RoomDetails} options={{ ...stackHeaderOptions, title: 'Room Details' }} />
            <Stack.Screen name="Payment" component={Payment} options={{ ...stackHeaderOptions, title: 'Payment' }} />
            <Stack.Screen name="History" component={History} options={{ ...stackHeaderOptions, title: 'Payment History' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}