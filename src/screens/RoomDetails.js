import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';

export default function RoomDetails({ route, navigation }) {
  const { roomId } = route.params;
  const [room, setRoom] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, resv] = await Promise.all([
        API.getRoom(roomId),
        API.getCurrentReservation(),
      ]);
      setRoom(r);
      setReservation(resv);
    } catch (e) {
      Alert.alert('Error', e.message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
    setLoading(false);
  }, [roomId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleReserve = () => {
    if (reservation) {
      return Alert.alert(
        'Active Reservation Exists',
        `You already have Room ${reservation.room.number} reserved. Please cancel it before reserving another.`,
        [
          { text: 'OK' },
          {
            text: 'View My Room',
            onPress: () => navigation.navigate('Main', { screen: 'MyRoom' }),
          },
        ]
      );
    }

    Alert.alert(
      'Confirm Reservation',
      `Reserve Room ${room.number} (${room.type}) for ₱${room.price.toFixed(2)}/day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reserve',
          onPress: async () => {
            setBusy(true);
            try {
              await API.reserveRoom(room.id);
              await load();
              Alert.alert(
                '✅ Reserved!',
                `Room ${room.number} is now yours.`,
                [
                  { text: 'OK', onPress: () => navigation.goBack() },
                  {
                    text: 'View My Room',
                    onPress: () =>
                      navigation.navigate('Main', { screen: 'MyRoom' }),
                  },
                ]
              );
            } catch (e) {
              Alert.alert('Reservation Failed', e.message);
            }
            setBusy(false);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Reservation',
      `Cancel your reservation for Room ${room.number}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await API.cancelReservation(reservation.id);
              await load();
              Alert.alert('✅ Cancelled', 'Reservation removed.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
            setBusy(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={s.center}>
        <Text style={s.error}>Room not found.</Text>
      </View>
    );
  }

  const isMine = reservation?.room?.id === room.id;
  const hasOtherReservation = reservation && !isMine;
  const canReserve = room.status === 'available' && !reservation;

  return (
    <ScrollView contentContainerStyle={s.c}>
      <View style={s.headerCard}>
        <Text style={s.roomLabel}>Room</Text>
        <Text style={s.roomNumber}>{room.number}</Text>
        <Text style={s.roomType}>{room.type}</Text>
        <View style={[s.statusBadge, statusColor(room.status)]}>
          <Text style={s.statusText}>{room.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Row label="Room Number" value={room.number} />
        <Row label="Type" value={room.type} />
        <Row
          label="Price"
          value={`₱${room.price.toFixed(2)} / day`}
          valueColor="#007AFF"
        />
        <Row
          label="Status"
          value={room.status.toUpperCase()}
          valueColor={
            room.status === 'available'
              ? '#28a745'
              : room.status === 'reserved'
              ? '#856404'
              : '#dc3545'
          }
        />
      </View>

      {isMine && (
        <View style={s.bannerGreen}>
          <Text style={s.bannerGreenT}>✅ This room is reserved by you</Text>
        </View>
      )}

      {hasOtherReservation && (
        <View style={s.bannerYellow}>
          <Text style={s.bannerYellowT}>
            ⚠️ You already have Room {reservation.room.number} reserved. Please
            cancel it before reserving another.
          </Text>
        </View>
      )}

      {canReserve && (
        <TouchableOpacity
          style={[s.btn, s.btnGreen, busy && { opacity: 0.6 }]}
          onPress={handleReserve}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnT}>🛏️ Reserve Room</Text>
          )}
        </TouchableOpacity>
      )}

      {isMine && (
        <TouchableOpacity
          style={[s.btn, s.btnRed, busy && { opacity: 0.6 }]}
          onPress={handleCancel}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnT}>❌ Cancel Reservation</Text>
          )}
        </TouchableOpacity>
      )}

      {!canReserve && !isMine && (
        <TouchableOpacity style={[s.btn, s.btnGrey]} disabled>
          <Text style={s.btnT}>
            {room.status === 'occupied'
              ? '🚫 Occupied'
              : room.status === 'reserved'
              ? '🚫 Already Reserved'
              : '🚫 Unavailable'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const Row = ({ label, value, valueColor }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={[s.rowValue, valueColor && { color: valueColor }]}>
      {value}
    </Text>
  </View>
);

const statusColor = (st) =>
  st === 'available'
    ? { backgroundColor: '#d4edda' }
    : st === 'reserved'
    ? { backgroundColor: '#fff3cd' }
    : { backgroundColor: '#f8d7da' };

const s = StyleSheet.create({
  c: { padding: 20, backgroundColor: '#f5f7fa', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#FF3B30', fontSize: 16 },
  headerCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  roomLabel: { color: '#fff', fontSize: 12, opacity: 0.9 },
  roomNumber: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  roomType: { color: '#fff', fontSize: 16, opacity: 0.9, marginTop: 4 },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontWeight: '700', fontSize: 12, color: '#333' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  rowLabel: { color: '#666' },
  rowValue: { fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  bannerGreen: {
    backgroundColor: '#d4edda',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerGreenT: { color: '#155724', fontWeight: '600', fontSize: 13 },
  bannerYellow: {
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  bannerYellowT: { color: '#856404', fontSize: 13 },
  btn: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnGreen: { backgroundColor: '#34C759' },
  btnRed: { backgroundColor: '#FF3B30' },
  btnGrey: { backgroundColor: '#C7C7CC' },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 16 },
});