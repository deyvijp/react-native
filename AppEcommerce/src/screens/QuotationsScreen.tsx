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
    navigation: NativeStackNavigationProp<RootStackParamList, 'Quotations'>;
};

type Quotation = {
    id: number;
    name: string;
    date_order: string;
    state: string;
    amount_total: number;
    order_line: number[];
};

const QuotationsScreen = ({ navigation }: Props) => {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { formatPrice } = useCompany();

    useEffect(() => {
        loadQuotations();
    }, []);

    const loadQuotations = async () => {
        try {
            const session = getSession();
            if (!session.uid) return;

            // Get user's partner_id
            const users = await call('res.users', 'read', [[session.uid], ['partner_id']]);
            if (!users || !users.length) return;

            const partnerId = users[0].partner_id[0];

            // Get quotations (sent state)
            const domain = [
                ['partner_id', '=', partnerId],
                ['state', '=', 'sent']
            ];
            const fields = ['id', 'name', 'date_order', 'state', 'amount_total', 'order_line'];

            const quotationsList = await call('sale.order', 'search_read', [domain, fields], {
                order: 'date_order desc',
                limit: 50
            });

            setQuotations(quotationsList || []);
        } catch (error) {
            console.error('Error loading quotations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadQuotations();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderQuotation = ({ item }: { item: Quotation }) => (
        <TouchableOpacity
            style={styles.quotationCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
            <View style={styles.quotationHeader}>
                <View style={styles.quotationInfo}>
                    <Text style={styles.quotationNumber}>{item.name}</Text>
                    <Text style={styles.quotationDate}>{formatDate(item.date_order)}</Text>
                </View>
                <View style={styles.stateBadge}>
                    <Ionicons name="time-outline" size={16} color="#fff" />
                    <Text style={styles.stateText}>Enviada</Text>
                </View>
            </View>

            <View style={styles.quotationFooter}>
                <View style={styles.quotationDetails}>
                    <Ionicons name="cube-outline" size={16} color="#666" />
                    <Text style={styles.itemCount}>{item.order_line.length} producto(s)</Text>
                </View>
                <Text style={styles.quotationTotal}>{formatPrice(item.amount_total)}</Text>
            </View>

            <View style={styles.actionHint}>
                <Ionicons name="information-circle-outline" size={14} color="#0047AB" />
                <Text style={styles.actionHintText}>Toca para ver detalles</Text>
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
                    <Text style={styles.title}>Cotizaciones</Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0047AB" />
                    </View>
                ) : quotations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No tienes cotizaciones pendientes</Text>
                        <Text style={styles.emptySubtext}>
                            Las cotizaciones que solicites aparecerán aquí
                        </Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.shopButtonText}>Ir a comprar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={quotations}
                        renderItem={renderQuotation}
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
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginBottom: 30,
        textAlign: 'center',
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
    quotationCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#FFA500', // Orange for pending
    },
    quotationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    quotationInfo: {
        flex: 1,
    },
    quotationNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    quotationDate: {
        fontSize: 13,
        color: '#666',
    },
    stateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFA500',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stateText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    quotationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginBottom: 10,
    },
    quotationDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemCount: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666',
    },
    quotationTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0047AB',
    },
    actionHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
    },
    actionHintText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#0047AB',
        fontStyle: 'italic',
    },
});

export default QuotationsScreen;
