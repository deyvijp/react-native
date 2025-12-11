import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
    route: RouteProp<RootStackParamList, 'Profile'>;
};

const ProfileScreen = ({ navigation, route }: Props) => {
    const { username } = route.params;

    const handleLogout = () => {
        // TODO: Clean session
        navigation.replace('Login');
    };

    const MenuItem = ({ icon, label, isDestructive = false }: { icon: string; label: string; isDestructive?: boolean }) => (
        <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
                <Ionicons name={icon as any} size={24} color="#4a90e2" />
            </View>
            <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevron} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{username.substring(0, 2).toUpperCase()}</Text>
                        <View style={styles.statusDot} />
                    </View>
                    <Text style={styles.profileName}>{username}</Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <MenuItem icon="person-outline" label="Datos personales" />
                    <MenuItem icon="notifications-outline" label="Notificaciones" />
                    <MenuItem icon="eye-outline" label="Permisos de visibilidad" />
                    <MenuItem icon="finger-print-outline" label="Autenticación biométrica" />
                    <MenuItem icon="key-outline" label="Token" />
                    <MenuItem icon="document-text-outline" label="Documentos" />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <View style={styles.logoutContent}>
                        <Ionicons name="log-out-outline" size={24} color="#4a90e2" />
                        <Text style={styles.logoutText}>Cerrar sesión</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        paddingTop: 50, // Safe area compensation if needed
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 5,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    avatarLarge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4a90e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        position: 'relative',
    },
    avatarTextLarge: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statusDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#ff3b30', // Red notification dot style
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuIconContainer: {
        width: 30,
        marginRight: 15,
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    destructiveLabel: {
        color: '#ff3b30',
    },
    chevron: {
        opacity: 0.5,
    },
    logoutButton: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutText: {
        marginLeft: 15,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    }
});

export default ProfileScreen;
