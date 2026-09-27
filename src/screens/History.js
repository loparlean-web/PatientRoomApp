import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';

export default function History() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (e) {
      console.warn('History load:', e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (payments.length === 0) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 60 }}>📭</Text>
        <Text style={s.emptyT}>No payments yet</Text>
      </View>
    );
  }

  return (
    <View style={s.c}>
      <Text style={s.title}>📜 Payment History</Text>
      <FlatList
        data={payments}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const isPaid = item.status === 'paid';
          return (
            <View style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.id}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={s.meta}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
                <Text style={s.meta}>{item.method || '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.amt}>
                  ₱{Number(item.amount).toFixed(2)}
                </Text>
                <View style={[s.badge, isPaid ? s.ok : s.fail]}>
                  <Text style={s.badgeT}>
                    {isPaid ? 'PAID' : (item.status || '').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyT: { color: '#888', marginTop: 12 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  id: { fontWeight: '600', fontSize: 12 },
  meta: { color: '#888', fontSize: 11, marginTop: 2 },
  amt: { fontWeight: '700', fontSize: 16 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  ok: { backgroundColor: '#d4edda' },
  fail: { backgroundColor: '#f8d7da' },
  badgeT: { fontSize: 10, fontWeight: '700' },
});