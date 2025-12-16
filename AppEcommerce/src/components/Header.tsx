import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text } from 'react-native';
import { useCart } from '../context/CartContext';
import { getSession } from '../services/session';
import { SearchBar } from './SearchBar';
import Logo from '../../assets/logo_cecomsa.svg';

export const Header = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { cartCount } = useCart();
    const [username, setUsername] = useState('Usuario');

    useEffect(() => {
        const session = getSession();
        if (session.username) {
            setUsername(session.username);
        }
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Top Row: Logo + Icons */}
            <View style={styles.topRow}>
                {/* Logo */}
                <TouchableOpacity onPress={() => navigation.navigate('Home', { username })} style={styles.logoContainer}>
                    <Logo width={120} height={40} />
                </TouchableOpacity>

                {/* Right Actions */}
                <View style={styles.actions}>
                    {/* Cart Icon with Badge */}
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Cart')}>
                        <Ionicons name="cart-outline" size={24} color="#111827" />
                        {cartCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Profile Icon */}
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile', { username })}>
                        <Ionicons name="person-circle-outline" size={24} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <SearchBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 10,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    logoContainer: {
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginLeft: 15,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -8,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
