import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { productService } from '../services/products';
import { cartService } from '../services/cart';
import { call } from '../services/api';
import { ENV } from '../config/env';
import { useCompany } from '../context/CompanyContext';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;
    route: RouteProp<RootStackParamList, 'ProductDetail'>;
};

type TabType = 'description' | 'specs' | 'reviews';

const ProductDetailScreen = ({ navigation, route }: Props) => {
    const { productId } = route.params;
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<TabType>('description');
    const { formatPrice } = useCompany();
    const { incrementCartCount } = useCart();

    useEffect(() => {
        loadProductDetail();
    }, [productId]);

    const loadProductDetail = async () => {
        setLoading(true);
        try {
            // Get product template with all needed fields
            const fields = [
                'id',
                'name',
                'list_price',
                'description_sale',
                'image_1920',
                'categ_id',
                'default_code', // SKU
                'barcode',
                'weight',
                'volume',
                'attribute_line_ids', // For specifications
            ];
            const products = await call('product.template', 'read', [[productId], fields]);

            if (products && products.length > 0) {
                const productData = products[0];

                // Get product attributes (specifications)
                if (productData.attribute_line_ids && productData.attribute_line_ids.length > 0) {
                    const attributes = await call('product.template.attribute.line', 'read', [
                        productData.attribute_line_ids,
                        ['attribute_id', 'value_ids']
                    ]);

                    // Get attribute values
                    const specs = [];
                    for (const attr of attributes) {
                        const attrData = await call('product.attribute', 'read', [[attr.attribute_id[0]], ['name']]);
                        const valueData = await call('product.attribute.value', 'read', [attr.value_ids, ['name']]);

                        specs.push({
                            name: attrData[0].name,
                            values: valueData.map((v: any) => v.name).join(', ')
                        });
                    }
                    productData.specifications = specs;
                }

                setProduct(productData);
            }
        } catch (e) {
            console.error('Error loading product detail:', e);
            Alert.alert('Error', 'No se pudo cargar el producto');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!product) return;

        setAddingToCart(true);
        try {
            // Get the product.product variant ID
            const variantDomain = [['product_tmpl_id', '=', productId]];
            const variants = await call('product.product', 'search_read', [variantDomain, ['id']], { limit: 1 });

            if (variants && variants.length > 0) {
                const variantId = variants[0].id;
                await cartService.addToCart(variantId, quantity);
                incrementCartCount(quantity);

                Alert.alert(
                    'Éxito',
                    `${quantity} ${product.name} agregado(s) al carrito`,
                    [
                        { text: 'Seguir Comprando', style: 'cancel' },
                        { text: 'Ir al Carrito', onPress: () => navigation.navigate('Cart') }
                    ]
                );
            } else {
                Alert.alert('Error', 'No se encontró variante del producto');
            }
        } catch (e) {
            console.error('Error adding to cart:', e);
            Alert.alert('Error', 'No se pudo agregar al carrito');
        } finally {
            setAddingToCart(false);
        }
    };

    const renderTabContent = () => {
        if (!product) return null;

        switch (activeTab) {
            case 'description':
                return (
                    <View style={styles.tabContent}>
                        {product.description_sale ? (
                            <Text style={styles.descriptionText}>{product.description_sale}</Text>
                        ) : (
                            <Text style={styles.noDataText}>No hay descripción disponible</Text>
                        )}

                        {/* Features */}
                        <View style={styles.featuresContainer}>
                            <Text style={styles.sectionTitle}>Características</Text>
                            <View style={styles.featureRow}>
                                <Ionicons name="pricetag-outline" size={20} color="#0047AB" />
                                <Text style={styles.featureText}>Precio competitivo</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#0047AB" />
                                <Text style={styles.featureText}>Garantía incluida</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="car-outline" size={20} color="#0047AB" />
                                <Text style={styles.featureText}>Envío disponible</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="return-down-back-outline" size={20} color="#0047AB" />
                                <Text style={styles.featureText}>Devoluciones fáciles</Text>
                            </View>
                        </View>
                    </View>
                );

            case 'specs':
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.specsTable}>
                            {product.default_code && (
                                <View style={styles.specRow}>
                                    <Text style={styles.specLabel}>SKU</Text>
                                    <Text style={styles.specValue}>{product.default_code}</Text>
                                </View>
                            )}
                            {product.barcode && (
                                <View style={styles.specRow}>
                                    <Text style={styles.specLabel}>Código de Barras</Text>
                                    <Text style={styles.specValue}>{product.barcode}</Text>
                                </View>
                            )}
                            {product.categ_id && (
                                <View style={styles.specRow}>
                                    <Text style={styles.specLabel}>Categoría</Text>
                                    <Text style={styles.specValue}>{product.categ_id[1]}</Text>
                                </View>
                            )}
                            {product.weight > 0 && (
                                <View style={styles.specRow}>
                                    <Text style={styles.specLabel}>Peso</Text>
                                    <Text style={styles.specValue}>{product.weight} kg</Text>
                                </View>
                            )}
                            {product.volume > 0 && (
                                <View style={styles.specRow}>
                                    <Text style={styles.specLabel}>Volumen</Text>
                                    <Text style={styles.specValue}>{product.volume} m³</Text>
                                </View>
                            )}

                            {/* Custom attributes */}
                            {product.specifications && product.specifications.map((spec: any, index: number) => (
                                <View key={index} style={styles.specRow}>
                                    <Text style={styles.specLabel}>{spec.name}</Text>
                                    <Text style={styles.specValue}>{spec.values}</Text>
                                </View>
                            ))}
                        </View>

                        {(!product.default_code && !product.barcode && !product.specifications) && (
                            <Text style={styles.noDataText}>No hay especificaciones disponibles</Text>
                        )}
                    </View>
                );

            case 'reviews':
                return (
                    <View style={styles.tabContent}>
                        {/* Rating Summary */}
                        <View style={styles.ratingContainer}>
                            <View style={styles.ratingHeader}>
                                <Text style={styles.ratingNumber}>4.5</Text>
                                <View style={styles.starsContainer}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Ionicons
                                            key={star}
                                            name={star <= 4 ? 'star' : 'star-outline'}
                                            size={20}
                                            color="#FFA500"
                                        />
                                    ))}
                                    <Text style={styles.reviewCount}>(12 reseñas)</Text>
                                </View>
                            </View>
                        </View>

                        {/* Sample Reviews */}
                        <View style={styles.reviewsList}>
                            <View style={styles.reviewItem}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewerInfo}>
                                        <View style={styles.reviewerAvatar}>
                                            <Text style={styles.reviewerInitial}>J</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.reviewerName}>Juan Pérez</Text>
                                            <View style={styles.reviewStars}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Ionicons
                                                        key={star}
                                                        name="star"
                                                        size={14}
                                                        color="#FFA500"
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={styles.reviewDate}>Hace 2 días</Text>
                                </View>
                                <Text style={styles.reviewText}>
                                    Excelente producto, llegó en perfectas condiciones y cumple con lo esperado.
                                </Text>
                            </View>

                            <View style={styles.reviewItem}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewerInfo}>
                                        <View style={styles.reviewerAvatar}>
                                            <Text style={styles.reviewerInitial}>M</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.reviewerName}>María García</Text>
                                            <View style={styles.reviewStars}>
                                                {[1, 2, 3, 4].map((star) => (
                                                    <Ionicons
                                                        key={star}
                                                        name="star"
                                                        size={14}
                                                        color="#FFA500"
                                                    />
                                                ))}
                                                <Ionicons name="star-outline" size={14} color="#FFA500" />
                                            </View>
                                        </View>
                                    </View>
                                    <Text style={styles.reviewDate}>Hace 1 semana</Text>
                                </View>
                                <Text style={styles.reviewText}>
                                    Muy buena calidad, aunque el envío tardó un poco más de lo esperado.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.writeReviewButton}>
                            <Ionicons name="create-outline" size={20} color="#0047AB" />
                            <Text style={styles.writeReviewText}>Escribir una reseña</Text>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
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

    if (!product) {
        return (
            <View style={styles.container}>
                <Header />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.errorText}>Producto no encontrado</Text>
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
                {/* Product Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: `${ENV.ODOO_URL}/web/image/product.template/${product.id}/image_1920` }}
                        style={styles.productImage}
                        resizeMode="contain"
                    />
                    <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Product Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.productName}>{product.name}</Text>

                    {product.categ_id && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{product.categ_id[1]}</Text>
                        </View>
                    )}

                    <Text style={styles.productPrice}>{formatPrice(product.list_price || 0)}</Text>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'description' && styles.activeTab]}
                            onPress={() => setActiveTab('description')}
                        >
                            <Text style={[styles.tabText, activeTab === 'description' && styles.activeTabText]}>
                                Descripción
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'specs' && styles.activeTab]}
                            onPress={() => setActiveTab('specs')}
                        >
                            <Text style={[styles.tabText, activeTab === 'specs' && styles.activeTabText]}>
                                Especificaciones
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                            onPress={() => setActiveTab('reviews')}
                        >
                            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                                Reseñas
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tab Content */}
                    {renderTabContent()}
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                        <Ionicons name="remove" size={20} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(quantity + 1)}
                    >
                        <Ionicons name="add" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.addToCartButton, addingToCart && styles.addToCartButtonDisabled]}
                    onPress={handleAddToCart}
                    disabled={addingToCart}
                >
                    {addingToCart ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="cart-outline" size={20} color="#fff" />
                            <Text style={styles.addToCartText}>Agregar al Carrito</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#fff',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    backIcon: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 8,
    },
    infoContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -20,
        padding: 20,
        paddingBottom: 100,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginBottom: 15,
    },
    categoryText: {
        color: '#0047AB',
        fontSize: 12,
        fontWeight: '600',
    },
    productPrice: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0047AB',
        marginBottom: 20,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#0047AB',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#0047AB',
        fontWeight: 'bold',
    },
    tabContent: {
        paddingVertical: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
        marginBottom: 20,
    },
    noDataText: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 30,
    },
    featuresContainer: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#333',
    },
    specsTable: {
        backgroundColor: '#fff',
    },
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    specLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    specValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    ratingContainer: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    ratingHeader: {
        alignItems: 'center',
    },
    ratingNumber: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#0047AB',
        marginBottom: 10,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewCount: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    reviewsList: {
        marginBottom: 20,
    },
    reviewItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0047AB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    reviewerInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    reviewStars: {
        flexDirection: 'row',
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
    },
    reviewText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD',
        padding: 15,
        borderRadius: 12,
    },
    writeReviewText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#0047AB',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        borderRadius: 25,
        paddingHorizontal: 5,
        marginRight: 15,
    },
    quantityButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 15,
        minWidth: 30,
        textAlign: 'center',
    },
    addToCartButton: {
        flex: 1,
        backgroundColor: '#0047AB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 25,
    },
    addToCartButtonDisabled: {
        backgroundColor: '#a0c4eb',
    },
    addToCartText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ProductDetailScreen;
