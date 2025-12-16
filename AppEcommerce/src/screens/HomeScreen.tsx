import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    FlatList,
    Dimensions
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { productService } from '../services/products';
import { useCompany } from '../context/CompanyContext';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
    route: RouteProp<RootStackParamList, 'Home'>;
};

const HomeScreen = ({ navigation, route }: Props) => {
    const { username } = route.params;
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
    const { formatPrice } = useCompany();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const featured = await productService.getFeaturedProducts();
            setFeaturedProducts(featured.slice(0, 5) || []);
            setProducts(featured || []);
        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setLoading(false);
        }
    };

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
            <Image
                source={{ uri: productService.getProductImageUrl(item.id) }}
                style={styles.productImage}
                resizeMode="cover"
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(item.list_price || 0)}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderFeaturedProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
            <Image
                source={{ uri: productService.getProductImageUrl(item.id) }}
                style={styles.featuredImage}
                resizeMode="cover"
            />
            <View style={styles.featuredOverlay}>
                <Text style={styles.featuredName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.featuredPrice}>{formatPrice(item.list_price || 0)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Destacados</Text>
                        <FlatList
                            horizontal
                            data={featuredProducts}
                            renderItem={renderFeaturedProduct}
                            keyExtractor={(item) => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.featuredList}
                        />
                    </View>
                )}

                {/* Products Grid */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Productos</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Scanner', { mode: 'cart' })}>
                            <View style={styles.scanButton}>
                                <Ionicons name="barcode-outline" size={20} color="#0047AB" />
                                <Text style={styles.scanButtonText}>Escanear</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0047AB" style={{ marginTop: 20 }} />
                    ) : products.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>No se encontraron productos</Text>
                        </View>
                    ) : (
                        <View style={styles.productsGrid}>
                            {products.map((item) => (
                                <View key={item.id} style={styles.productWrapper}>
                                    {renderProduct({ item })}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <Footer activeTab="home" navigation={navigation} username={username} />
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
    section: {
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 20,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    scanButtonText: {
        marginLeft: 5,
        color: '#0047AB',
        fontSize: 14,
        fontWeight: '600',
    },
    featuredList: {
        paddingHorizontal: 15,
    },
    featuredCard: {
        width: width * 0.7,
        height: 180,
        marginHorizontal: 5,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    featuredOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 15,
    },
    featuredName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    featuredPrice: {
        color: '#4CAF50',
        fontSize: 18,
        fontWeight: 'bold',
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
    },
    productWrapper: {
        width: '50%',
        padding: 5,
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    productImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#f0f0f0',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
        height: 40,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0047AB',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: '#999',
    },
});

export default HomeScreen;
