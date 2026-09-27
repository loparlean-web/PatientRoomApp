import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import API from '../api';

export default function RoomList({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [reservation, setReservation] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [r, resv] = await Promise.all([
        API.getRooms(),
        API.getCurrentReservation(),
      ]);
      setRooms(r);
      setReservation(resv);
    } catch (e) {
      console.warn(e.message);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = rooms.filter(
    (r) => filter === 'all' || r.type.toLowerCase() === filter
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={s.c}>
      <View style={s.header}>
        <Text style={s.title}>Available Rooms</Text>
        <Text style={s.count}>{rooms.length} total</Text>
      </View>

      <View style={s.filters}>
        {['all', 'private', 'semi-private'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipOn]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipT, filter === f && s.chipTOn]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {reservation && (
        <TouchableOpacity
          style={s.activeBanner}
          onPress={() => navigation.navigate('MyRoom')}
        >
          <Text style={s.activeBannerT}>
            ✅ You have Room {reservation.room.number} reserved — tap to view
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const isMine = reservation?.room?.id === item.id;
          return (
            <TouchableOpacity
              style={[s.card, isMine && s.cardMine]}
              onPress={() => navigation.navigate('RoomDetails', { roomId: item.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.num}>Room {item.number}</Text>
                <Text style={s.type}>{item.type}</Text>
                <Text style={s.price}>₱{item.price.toFixed(2)} / day</Text>
                {isMine && <Text style={s.mineTag}>⭐ Your reservation</Text>}
              </View>
              <View style={[s.badge, badgeColor(item.status)]}>
                <Text style={s.badgeT}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const badgeColor = (st) =>
  st === 'available'
    ? { backgroundColor: '#d4edda' }
    : st === 'reserved'
    ? { backgroundColor: '#fff3cd' }
    : { backgroundColor: '#f8d7da' };

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  count: { color: '#007AFF', fontWeight: '700', fontSize: 12 },
  filters: { flexDirection: 'row', marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  chipOn: { backgroundColor: '#007AFF' },
  chipT: { fontSize: 12, color: '#333' },
  chipTOn: { color: '#fff', fontWeight: '600' },
  activeBanner: {
    backgroundColor: '#d4edda',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  activeBannerT: { color: '#155724', fontWeight: '600', fontSize: 13 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardMine: { borderColor: '#34C759', backgroundColor: '#f0fff4' },
  num: { fontSize: 18, fontWeight: 'bold' },
  type: { color: '#666', marginTop: 2 },
  price: { color: '#007AFF', marginTop: 4, fontWeight: '600' },
  mineTag: { color: '#34C759', marginTop: 4, fontSize: 12, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeT: { fontSize: 11, fontWeight: '700' },
});