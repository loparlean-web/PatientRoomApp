import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../AuthContext';

export default function Register() {
  const [f, setF] = useState({ name: '', username: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const up = (k, v) => setF({ ...f, [k]: v });

  const go = async () => {
    if (!f.name || !f.username || !f.password) {
      return Alert.alert('Error', 'Please fill in all required fields.');
    }
    if (f.password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    }
    setBusy(true);
    const ok = await register(f);
    setBusy(false);
    if (!ok) Alert.alert('Registration Failed', 'Username might already exist.');
  };

  return (
    <ScrollView contentContainerStyle={s.c}>
      <Text style={s.title}>Create Account</Text>
      <Text style={s.sub}>Fill in your details to register.</Text>

      <Text style={s.label}>Full Name *</Text>
      <TextInput
        style={s.input}
        value={f.name}
        onChangeText={(v) => up('name', v)}
        placeholder="John Doe"
      />

      <Text style={s.label}>Username *</Text>
      <TextInput
        style={s.input}
        value={f.username}
        onChangeText={(v) => up('username', v)}
        autoCapitalize="none"
        placeholder="johndoe"
      />

      <Text style={s.label}>Password *</Text>
      <TextInput
        style={s.input}
        value={f.password}
        onChangeText={(v) => up('password', v)}
        secureTextEntry
        placeholder="min 6 characters"
      />

      <Text style={s.label}>Phone</Text>
      <TextInput
        style={s.input}
        value={f.phone}
        onChangeText={(v) => up('phone', v)}
        keyboardType="phone-pad"
        placeholder="09171234567"
      />

      <TouchableOpacity
        style={[s.btn, busy && { opacity: 0.6 }]}
        onPress={go}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnT}>Register</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 24, backgroundColor: '#f5f7fa', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  sub: { color: '#666', marginBottom: 20, fontSize: 13 },
  label: { color: '#444', fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, marginTop: 24 },
  btnT: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});