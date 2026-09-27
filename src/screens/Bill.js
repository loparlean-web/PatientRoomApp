import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePayment } from '../PaymentContext';

export default function Bill({ navigation }) {
  const { bill, payments, reload } = usePayment();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Compute values
  const roomCharges = bill.roomCharges || 0;
  const services = bill.services || 0;
  const total = bill.total || 0;
  const paid = bill.paid || 0;
  const balance = total - paid;

  const isFullyPaid = balance <= 0;
  const isPartiallyPaid = paid > 0 && balance > 0;

  // 🔄 Reload bill on screen focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          await reload();
        } catch (e) {
          console.warn('Bill reload:', e.message);
        }
        setLoading(false);
      })();
    }, [reload])
  );

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  // 💳 Go to payment
  const goToPayment = () => {
    if (isFullyPaid) return;
    navigation.navigate('Payment', { balance });
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={s.loadingT}>Loading bill...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.c}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.title}>💊 Hospital Bill</Text>
        {isFullyPaid && (
          <View style={s.paidBadge}>
            <Text style={s.paidBadgeT}>✅ PAID</Text>
          </View>
        )}
        {isPartiallyPaid && (
          <View style={s.partialBadge}>
            <Text style={s.partialBadgeT}>⏳ PARTIAL</Text>
          </View>
        )}
      </View>

      {/* Bill Card */}
      <View style={s.card}>
        <Row label="Room Charges" value={`₱${roomCharges.toFixed(2)}`} />
        <Row label="Services" value={`₱${services.toFixed(2)}`} />

        <View style={s.divider} />

        <Row label="Total" value={`₱${total.toFixed(2)}`} bold />
        <Row
          label="Paid"
          value={`₱${paid.toFixed(2)}`}
          valueColor="#28a745"
        />
        <Row
          label="Balance"
          value={`₱${balance.toFixed(2)}`}
          bold
          valueColor={balance > 0 ? '#FF3B30' : '#28a745'}
        />
      </View>

      {/* Fully Paid Card */}
        {isFullyPaid && (
          <View style={s.paidCard}>
            <Text style={s.paidIcon}>🎉</Text>
            <Text style={s.paidTitle}>Fully Paid</Text>
            <Text style={s.paidText}>
              You have no outstanding balance. Thank you!
            </Text>
            <TouchableOpacity
              style={s.dischargeBtn}
              onPress={() => navigation.navigate('Main', { screen: 'MyRoom' })}
            >
              <Text style={s.dischargeBtnT}>
                🚪 Proceed to Discharge
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Partial Paid Card */}
      {isPartiallyPaid && (
        <View style={s.partialCard}>
          <Text style={s.partialIcon}>💡</Text>
          <Text style={s.partialTitle}>Partial Payment Received</Text>
          <Text style={s.partialText}>
            You still have an outstanding balance of ₱{balance.toFixed(2)}.
          </Text>
        </View>
      )}

      {/* Actions */}
      {!isFullyPaid && (
        <TouchableOpacity
          style={[s.btn, s.btnGreen]}
          onPress={goToPayment}
          activeOpacity={0.7}
        >
          <Text style={s.btnT}>💳 Make Payment</Text>
          <Text style={s.btnSubT}>Balance: ₱{balance.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {isFullyPaid && (
        <View style={[s.btn, s.btnDisabled]}>
          <Text style={s.btnDisabledT}>✅ Fully Paid</Text>
          <Text style={s.btnDisabledSub}>No payment needed</Text>
        </View>
      )}

      {/* Always show history */}
      <TouchableOpacity
        style={[s.btn, s.btnGrey]}
        onPress={() => navigation.navigate('History')}
        activeOpacity={0.7}
      >
        <Text style={s.btnT}>📜 Payment History ({payments.length})</Text>
      </TouchableOpacity>

      {/* Refresh */}
      <TouchableOpacity
        style={[s.btn, s.btnOutline]}
        onPress={onRefresh}
        disabled={refreshing}
      >
        <Text style={[s.btnT, { color: '#007AFF' }]}>
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </Text>
      </TouchableOpacity>

      <Text style={s.footer}>💾 Data source: local API</Text>
    </ScrollView>
  );
}

const Row = ({ label, value, bold, valueColor }) => (
  <View style={s.row}>
    <Text style={[s.label, bold && { fontWeight: '700' }]}>{label}</Text>
    <Text
      style={[
        s.value,
        bold && { fontWeight: '700' },
        valueColor && { color: valueColor },
      ]}
    >
      {value}
    </Text>
  </View>
);

const s = StyleSheet.create({
  c: { padding: 24, backgroundColor: '#f5f7fa', flexGrow: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingT: { marginTop: 12, color: '#666', fontSize: 13 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold' },

  paidBadge: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  paidBadgeT: { color: '#155724', fontSize: 11, fontWeight: '700' },
  partialBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  partialBadgeT: { color: '#856404', fontSize: 11, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  label: { color: '#666', fontSize: 14 },
  value: { fontWeight: '600', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },

  // Fully paid
  paidCard: {
    backgroundColor: '#d4edda',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#28a745',
  },
  paidIcon: { fontSize: 48 },
  paidTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#155724',
    marginTop: 8,
  },
  paidText: {
    color: '#155724',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  // Partial paid
  partialCard: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  partialIcon: { fontSize: 32 },
  partialTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#856404',
    marginTop: 6,
  },
  partialText: {
    color: '#856404',
    fontSize: 13,
    marginTop: 4,
  },

  // Buttons
  btn: {
    padding: 18,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnGreen: { backgroundColor: '#34C759' },
  btnGrey: { backgroundColor: '#8E8E93' },
  btnOutline: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  btnDisabled: {
    backgroundColor: '#d4edda',
    borderWidth: 2,
    borderColor: '#28a745',
  },
  btnDisabledT: {
    color: '#155724',
    fontWeight: '700',
    fontSize: 16,
  },
  btnDisabledSub: {
    color: '#155724',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSubT: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },

  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
    marginTop: 12,
  },
  dischargeBtn: {
  marginTop: 14,
  paddingVertical: 12,
  paddingHorizontal: 20,
  backgroundColor: '#155724',
  borderRadius: 8,
},
dischargeBtnT: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 14,
},
});