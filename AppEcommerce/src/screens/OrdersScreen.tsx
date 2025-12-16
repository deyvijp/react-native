import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { call } from '../services/api';
import { getSession } from '../services/session';
import { useCompany } from '../context/CompanyContext';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Orders'>;
};

type Order = {
    id: number;
    name: string;
    date_order: string;
    state: string;
    amount_total: number;
    order_line: number[];
};

const OrdersScreen = ({ navigation }: Props) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { formatPrice } = useCompany();

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const session = getSession();
            if (!session.uid) return;

            // Get user's partner_id
            const users = await call('res.users', 'read', [[session.uid], ['partner_id']]);
            if (!users || !users.length) return;

            const partnerId = users[0].partner_id[0];

            // Get all orders for this partner
            const domain = [['partner_id', '=', partnerId]];
            const fields = ['id', 'name', 'date_order', 'state', 'amount_total', 'order_line'];

            const ordersList = await call('sale.order', 'search_read', [domain, fields], {
                order: 'date_order desc',
                limit: 50
            });

            setOrders(ordersList || []);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const getStateLabel = (state: string) => {
        const states: { [key: string]: string } = {
            'draft': 'Borrador',
            'sent': 'Enviado',
            'sale': 'Confirmado',
            'done': 'Completado',
            'cancel': 'Cancelado',
        };
        return states[state] || state;
    };

    const getStateColor = (state: string) => {
        const colors: { [key: string]: string } = {
            'draft': '#9ca3af',
            'sent': '#3b82f6',
            'sale': '#10b981',
            'done': '#059669',
            'cancel': '#ef4444',
        };
        return colors[state] || '#6b7280';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{item.name}</Text>
                    <Text style={styles.orderDate}>{formatDate(item.date_order)}</Text>
                </View>
                <View style={[styles.stateBadge, { backgroundColor: getStateColor(item.state) }]}>
                    <Text style={styles.stateText}>{getStateLabel(item.state)}</Text>
                </View>
            </View>

            <View style={styles.orderFooter}>
                <View style={styles.orderDetails}>
                    <Ionicons name="cube-outline" size={16} color="#666" />
                    <Text style={styles.itemCount}>{item.order_line.length} producto(s)</Text>
                </View>
                <Text style={styles.orderTotal}>{formatPrice(item.amount_total)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header />

            <View style={styles.content}>
                <View style={styles.titleContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Mis Pedidos</Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0047AB" />
                    </View>
                ) : orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No tienes pedidos aún</Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.shopButtonText}>Ir a comprar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrder}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />
                )}
            </View>

            <Footer activeTab="profile" navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    content: {
        flex: 1,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginTop: 20,
        marginBottom: 30,
    },
    shopButton: {
        backgroundColor: '#0047AB',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 15,
        paddingBottom: 100,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
    },
    stateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stateText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    orderDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemCount: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666',
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0047AB',
    },
});

export default OrdersScreen;
