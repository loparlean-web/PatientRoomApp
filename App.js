import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/AuthContext';
import { PaymentProvider } from './src/PaymentContext';
import Navigator from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <PaymentProvider>
          <Navigator />
        </PaymentProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}