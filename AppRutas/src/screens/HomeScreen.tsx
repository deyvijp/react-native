import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../components/Skeleton';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
    route: RouteProp<RootStackParamList, 'Home'>;
};

const HomeScreen = ({ navigation, route }: Props) => {
    const { username } = route.params;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate data fetching
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const navigateToProfile = () => {
        navigation.navigate('Profile', { username });
    };

    const Header = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <TouchableOpacity onPress={navigateToProfile} style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{username.substring(0, 2).toUpperCase()}</Text>
                </TouchableOpacity>
                <View style={styles.greetingBox}>
                    <Text style={styles.greetingText}>Hola, {username}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
        </View>
    );

    const QuickAction = ({ icon, label, color }: { icon: string; label: string; color: string }) => (
        <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Tus Rutas Asignadas</Text>

                {loading ? (
                    <View style={styles.cardSkeleton}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Skeleton width={40} height={40} borderRadius={20} />
                            <View style={{ marginLeft: 15, flex: 1 }}>
                                <Skeleton width="60%" height={20} style={{ marginBottom: 5 }} />
                                <Skeleton width="40%" height={15} />
                            </View>
                        </View>
                        <Skeleton width="100%" height={60} borderRadius={8} />
                    </View>
                ) : (
                    <View style={styles.card}>
                        <View style={styles.routeHeader}>
                            <Ionicons name="bus-outline" size={24} color="#4a90e2" style={styles.routeIcon} />
                            <View>
                                <Text style={styles.routeTitle}>Ruta #101: Norte - Sur</Text>
                                <Text style={styles.routeStatus}>En Progreso - A tiempo</Text>
                            </View>
                        </View>
                        <View style={styles.routeDetails}>
                            <Text style={styles.detailLabel}>Próxima Parada:</Text>
                            <Text style={styles.detailValue}>Parque Central (5 min)</Text>
                        </View>
                    </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>¿Qué quieres hacer?</Text>

                <View style={styles.actionsGrid}>
                    <QuickAction icon="map-outline" label="Ver Mapa" color="#4a90e2" />
                    <QuickAction icon="list-outline" label="Mis Entregas" color="#34c759" />
                    <QuickAction icon="warning-outline" label="Reportar" color="#ff9500" />
                    <QuickAction icon="stats-chart-outline" label="Estadísticas" color="#af52de" />
                </View>

                {/* Banner Promo / Info */}
                <View style={styles.promoBanner}>
                    <View style={styles.promoContent}>
                        <Text style={styles.promoTitle}>Mantén tu app actualizada</Text>
                        <Text style={styles.promoSubtitle}>Nueva versión disponible v2.1</Text>
                    </View>
                    <Ionicons name="cloud-download-outline" size={40} color="#fff" />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#4a90e2', // Qik style circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#4a90e2',
        fontSize: 18,
        fontWeight: 'bold',
    },
    greetingBox: {},
    greetingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#002e6e', // Dark blue
    },
    notificationButton: {
        padding: 8,
        backgroundColor: '#f0f4f8',
        borderRadius: 20,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardSkeleton: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    routeIcon: {
        marginRight: 15,
    },
    routeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    routeStatus: {
        fontSize: 14,
        color: '#34c759', // Green
        marginTop: 2,
    },
    routeDetails: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    actionButton: {
        width: '23%',
        alignItems: 'center',
        marginBottom: 20,
    },
    actionIcon: {
        width: 55,
        height: 55,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        color: '#555',
        textAlign: 'center',
    },
    promoBanner: {
        marginTop: 10,
        backgroundColor: '#002e6e', // Dark Blue
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    promoContent: {
        flex: 1,
    },
    promoTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    promoSubtitle: {
        color: '#a0c4eb',
        fontSize: 14,
    }
});

export default HomeScreen;
