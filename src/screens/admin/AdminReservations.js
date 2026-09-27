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
import API from '../../api';

export default function AdminReservations() {
  const [tab, setTab] = useState('active');
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [r, p] = await Promise.all([
        API.adminGetReservations(),
        API.adminGetPayments(),
      ]);
      setReservations(r);
      setPayments(p);
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
                <Text style={s.id}>{item.id}</Text>
                <Text style={s.meta}>
                  {tab === 'active'
                    ? `👤 ${item.user} · 🛏️ Room ${item.room}`
                    : `👤 ${item.userName}`}
                </Text>
                <Text style={s.meta}>
                  {tab === 'active'
                    ? `📅 ${item.checkIn}`
                    : `${item.method} · ${new Date(item.timestamp).toLocaleDateString()}`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {tab === 'active' ? (
                  <View
                    style={[s.badge, item.status === 'active' ? s.ok : s.muted]}
                  >
                    <Text style={s.badgeT}>{item.status.toUpperCase()}</Text>
                  </View>
                ) : (
                  <>
                    <Text style={s.amt}>₱{item.amount.toFixed(2)}</Text>
                    <View
                      style={[
                        s.badge,
                        item.status === 'successful' ? s.ok : s.fail,
                      ]}
                    >
                      <Text style={s.badgeT}>{item.status.toUpperCase()}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}

      <Text style={s.footer}>💾 Data source: local API</Text>
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
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  ok: { backgroundColor: '#d4edda' },
  fail: { backgroundColor: '#f8d7da' },
  muted: { backgroundColor: '#e0e0e0' },
  badgeT: { fontSize: 10, fontWeight: '700' },
  amt: { fontWeight: '700', fontSize: 14 },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 12 },
});