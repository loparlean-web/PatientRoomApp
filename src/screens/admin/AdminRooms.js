import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export default function AdminRooms({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (error) throw error;

      setRooms(
        (data || []).map((r) => ({
          ...r,
          number: r.room_number,
          price: Number(r.price),
        }))
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const changeStatus = (room) => {
    Alert.alert(`Room ${room.number}`, 'Change status to:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Available', onPress: () => update(room.id, 'available') },
      { text: 'Reserved', onPress: () => update(room.id, 'reserved') },
      { text: 'Occupied', onPress: () => update(room.id, 'occupied') },
    ]);
  };

  const update = async (id, status) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const roomActions = (room) => {
    Alert.alert(
      `Room ${room.number}`,
      `Type: ${room.type}\nPrice: ₱${room.price.toFixed(2)}/day\nStatus: ${room.status}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✏️ Edit Room',
          onPress: () =>
            navigation.navigate('AdminEditRoom', { roomId: room.id }),
        },
        { text: '🔄 Change Status', onPress: () => changeStatus(room) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <View style={s.c}>
      <View style={s.header}>
        <Text style={s.title}>🛏️ Manage Rooms</Text>
        <Text style={s.count}>{rooms.length} rooms</Text>
      </View>
      <Text style={s.sub}>Tap a room to edit price, type, or status</Text>

      <FlatList
        data={rooms}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => roomActions(item)}>
            <View style={{ flex: 1 }}>
              <Text style={s.num}>Room {item.number}</Text>
              <Text style={s.type}>{item.type}</Text>
              <Text style={s.price}>₱{item.price.toFixed(2)} / day</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[s.badge, badgeColor(item.status)]}>
                <Text style={s.badgeT}>{item.status}</Text>
              </View>
              <Text style={s.editHint}>✏️ tap to edit</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Text style={s.footer}>☁️ Data source: Supabase</Text>
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
  c: { flex: 1, padding: 16, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  count: { color: '#FF3B30', fontWeight: '700' },
  sub: { color: '#888', fontSize: 12, marginTop: 4, marginBottom: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  num: { fontWeight: '700', fontSize: 16 },
  type: { color: '#666', fontSize: 12, marginTop: 4 },
  price: { color: '#007AFF', fontSize: 14, fontWeight: '600', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeT: { fontSize: 11, fontWeight: '700' },
  editHint: { color: '#999', fontSize: 10, marginTop: 6 },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 12 },
});