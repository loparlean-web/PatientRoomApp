import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export default function AdminReservations() {
  const [tab, setTab] = useState('active');
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [resvRes, payRes] = await Promise.all([
        // Reservations with joined profile + room
        supabase
          .from('reservations')
          .select(`
            *,
            profile:profiles (username, full_name),
            room:rooms (room_number)
          `)
          .order('created_at', { ascending: false }),

        // Payments with joined profile
        supabase
          .from('payments')
          .select(`
            *,
            profile:profiles (username, full_name)
          `)
          .order('created_at', { ascending: false }),
      ]);

      if (resvRes.error) throw resvRes.error;
      if (payRes.error) throw payRes.error;

      setReservations(
        (resvRes.data || []).map((r) => ({
          ...r,
          user: r.profile?.full_name || r.profile?.username || 'Unknown',
          room: r.room?.room_number || '?',
          checkIn: new Date(r.created_at).toLocaleDateString(),
        }))
      );

      setPayments(
        (payRes.data || []).map((p) => ({
          ...p,
          userName: p.profile?.full_name || p.profile?.username || 'Unknown',
          amount: Number(p.amount),
          timestamp: p.created_at,
        }))
      );
    } catch (e) {
      console.warn('AdminReservations load:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  const list = tab === 'active' ? reservations : payments;

  return (
    <View style={s.c}>
      <Text style={s.title}>📋 Reservations & Payments</Text>

      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'active' && s.tabOn]}
          onPress={() => setTab('active')}
        >
          <Text style={[s.tabT, tab === 'active' && s.tabTOn]}>
            Reservations ({reservations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'payments' && s.tabOn]}
          onPress={() => setTab('payments')}
        >
          <Text style={[s.tabT, tab === 'payments' && s.tabTOn]}>
            Payments ({payments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {list.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 50 }}>📭</Text>
          <Text style={s.emptyT}>No records yet</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.id}>
                  #{item.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text style={s.meta}>
                  {tab === 'active'
                    ? `👤 ${item.user} · 🛏️ Room ${item.room}`
                    : `👤 ${item.userName}`}
                </Text>
                <Text style={s.meta}>
                  {tab === 'active'
                    ? `📅 ${item.checkIn}`
                    : `${item.method || '—'} · ${new Date(
                        item.timestamp
                      ).toLocaleDateString()}`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {tab === 'active' ? (
                  <View
                    style={[
                      s.badge,
                      item.status === 'active' || item.status === 'pending'
                        ? s.ok
                        : item.status === 'cancelled'
                        ? s.fail
                        : s.muted,
                    ]}
                  >
                    <Text style={s.badgeT}>{item.status.toUpperCase()}</Text>
                  </View>
                ) : (
                  <>
                    <Text style={s.amt}>₱{item.amount.toFixed(2)}</Text>
                    <View
                      style={[
                        s.badge,
                        item.status === 'paid' ? s.ok : s.fail,
                      ]}
                    >
                      <Text style={s.badgeT}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}

      <Text style={s.footer}>☁️ Data source: Supabase</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  tabs: { flexDirection: 'row', marginBottom: 12 },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: '#FF3B30' },
  tabT: { fontSize: 12, color: '#333', fontWeight: '600' },
  tabTOn: { color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyT: { color: '#888', marginTop: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  id: { fontWeight: '700', fontSize: 12 },
  meta: { color: '#666', fontSize: 12, marginTop: 3 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  ok: { backgroundColor: '#d4edda' },
  fail: { backgroundColor: '#f8d7da' },
  muted: { backgroundColor: '#e0e0e0' },
  badgeT: { fontSize: 10, fontWeight: '700' },
  amt: { fontWeight: '700', fontSize: 14 },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 12 },
});