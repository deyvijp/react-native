import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Product, productService } from '../services/products';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 40; // Full width with padding

export const ProductCarousel = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await productService.getFeaturedProducts();
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#4a90e2" />
            </View>
        );
    }

    if (products.length === 0) return null;

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <Image
                source={{ uri: productService.getProductImageUrl(item.id) }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.infoOverlay}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>
                    {item.currency_id?.[1]} {item.list_price.toFixed(2)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Destacados</Text>
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH + 10}
                decelerationRate="fast"
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 25,
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 15,
        color: '#333',
    },
    listContent: {
        paddingHorizontal: 20,
        gap: 15,
    },
    card: {
        width: ITEM_WIDTH,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    infoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', // Glassmorphism dark
        padding: 15,
    },
    name: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    price: {
        color: '#ffcc00',
        fontSize: 18,
        fontWeight: '800',
    },
});
