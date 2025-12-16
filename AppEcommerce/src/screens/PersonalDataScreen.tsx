import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../services/user';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'PersonalData'>;
    route: RouteProp<RootStackParamList, 'PersonalData'>;
};

const PersonalDataScreen = ({ navigation, route }: Props) => {
    const { username } = route.params;

    // State for form fields
    const [mobile, setMobile] = useState('');
    const [fixedPhone, setFixedPhone] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState(username);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const data = await userService.getUserInfo();
            if (data) {
                setEmail(data.email || ''); // email can be false in Odoo
                setMobile(data.mobile || '');
                setFixedPhone(data.phone || '');
                setName(data.name || username);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo cargar la información del usuario');
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await userService.updateUser({
                mobile: mobile,
                phone: fixedPhone
            });
            Alert.alert('Éxito', 'Información actualizada correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo actualizar');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#4a90e2" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Datos Personales</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content}>
                    <View style={styles.profileSummary}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{name.substring(0, 2).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.username}>{name}</Text>
                        <Text style={styles.role}>Conductor / Usuario</Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre Completo</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={name}
                                editable={false}
                            />
                            <Text style={styles.helperText}>Contacta a RRHH para editar tu nombre</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Correo Electrónico</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={email}
                                editable={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={[styles.phoneContainer, isFocused && styles.phoneContainerFocused]}>
                                <Text style={styles.phoneLabel}>Celular</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    value={mobile}
                                    onChangeText={(text) => {
                                        // Simple masking logic (XXX) XXX XXXX
                                        const cleaned = text.replace(/\D/g, '');
                                        let formatted = cleaned;
                                        if (cleaned.length > 0) {
                                            if (cleaned.length <= 3) {
                                                formatted = `(${cleaned}`;
                                            } else if (cleaned.length <= 6) {
                                                formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
                                            } else {
                                                formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
                                            }
                                        }
                                        setMobile(formatted);
                                    }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    keyboardType="phone-pad"
                                    placeholder="(000) 000 0000"
                                    maxLength={14}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.phoneContainer}>
                                <Text style={styles.phoneLabel}>Teléfono Fijo</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    value={fixedPhone}
                                    onChangeText={(text) => {
                                        // Similar masking
                                        const cleaned = text.replace(/\D/g, '');
                                        let formatted = cleaned;
                                        if (cleaned.length > 0) {
                                            if (cleaned.length <= 3) {
                                                formatted = `(${cleaned}`;
                                            } else if (cleaned.length <= 6) {
                                                formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
                                            } else {
                                                formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
                                            }
                                        }
                                        setFixedPhone(formatted);
                                    }}
                                    keyboardType="phone-pad"
                                    placeholder="(000) 000 0000"
                                    maxLength={14}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    profileSummary: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e1e9ee',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4a90e2',
    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    role: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    phoneContainer: {
        borderWidth: 1.5,
        borderColor: '#e1e1e1',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#f8f9fa',
    },
    phoneContainerFocused: {
        borderColor: '#4a90e2',
        backgroundColor: '#fff',
    },
    phoneLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    phoneInput: {
        fontSize: 16, // Standard size matching other inputs
        fontWeight: '500',
        color: '#333',
        padding: 0,
        width: '100%', // Ensure it takes full width
        height: 24, // Explicit height for text to prevent clipping
        textAlignVertical: 'center',
    },
    disabledInput: {
        backgroundColor: '#f5f7fa',
        color: '#999',
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    saveButton: {
        backgroundColor: '#4a90e2',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4a90e2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonDisabled: {
        backgroundColor: '#a0c4eb',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default PersonalDataScreen;
