import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSession } from '../services/session';

type Props = {
    activeTab: 'home' | 'categories' | 'cart' | 'profile';
    navigation: any;
    username?: string;
};

export const Footer = ({ activeTab, navigation, username }: Props) => {
    const insets = useSafeAreaInsets();
    const currentUsername = username || getSession().username || 'User';

    const tabs = [
        { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Inicio', target: 'Home', params: { username: currentUsername } },
        { id: 'categories', icon: 'grid-outline', activeIcon: 'grid', label: 'Categorías', target: 'Home', params: { username: currentUsername } },
        { id: 'cart', icon: 'cart-outline', activeIcon: 'cart', label: 'Carrito', target: 'Cart' },
        { id: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Cuenta', target: 'Profile', params: { username: currentUsername } },
    ];

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={styles.tab}
                        onPress={() => navigation.navigate(tab.target, tab.params)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isActive ? tab.activeIcon as any : tab.icon as any}
                            size={24}
                            color={isActive ? '#0047AB' : '#666'}
                        />
                        <Text style={[styles.label, isActive && styles.activeLabel]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
        paddingHorizontal: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        marginTop: 4,
        color: '#666',
        fontWeight: '500',
    },
    activeLabel: {
        color: '#0047AB',
        fontWeight: '700',
    }
});
