import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../AuthContext';
import API from '../api';

export default function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'End your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const resetDB = () => {
    Alert.alert(
      'Reset Database?',
      'All data (users, reservations, payments) will be erased and restored to defaults, including the admin account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await API.resetAll();
            await logout();
            Alert.alert('✅ Reset', 'Database reset to defaults.');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={s.center}>
        <Text>No user loaded.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.c}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avT}>{user.name?.[0]?.toUpperCase() || 'P'}</Text>
        </View>
        <Text style={s.name}>{user.name}</Text>
        <Text style={s.uname}>@{user.username}</Text>
        <View
          style={[
            s.roleTag,
            user.role === 'admin' ? s.adminTag : s.patientTag,
          ]}
        >
          <Text style={s.roleT}>
            {user.role === 'admin' ? '👨‍💼 ADMIN' : '👤 PATIENT'}
          </Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.secTitle}>Account Information</Text>
        <Row label="User ID" value={user.id} />
        <Row label="Role" value={user.role} />
        <Row label="Username" value={user.username} />
        <Row label="Name" value={user.name} />
        <Row label="Email" value={user.email || '—'} />
        <Row label="Phone" value={user.phone || '—'} />
        <Row label="Age" value={user.age ? String(user.age) : '—'} />
        <Row label="Blood Type" value={user.bloodType || '—'} />
        <Row label="NFC UID" value={user.nfcUid || 'Not linked'} />
      </View>

      <TouchableOpacity
        style={[s.btn, { backgroundColor: '#FF3B30' }]}
        onPress={handleLogout}
      >
        <Text style={s.btnT}>🚪 Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.btn, { backgroundColor: '#8E8E93' }]}
        onPress={resetDB}
      >
        <Text style={s.btnT}>🔄 Reset Database</Text>
      </TouchableOpacity>

      <Text style={s.footer}>💾 Data source: local API (AsyncStorage)</Text>
    </ScrollView>
  );
}

const Row = ({ label, value }) => (
  <View style={s.row}>
    <Text style={s.l}>{label}</Text>
    <Text style={s.v}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  c: { padding: 24, backgroundColor: '#f5f7fa', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avT: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold' },
  uname: { color: '#666' },
  roleTag: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  patientTag: { backgroundColor: '#d4edda' },
  adminTag: { backgroundColor: '#FFD7D5' },
  roleT: { fontSize: 12, fontWeight: '700', color: '#333' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 },
  secTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  l: { color: '#666' },
  v: { fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  btn: { padding: 16, borderRadius: 8, marginBottom: 10 },
  btnT: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 12 },
});