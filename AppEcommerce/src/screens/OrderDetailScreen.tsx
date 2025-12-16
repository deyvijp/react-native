import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { call } from '../services/api';
import { getSession } from '../services/session';
import { useCompany } from '../context/CompanyContext';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OrderDetail'>;
    route: RouteProp<RootStackParamList, 'OrderDetail'>;
};

const OrderDetailScreen = ({ navigation, route }: Props) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCompany();

    useEffect(() => {
        loadOrderDetail();
    }, [orderId]);

    const loadOrderDetail = async () => {
        try {
            const session = getSession();
            if (!session.uid) return;

            // Get order details
            const fields = [
                'id', 'name', 'date_order', 'state', 'amount_total',
                'amount_untaxed', 'amount_tax', 'order_line', 'partner_id',
                'create_date', 'write_date'
            ];

            const orders = await call('sale.order', 'read', [[orderId], fields]);

            if (orders && orders.length > 0) {
                const orderData = orders[0];

                // Get order lines details
                if (orderData.order_line && orderData.order_line.length > 0) {
                    const lineFields = ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal'];
                    const lines = await call('sale.order.line', 'read', [orderData.order_line, lineFields]);
                    orderData.lines = lines;
                }

                setOrder(orderData);
            }
        } catch (error) {
            console.error('Error loading order detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStateLabel = (state: string) => {
        const states: { [key: string]: string } = {
            'draft': 'Borrador',
            'sent': 'Enviada',
            'sale': 'Confirmado',
            'done': 'Completado',
            'cancel': 'Cancelado',
        };
        return states[state] || state;
    };

    const getStateColor = (state: string) => {
        const colors: { [key: string]: string } = {
            'draft': '#9ca3af',
            'sent': '#FFA500',
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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0047AB" />
                </View>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <Header />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.errorText}>Orden no encontrada</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Detalle de Orden</Text>
                </View>

                {/* Order Info Card */}
                <View style={styles.card}>
                    <View style={styles.orderHeader}>
                        <Text style={styles.orderNumber}>{order.name}</Text>
                        <View style={[styles.stateBadge, { backgroundColor: getStateColor(order.state) }]}>
                            <Text style={styles.stateText}>{getStateLabel(order.state)}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={18} color="#666" />
                        <Text style={styles.infoText}>Fecha: {formatDate(order.date_order)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={18} color="#666" />
                        <Text style={styles.infoText}>Cliente: {order.partner_id[1]}</Text>
                    </View>
                </View>

                {/* Order Lines */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Productos</Text>
                    {order.lines && order.lines.map((line: any, index: number) => (
                        <View key={line.id} style={styles.lineItem}>
                            <View style={styles.lineInfo}>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {line.product_id[1]}
                                </Text>
                                <Text style={styles.lineDetails}>
                                    Cantidad: {line.product_uom_qty} × {formatPrice(line.price_unit)}
                                </Text>
                            </View>
                            <Text style={styles.lineTotal}>{formatPrice(line.price_subtotal)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.card}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>{formatPrice(order.amount_untaxed)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Impuestos:</Text>
                        <Text style={styles.totalValue}>{formatPrice(order.amount_tax)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotalRow]}>
                        <Text style={styles.grandTotalLabel}>Total:</Text>
                        <Text style={styles.grandTotalValue}>{formatPrice(order.amount_total)}</Text>
                    </View>
                </View>
            </ScrollView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginTop: 20,
        marginBottom: 30,
    },
    backButton: {
        backgroundColor: '#0047AB',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backIcon: {
        marginRight: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    card: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    lineItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    lineInfo: {
        flex: 1,
        marginRight: 10,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    lineDetails: {
        fontSize: 12,
        color: '#666',
    },
    lineTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0047AB',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    grandTotalRow: {
        borderTopWidth: 2,
        borderTopColor: '#e5e7eb',
        marginTop: 10,
        paddingTop: 15,
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0047AB',
    },
});

export default OrderDetailScreen;
