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

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();

  const go = async () => {
    if (!username || !password) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }
    setBusy(true);
    const ok = await login(username.trim(), password);
    setBusy(false);
    if (!ok) Alert.alert('Login Failed', 'Invalid credentials.');
  };

  return (
    <ScrollView contentContainerStyle={s.c}>
      <Text style={s.logo}>🏥</Text>
      <Text style={s.title}>Patient Portal</Text>

      <Text style={s.label}>Username</Text>
      <TextInput
        style={s.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="username"
      />

      <Text style={s.label}>Password</Text>
      <TextInput
        style={s.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      <TouchableOpacity
        style={[s.btn, busy && { opacity: 0.6 }]}
        onPress={go}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnT}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={s.btn2}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={s.btn2T}>Create Patient Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 24, backgroundColor: '#f5f7fa', flexGrow: 1, justifyContent: 'center' },
  logo: { fontSize: 64, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  label: { color: '#444', fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, marginTop: 20 },
  btnT: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  btn2: {
    borderWidth: 2,
    borderColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  btn2T: { color: '#007AFF', textAlign: 'center', fontWeight: '600' },
});