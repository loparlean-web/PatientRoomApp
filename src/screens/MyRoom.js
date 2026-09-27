import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';

export default function MyRoom({ navigation }) {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch active/pending reservation with its room
      const { data: resvData, error: resvError } = await supabase
        .from('reservations')
        .select('*, room:rooms(*)')
        .eq('user_id', user.id)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resvError) throw resvError;

      if (!resvData) {
        setInfo(null);
        setLoading(false);
        return;
      }

      // 2. Fetch all payments for this user
      const { data: paymentsData, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id);

      if (payError) throw payError;

      // 3. Compute totals
      const room = resvData.room;
      const checkInRaw = resvData.created_at;
      const checkIn = new Date(checkInRaw);
      const days = Math.max(
        1,
        Math.ceil((Date.now() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      );
      const dailyRate = Number(room.price);
      const total = dailyRate * days;

      const paid = (paymentsData || [])
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const balance = Math.max(0, total - paid);
      const canCheckout = balance <= 0;

      setInfo({
        reservation: {
          id: resvData.id,
          checkIn: checkIn.toLocaleDateString(),
          room: {
            ...room,
            number: room.room_number,
            price: dailyRate,
          },
        },
        total,
        paid,
        balance,
        canCheckout,
      });
    } catch (e) {
      console.warn('Load checkout info:', e.message);
    }
    setLoading(false);
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

  const goToBill = () => navigation.navigate('Bill');

  // 🚪 Checkout / Discharge
  const handleCheckout = () => {
    if (!info) return;

    if (!info.canCheckout) {
      return Alert.alert(
        '⚠️ Cannot Discharge Yet',
        `You still have an outstanding balance of ₱${info.balance.toFixed(2)}.\n\nYou must fully pay your hospital bill before you can check out.`,
        [
          { text: 'OK' },
          { text: 'Go to Bill', onPress: goToBill },
        ]
      );
    }

    Alert.alert(
      '🏥 Confirm Discharge',
      `Are you sure you want to check out from Room ${info.reservation.room.number}?\n\nYour bill is fully paid. This will end your hospital stay.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Check Out',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              // 1. Mark reservation completed
              const { error: resvError } = await supabase
                .from('reservations')
                .update({ status: 'completed' })
                .eq('id', info.reservation.id);

              if (resvError) throw resvError;

              // 2. Free the room
              const { error: roomError } = await supabase
                .from('rooms')
                .update({ status: 'available' })
                .eq('id', info.reservation.room.id);

              if (roomError) throw roomError;

              const roomNumber = info.reservation.room.number;

              await load().catch(() => {});
              Alert.alert(
                '✅ Discharged',
                `You have successfully checked out from Room ${roomNumber}.\n\nThank you and get well soon!`,
                [{ text: 'OK' }]
              );
            } catch (e) {
              Alert.alert('Cannot Checkout', e.message);
            }
            setBusy(false);
          },
        },
      ]
    );
  };

  // ❌ Cancel reservation
  const handleCancel = () => {
    Alert.alert(
      'Cancel Reservation',
      `Cancel your reservation for Room ${info.reservation.room.number}?\n\nNote: You cannot cancel once you've requested discharge.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              // 1. Cancel reservation
              const { error: resvError } = await supabase
                .from('reservations')
                .update({ status: 'cancelled' })
                .eq('id', info.reservation.id);

              if (resvError) throw resvError;

              // 2. Free the room
              const { error: roomError } = await supabase
                .from('rooms')
                .update({ status: 'available' })
                .eq('id', info.reservation.room.id);

              if (roomError) throw roomError;

              await load().catch(() => {});
              Alert.alert('✅ Cancelled', 'Your reservation has been cancelled.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
            setBusy(false);
          },
        },
      ]
    );
  };

  const days = info?.reservation?.checkIn
    ? Math.max(
        1,
        Math.ceil(
          (new Date() - new Date(info.reservation.checkIn)) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 1;

  const estimate = (info?.reservation?.room?.price || 0) * days;

  // ---------- LOADING ----------
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={s.loadingT}>Loading your room...</Text>
      </View>
    );
  }

  // ---------- EMPTY STATE ----------
  if (!info || !info.reservation) {
    return (
      <ScrollView
        contentContainerStyle={s.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={s.emptyIcon}>🛏️</Text>
        <Text style={s.emptyTitle}>No Active Stay</Text>
        <Text style={s.emptyText}>
          You don't have an active room reservation.
        </Text>

        <TouchableOpacity
          style={[s.btn, s.btnBlue]}
          onPress={() => navigation.navigate('Rooms')}
        >
          <Text style={s.btnT}>🏥 Browse Rooms</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.btn, s.btnOutline]} onPress={onRefresh}>
          <Text style={[s.btnT, { color: '#007AFF' }]}>🔄 Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const { reservation, balance, total, paid, canCheckout } = info;

  return (
    <ScrollView
      contentContainerStyle={s.c}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero */}
      <View style={s.heroCard}>
        <Text style={s.heroLabel}>ROOM</Text>
        <Text style={s.heroNumber}>{reservation.room.number}</Text>
        <Text style={s.heroType}>{reservation.room.type}</Text>
        <View style={s.heroBadge}>
          <Text style={s.heroBadgeT}>✅ ACTIVE STAY</Text>
        </View>
      </View>

      {/* Reservation Details */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Reservation Details</Text>
        <Row label="Reservation ID" value={reservation.id.slice(0, 8) + '…'} />
        <Row
          label="Room"
          value={`${reservation.room.number} (${reservation.room.type})`}
        />
        <Row
          label="Daily Rate"
          value={`₱${reservation.room.price.toFixed(2)}`}
          valueColor="#007AFF"
        />
        <Row label="Check-in" value={reservation.checkIn} />
        <Row label="Days Admitted" value={`${days}`} />
      </View>

      {/* Bill Summary */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Bill Summary</Text>
        <Row label="Total Bill" value={`₱${total.toFixed(2)}`} />
        <Row
          label="Amount Paid"
          value={`₱${paid.toFixed(2)}`}
          valueColor="#28a745"
        />
        <View style={s.divider} />
        <Row
          label="Outstanding Balance"
          value={`₱${balance.toFixed(2)}`}
          valueColor={balance > 0 ? '#FF3B30' : '#28a745'}
          bold
        />
        <Row
          label="Stay Estimate"
          value={`₱${estimate.toFixed(2)}`}
          valueColor="#888"
        />
      </View>

      {/* Status Banner */}
      {canCheckout ? (
        <View style={s.bannerGreen}>
          <Text style={s.bannerGreenT}>
            ✅ Your bill is fully paid. You may now proceed to discharge.
          </Text>
        </View>
      ) : (
        <View style={s.bannerRed}>
          <Text style={s.bannerRedT}>
            ⚠️ You must fully pay your outstanding balance before you can
            check out of the hospital.
          </Text>
        </View>
      )}

      {/* Actions */}
      {!canCheckout && (
        <TouchableOpacity
          style={[s.btn, s.btnBlue, busy && { opacity: 0.6 }]}
          onPress={goToBill}
          disabled={busy}
        >
          <Text style={s.btnT}>💳 Go to Bill & Pay Balance</Text>
          <Text style={s.btnSubT}>Outstanding: ₱{balance.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {canCheckout && (
        <TouchableOpacity
          style={[s.btn, s.btnGreen, busy && { opacity: 0.6 }]}
          onPress={handleCheckout}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={s.btnT}>🚪 Discharge / Check Out</Text>
              <Text style={s.btnSubT}>End your hospital stay</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[s.btn, s.btnGrey]}
        onPress={onRefresh}
        disabled={busy || refreshing}
      >
        <Text style={s.btnT}>
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </Text>
      </TouchableOpacity>

      {!canCheckout && (
        <TouchableOpacity
          style={[s.btn, s.btnRed, busy && { opacity: 0.6 }]}
          onPress={handleCancel}
          disabled={busy}
        >
          <Text style={s.btnT}>❌ Cancel Reservation</Text>
        </TouchableOpacity>
      )}

      <Text style={s.footer}>☁️ Data source: Supabase</Text>
    </ScrollView>
  );
}

const Row = ({ label, value, valueColor, bold }) => (
  <View style={s.row}>
    <Text style={[s.rowLabel, bold && { fontWeight: '700' }]}>{label}</Text>
    <Text
      style={[
        s.rowValue,
        bold && { fontWeight: '700' },
        valueColor && { color: valueColor },
      ]}
    >
      {value}
    </Text>
  </View>
);

const s = StyleSheet.create({
  c: { padding: 20, backgroundColor: '#f5f7fa', flexGrow: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 24,
  },
  loadingT: { marginTop: 12, color: '#666', fontSize: 13 },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 24,
  },
  emptyIcon: { fontSize: 72, marginBottom: 12 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  emptyText: {
    color: '#888',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 14,
  },

  heroCard: {
    backgroundColor: '#007AFF',
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  heroLabel: {
    color: '#fff',
    fontSize: 12,
    letterSpacing: 3,
    opacity: 0.85,
    fontWeight: '600',
  },
  heroNumber: {
    color: '#fff',
    fontSize: 56,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  heroType: { color: '#fff', fontSize: 16, opacity: 0.9 },
  heroBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  heroBadgeT: { color: '#fff', fontWeight: '700', fontSize: 12 },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  rowLabel: { color: '#666', fontSize: 13 },
  rowValue: {
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 10 },

  bannerGreen: {
    backgroundColor: '#d4edda',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  bannerGreenT: {
    color: '#155724',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 20,
  },

  bannerRed: {
    backgroundColor: '#f8d7da',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  bannerRedT: {
    color: '#721c24',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 20,
  },

  btn: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnBlue: { backgroundColor: '#007AFF' },
  btnGreen: { backgroundColor: '#34C759' },
  btnRed: { backgroundColor: '#FF3B30' },
  btnGrey: { backgroundColor: '#8E8E93' },
  btnOutline: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSubT: { color: '#fff', fontSize: 12, marginTop: 4, opacity: 0.9 },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
    marginTop: 12,
  },
});