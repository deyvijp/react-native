import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { login } from '../services/auth';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            setLoading(false);

            if (result.success) {
                Alert.alert('Éxito', `Login correcto. UID: ${result.uid}`);
                // TODO: Navigate to Home Screen
            } else {
                Alert.alert('Error', result.error || 'Credenciales inválidas');
            }
        } catch (e) {
            setLoading(false);
            Alert.alert('Error', 'Ocurrió un error inesperado');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.contentContainer}>
                <View style={styles.logoContainer}>
                    {/* Placeholder for Logo */}
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>APP</Text>
                    </View>
                    <Text style={styles.title}>Bienvenido</Text>
                    <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Usuario / Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ejemplo@empresa.com"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#4a90e2',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#4a90e2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    logoText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#fff',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e1e1e1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotText: {
        color: '#4a90e2',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
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
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default LoginScreen;
