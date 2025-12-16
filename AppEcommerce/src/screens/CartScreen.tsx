import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SlideToConfirm } from '../components/SlideToConfirm';
import { QuotationSuccessModal } from '../components/QuotationSuccessModal';
import { ENV } from '../config/env';
import { cartService } from '../services/cart';
import { call } from '../services/api';
import { getSession } from '../services/session';
import { useCompany } from '../context/CompanyContext';
import { useCart } from '../context/CartContext';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Cart'>;
};

const CartScreen = ({ navigation }: Props) => {
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [requestingQuote, setRequestingQuote] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [quotationData, setQuotationData] = useState<any>(null);
    const { formatPrice } = useCompany();
    const { updateCartCount } = useCart();

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);
            const cart = await cartService.getCart();

            if (cart && cart.lines) {
                setCartItems(cart.lines);
                setTotal(cart.amount_total || 0);
                console.log('Cart loaded:', cart.lines.length, 'items, total:', cart.amount_total);
            } else {
                setCartItems([]);
                setTotal(0);
                console.log('No cart or empty cart');
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            setCartItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (lineId: number) => {
        Alert.alert('Eliminar', '¿Estás seguro de quitar este producto?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await cartService.removeFromCart(lineId);
                        await loadCart(); // Reload cart after removal
                        await updateCartCount(); // Update cart badge
                    } catch (e) {
                        console.error('Error removing item:', e);
                        Alert.alert('Error', 'No se pudo eliminar el producto');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const handleRequestQuote = async () => {
        setRequestingQuote(true);
        try {
            const session = getSession();

            // Debug: Log session state
            console.log('Session state:', {
                hasSessionId: !!session.sessionId,
                hasUid: !!session.uid,
                username: session.username,
                sessionIdLength: session.sessionId?.length || 0
            });

            // Validate session
            if (!session.sessionId || !session.uid) {
                Alert.alert('Error', 'No hay sesión activa. Por favor, inicia sesión nuevamente.');
                setRequestingQuote(false);
                navigation.navigate('Login');
                return;
            }

            // Perform request via service
            const result = await cartService.requestOrder(cartItems[0]?.order_id || 0);

            // If we reached here without error, assume success
            // (requestOrder throws on error)

            setShowQuoteModal(false);

            // Clear cart immediately
            setCartItems([]);
            setTotal(0);
            await updateCartCount();

            // Show success modal
            const currentDate = new Date().toLocaleDateString('es-DO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            setQuotationData({
                orderName: result ? (result.display_name || 'Cotización') : 'Orden',
                orderTotal: total,
                orderDate: currentDate,
                orderId: result ? result.id : 0,
            });
            setShowSuccessModal(true);

        } catch (error: any) {
            console.error('Error requesting quote:', error);
            // Check for specific Odoo errors or show generic
            let msg = 'No se pudo enviar la solicitud.';
            if (error.message && error.message.includes('restricted')) {
                msg = 'Permisos insuficientes para confirmar la orden.';
            }
            Alert.alert('Error', msg);
        } finally {
            setRequestingQuote(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.itemContainer}>
            <Image
                source={{ uri: `${ENV.ODOO_URL}/web/image/product.product/${item.product_id}/image_128` }}
                style={styles.itemImage}
                resizeMode="cover"
            />
            <View style={styles.itemInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.product_name}</Text>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.itemPrice}>{formatPrice(item.price_unit || 0)}</Text>
                <View style={styles.quantityContainer}>
                    <Text style={{ color: '#555' }}>Cant: {item.quantity}</Text>
                    <Text style={{ fontWeight: 'bold', marginLeft: 10 }}>{formatPrice(item.price_total || 0)}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header />
            <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
                <View style={styles.content}>
                    <Text style={styles.title}>Mi Carrito</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#4a90e2" />
                    ) : cartItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cart-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Tu carrito está vacío</Text>
                            <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home', { username: getSession().username || 'Usuario' })}>
                                <Text style={styles.shopButtonText}>Ir a comprar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                data={cartItems}
                                renderItem={renderItem}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />

                            {/* Total and Quote Button */}
                            <View style={styles.totalContainer}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total:</Text>
                                    <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.quoteButton}
                                    onPress={() => setShowQuoteModal(true)}
                                >
                                    <Ionicons name="document-text-outline" size={20} color="#fff" />
                                    <Text style={styles.quoteButtonText}>Solicitar Cotización</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </SafeAreaView>

            {/* Quote Confirmation Modal */}
            <Modal
                visible={showQuoteModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowQuoteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setShowQuoteModal(false)}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>

                        <View style={styles.modalHeader}>
                            <Ionicons name="document-text" size={48} color="#0047AB" />
                            <Text style={styles.modalTitle}>Solicitar Cotización</Text>
                            <Text style={styles.modalSubtitle}>
                                Confirma tu solicitud de cotización
                            </Text>
                        </View>

                        <View style={styles.modalSummary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Productos:</Text>
                                <Text style={styles.summaryValue}>{cartItems.length}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total:</Text>
                                <Text style={styles.summaryValue}>{formatPrice(total)}</Text>
                            </View>
                        </View>

                        <View style={styles.slideContainer}>
                            <SlideToConfirm
                                onComplete={handleRequestQuote}
                                text="Desliza para cotizar"
                                icon="arrow-forward"
                            />
                        </View>

                        {requestingQuote && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#0047AB" />
                                <Text style={styles.loadingText}>Enviando cotización...</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            {quotationData && (
                <QuotationSuccessModal
                    visible={showSuccessModal}
                    orderName={quotationData.orderName}
                    orderTotal={quotationData.orderTotal}
                    orderDate={quotationData.orderDate}
                    orderId={quotationData.orderId}
                    onClose={() => {
                        setShowSuccessModal(false);
                        const session = getSession();
                        navigation.navigate('Home', { username: session.username || 'Usuario' });
                    }}
                    onViewQuotation={() => {
                        setShowSuccessModal(false);
                        navigation.navigate('OrderDetail', { orderId: quotationData.orderId });
                    }}
                />
            )}

            <Footer activeTab="cart" navigation={navigation} />
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
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginTop: 20,
        marginBottom: 30,
    },
    shopButton: {
        backgroundColor: '#4a90e2',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 15,
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4a90e2',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        padding: 8,
    },
    totalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 100,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0047AB',
    },
    quoteButton: {
        backgroundColor: '#0047AB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 25,
    },
    quoteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40,
    },
    modalClose: {
        alignSelf: 'flex-end',
        padding: 5,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 25,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    modalSummary: {
        backgroundColor: '#f5f7fa',
        padding: 20,
        borderRadius: 12,
        marginBottom: 25,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#666',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    slideContainer: {
        marginBottom: 20,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#0047AB',
        fontWeight: '600',
    },
});

export default CartScreen;
