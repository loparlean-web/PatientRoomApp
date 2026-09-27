import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import API from '../../api';

export default function AdminEditRoom({ route, navigation }) {
  const { roomId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [room, setRoom] = useState(null);
  const [price, setPrice] = useState('');
  const [type, setType] = useState('Private');
  const [status, setStatus] = useState('available');

  useEffect(() => {
    (async () => {
      try {
        const r = await API.getRoom(roomId);
        setRoom(r);
        setPrice(String(r.price));
        setType(r.type);
        setStatus(r.status);
      } catch (e) {
        Alert.alert('Error', e.message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
      setLoading(false);
    })();
  }, [roomId]);

  const handleSave = async () => {
    const numericPrice = Number(price);

    if (!price || isNaN(numericPrice) || numericPrice <= 0) {
      return Alert.alert('Invalid Price', 'Please enter a positive number.');
    }
    if (numericPrice > 100000) {
      return Alert.alert('Price Too High', 'Maximum price is ₱100,000.');
    }

    setSaving(true);
    try {
      await API.adminUpdateRoom(roomId, { price: numericPrice, type, status });
      Alert.alert('✅ Saved', `Room ${room.number} updated successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const handleReset = () => {
    Alert.alert('Reset Changes?', 'Restore original values?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: () => {
          setPrice(String(room.price));
          setType(room.type);
          setStatus(room.status);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.c}>
        <View style={s.headerCard}>
          <Text style={s.roomLabel}>Editing</Text>
          <Text style={s.roomNumber}>Room {room.number}</Text>
          <Text style={s.roomId}>ID: {room.id}</Text>
        </View>

        <Text style={s.label}>💰 Price per Day (₱) *</Text>
        <TextInput
          style={s.input}
          value={price}
          onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          placeholder="3500"
          editable={!saving}
        />
        <Text style={s.hint}>
          Current: ₱{room.price.toFixed(2)} · New:{' '}
          ₱{isNaN(Number(price)) ? '0.00' : Number(price).toFixed(2)}
        </Text>

        <Text style={s.label}>🏠 Room Type</Text>
        <View style={s.row}>
          {['Private', 'Semi-Private'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.chip, type === t && s.chipOn]}
              onPress={() => setType(t)}
              disabled={saving}
            >
              <Text style={[s.chipT, type === t && s.chipTOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>📊 Status</Text>
        <View style={s.row}>
          {['available', 'reserved', 'occupied'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[s.chip, status === st && s.chipOn]}
              onPress={() => setStatus(st)}
              disabled={saving}
            >
              <Text style={[s.chipT, status === st && s.chipTOn]}>{st}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Change Summary</Text>
          <Row label="Room" value={room.number} />
          <Row
            label="Price"
            value={`₱${room.price.toFixed(2)} → ₱${
              isNaN(Number(price)) ? '0.00' : Number(price).toFixed(2)
            }`}
            highlight={Number(price) !== room.price}
          />
          <Row
            label="Type"
            value={`${room.type} → ${type}`}
            highlight={type !== room.type}
          />
          <Row
            label="Status"
            value={`${room.status} → ${status}`}
            highlight={status !== room.status}
          />
        </View>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#34C759' }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnT}>💾 Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#8E8E93' }]}
          onPress={handleReset}
          disabled={saving}
        >
          <Text style={s.btnT}>↩️ Reset Form</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#FF3B30' }]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={s.btnT}>✖ Cancel</Text>
        </TouchableOpacity>

        <Text style={s.footer}>💾 Data source: local API</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Row = ({ label, value, highlight }) => (
  <View style={s.rowItem}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={[s.rowValue, highlight && { color: '#FF9500' }]}>
      {value}
    </Text>
  </View>
);

const s = StyleSheet.create({
  c: { padding: 20, backgroundColor: '#f5f7fa', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#FF3B30', fontSize: 16 },
  headerCard: {
    backgroundColor: '#FF3B30',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  roomLabel: { color: '#fff', fontSize: 12, opacity: 0.9 },
  roomNumber: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  roomId: { color: '#fff', fontSize: 11, opacity: 0.8, marginTop: 4 },
  label: {
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  hint: { color: '#888', fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: { backgroundColor: '#007AFF' },
  chipT: { fontSize: 13, color: '#333', fontWeight: '600' },
  chipTOn: { color: '#fff' },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  summaryTitle: { fontWeight: '700', marginBottom: 10, fontSize: 14 },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  rowLabel: { color: '#666', fontSize: 13 },
  rowValue: { fontWeight: '600', fontSize: 13, flexShrink: 1, textAlign: 'right' },
  btn: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 12 },
});