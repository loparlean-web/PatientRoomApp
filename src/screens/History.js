import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { usePayment } from '../PaymentContext';

export default function History() {
  const { payments } = usePayment();

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
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.id}>{item.id}</Text>
              <Text style={s.meta}>{new Date(item.timestamp).toLocaleString()}</Text>
              <Text style={s.meta}>{item.method}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.amt}>₱{item.amount.toFixed(2)}</Text>
              <View style={[s.badge, item.status === 'successful' ? s.ok : s.fail]}>
                <Text style={s.badgeT}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        )}
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
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 6 },
  ok: { backgroundColor: '#d4edda' },
  fail: { backgroundColor: '#f8d7da' },
  badgeT: { fontSize: 10, fontWeight: '700' },
});