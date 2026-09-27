import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [
        patientsRes,
        roomsRes,
        activeResvRes,
        paymentsRes,
        revenueRes,
      ] = await Promise.all([
        // Count of patients
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'patient'),

        // All rooms (so we can break down by status)
        supabase.from('rooms').select('status'),

        // Active reservations
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'active']),

        // Payment count
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'paid'),

        // Revenue: only fetch amounts of paid payments
        supabase
          .from('payments')
          .select('amount')
          .eq('status', 'paid'),
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (roomsRes.error) throw roomsRes.error;
      if (activeResvRes.error) throw activeResvRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (revenueRes.error) throw revenueRes.error;

      const rooms = roomsRes.data || [];
      const revenue = (revenueRes.data || []).reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      setStats({
        totalUsers: patientsRes.count || 0,
        totalRooms: rooms.length,
        availableRooms: rooms.filter((r) => r.status === 'available').length,
        reservedRooms: rooms.filter((r) => r.status === 'reserved').length,
        occupiedRooms: rooms.filter((r) => r.status === 'occupied').length,
        activeReservations: activeResvRes.count || 0,
        totalPayments: paymentsRes.count || 0,
        totalRevenue: revenue,
      });
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

  const handleLogout = () => {
    Alert.alert('Logout', 'End admin session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading || !stats) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  const displayName = user?.full_name || user?.name || user?.username || 'Admin';

  return (
    <ScrollView contentContainerStyle={s.c}>
      <View style={s.header}>
        <View>
          <Text style={s.welcome}>👨‍💼 Admin Panel</Text>
          <Text style={s.name}>{displayName}</Text>
          <Text style={s.uid}>ID: {user?.id?.slice(0, 12)}…</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutT}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.section}>Overview</Text>
      <View style={s.grid}>
        <Stat
          icon="👥"
          label="Patients"
          value={stats.totalUsers}
          color="#007AFF"
        />
        <Stat
          icon="🛏️"
          label="Rooms"
          value={stats.totalRooms}
          color="#34C759"
        />
        <Stat
          icon="📋"
          label="Active Reservations"
          value={stats.activeReservations}
          color="#AF52DE"
        />
        <Stat
          icon="💳"
          label="Payments"
          value={stats.totalPayments}
          color="#FF9500"
        />
      </View>

      <Text style={s.section}>Room Status</Text>
      <View style={s.card}>
        <Row label="Available" value={stats.availableRooms} color="#28a745" />
        <Row label="Reserved" value={stats.reservedRooms} color="#856404" />
        <Row label="Occupied" value={stats.occupiedRooms} color="#dc3545" />
      </View>

      <Text style={s.section}>Revenue</Text>
      <View style={s.revenueCard}>
        <Text style={s.revenueLabel}>Total Collected</Text>
        <Text style={s.revenueValue}>₱{stats.totalRevenue.toFixed(2)}</Text>
      </View>

      <Text style={s.footer}>☁️ Data source: Supabase</Text>
    </ScrollView>
  );
}

const Stat = ({ icon, label, value, color }) => (
  <View style={[s.statCard, { borderTopColor: color }]}>
    <Text style={s.statIcon}>{icon}</Text>
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const Row = ({ label, value, color }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={[s.rowValue, color && { color }]}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  c: { padding: 20, backgroundColor: '#f5f7fa', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcome: { fontSize: 14, color: '#FF3B30', fontWeight: '600' },
  name: { fontSize: 22, fontWeight: 'bold' },
  uid: { fontSize: 11, color: '#888', marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutT: { color: '#fff', fontWeight: '600', fontSize: 12 },
  section: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderTopWidth: 4,
    alignItems: 'center',
  },
  statIcon: { fontSize: 32 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 6 },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  rowLabel: { color: '#666' },
  rowValue: { fontWeight: '700' },
  revenueCard: {
    backgroundColor: '#34C759',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  revenueLabel: { color: '#fff', fontSize: 13, opacity: 0.9 },
  revenueValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 6,
  },
  footer: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 24 },
});