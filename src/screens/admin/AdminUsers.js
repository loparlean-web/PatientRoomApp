import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setUsers(await API.adminGetUsers());
    } catch (e) {
      console.warn(e.message);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 60 }}>👥</Text>
        <Text style={s.emptyT}>No registered patients</Text>
        <Text style={s.emptySub}>
          A patient must register using the "Create Patient Account" button.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.c}>
      <View style={s.header}>
        <Text style={s.title}>👥 Patients</Text>
        <Text style={s.count}>{users.length} total</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarT}>
                {item.name?.[0]?.toUpperCase() || 'P'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>
                @{item.username} · {item.id}
              </Text>
              <Text style={s.meta}>{item.email || 'no email'}</Text>
              <Text style={s.meta}>
                📞 {item.phone || 'no phone'} · 🎂 {item.age || '—'}
              </Text>
            </View>
          </View>
        )}
      />

      <Text style={s.footer}>💾 Data source: local API</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyT: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { color: '#888', marginTop: 6, textAlign: 'center', fontSize: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  count: { color: '#FF3B30', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarT: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  name: { fontWeight: '700', fontSize: 15 },
  meta: { color: '#888', fontSize: 12, marginTop: 2 },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 12 },
});