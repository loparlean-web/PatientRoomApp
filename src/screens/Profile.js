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

export default function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'End your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (!user) {
    return (
      <View style={s.center}>
        <Text>No user loaded.</Text>
      </View>
    );
  }

  // user_metadata is spread into the user object by AuthContext
  const displayName =
    user.full_name || user.fullName || user.username || 'Patient';

  return (
    <ScrollView contentContainerStyle={s.c}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avT}>{displayName[0]?.toUpperCase() || 'P'}</Text>
        </View>
        <Text style={s.name}>{displayName}</Text>
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
        <Row label="User ID" value={user.id?.slice(0, 12) + '…'} />
        <Row label="Role" value={user.role} />
        <Row label="Username" value={user.username} />
        <Row label="Name" value={displayName} />
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

      <Text style={s.footer}>☁️ Data source: Supabase</Text>
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
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
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