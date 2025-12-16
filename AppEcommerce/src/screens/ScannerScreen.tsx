import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { productService } from '../services/products';
import { cartService } from '../services/cart';

import { useCart } from '../context/CartContext';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Scanner'>;
    route: RouteProp<RootStackParamList, 'Scanner'>;
};

const ScannerScreen = ({ navigation, route }: Props) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [torch, setTorch] = useState(false);
    const mode = route.params?.mode || 'cart'; // 'cart' or 'price_check'
    const { incrementCartCount } = useCart();

    const isProcessing = useRef(false);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Necesitamos permiso para usar la cámara</Text>
                <Button onPress={requestPermission} title="Dar permiso" />
            </View>
        );
    }

    const resetScan = () => {
        setScanned(false);
        setLoading(false);
        isProcessing.current = false;
    };

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || isProcessing.current) return;

        isProcessing.current = true;
        setScanned(true);
        setLoading(true);

        try {
            // Check code in Odoo
            const product = await productService.searchByBarcode(data);

            if (product) {
                if (mode === 'cart') {
                    Alert.alert(
                        'Producto Encontrado',
                        `¿Agregar ${product.name} al carrito?`,
                        [
                            { text: 'Cancelar', onPress: resetScan, style: 'cancel' },
                            { text: 'Agregar', onPress: () => addToCart(product) }
                        ]
                    );
                } else if (mode === 'price_check') {
                    Alert.alert(
                        'Verificador de Precios',
                        `${product.name}\n\nPrecio: $${product.list_price.toFixed(2)}`,
                        [
                            { text: 'OK', onPress: resetScan }
                        ]
                    );
                }
            } else {
                Alert.alert('No encontrado', `No se encontró producto con código ${data}`, [
                    { text: 'OK', onPress: resetScan }
                ]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error al verificar el código');
            resetScan();
        }
    };

    const addToCart = async (product: any) => {
        setLoading(true);
        try {
            await cartService.addToCart(product.id, 1);
            incrementCartCount(1); // Update cart count immediately
            Alert.alert('Éxito', 'Producto agregado al carrito', [
                { text: 'Seguir Escaneando', onPress: resetScan },
                {
                    text: 'Ir al Carrito', onPress: () => {
                        setLoading(false);
                        // isProcessing remains true intentionally if navigating away, 
                        // or we reset it if we come back?
                        // Usually safer to reset if we navigate.
                        isProcessing.current = false;
                        navigation.navigate('Cart');
                    }
                }
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo agregar al carrito');
            resetScan();
        }
    };



    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                enableTorch={torch}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            <View style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {mode === 'price_check' ? 'Verificador de Precios' : 'Escanear Producto'}
                    </Text>
                    <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.closeButton}>
                        <Ionicons name={torch ? "flash" : "flash-off"} size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.scanArea}>
                    <View style={styles.scanFrame} />
                    <Text style={styles.instructions}>Coloca el código de barras dentro del recuadro</Text>
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={{ color: '#fff', marginTop: 10 }}>Verificando...</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50, // Move down from status bar
        height: 100,
    },
    scanArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    instructions: {
        color: '#fff',
        marginTop: 20,
        fontSize: 14,
        textAlign: 'center',
    },
    closeButton: {
        padding: 5,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default ScannerScreen;
