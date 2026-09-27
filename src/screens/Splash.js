import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Splash() {
  return (
    <View style={s.c}>
      <Text style={s.logo}>🏥</Text>
      <Text style={s.t}>Patient Portal</Text>
      <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      <Text style={s.sub}>Loading offline data...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' },
  logo: { fontSize: 72 },
  t: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  sub: { color: '#888', marginTop: 12 },
});