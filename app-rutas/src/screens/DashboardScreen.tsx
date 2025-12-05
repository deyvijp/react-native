import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { routeService, Route } from '../services/routeService';

const DashboardScreen = ({ navigation }: any) => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    console.log('DashboardScreen: Mounted');

    const loadRoutes = async () => {
        // 1. Load from local DB first for speed
        const localRoutes = routeService.getLocalRoutes();
        setRoutes(localRoutes);

        // 2. Sync from server
        if (user?.uid) {
            try {
                await routeService.syncRoutes(user.uid);
                // Reload from local to get updates
                setRoutes(routeService.getLocalRoutes());
            } catch (e) {
                console.log('Sync failed, showing local data');
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRoutes();
        setRefreshing(false);
    };

    useEffect(() => {
        loadRoutes();
    }, []);

    const renderItem = ({ item }: { item: Route }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })} // Future screen
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={[styles.statusBadge,
                item.state === 'done' ? styles.statusDone :
                    item.state === 'open' ? styles.statusOpen : styles.statusDraft
                ]}>
                    {item.state.toUpperCase()}
                </Text>
            </View>
            <Text style={styles.cardDate}>{item.date}</Text>
            <Text style={styles.cardSub}>Visits: {item.line_ids.length}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcome}>Hello, {user?.name}</Text>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={routes}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No routes assigned yet.</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        elevation: 2,
    },
    welcome: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    logout: {
        color: 'red',
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardDate: {
        color: '#666',
        marginBottom: 5,
    },
    cardSub: {
        color: '#888',
        fontSize: 12,
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        overflow: 'hidden',
        color: '#fff',
    },
    statusDraft: { backgroundColor: '#999' },
    statusOpen: { backgroundColor: '#007bff' },
    statusDone: { backgroundColor: '#28a745' },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
});

export default DashboardScreen;
