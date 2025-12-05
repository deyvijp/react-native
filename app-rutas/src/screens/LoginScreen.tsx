import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store/authStore';
import { CONFIG } from '../config';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
    const [db] = useState(CONFIG.DEFAULT_DB);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { login, isLoading, error } = useAuthStore();

    // Animation Values
    const formOpacity = useSharedValue(0);
    const formTranslateY = useSharedValue(50);

    useEffect(() => {
        // Trigger animations on mount
        formOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
        formTranslateY.value = withDelay(300, withSpring(0, { damping: 12 }));
    }, []);

    const formStyle = useAnimatedStyle(() => {
        return {
            opacity: formOpacity.value,
            transform: [{ translateY: formTranslateY.value }],
        };
    });

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        await login(db, email, password);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.backgroundCircle} />
            <View style={styles.backgroundCircleSmall} />

            <View style={styles.contentContainer}>
                <Animated.View entering={FadeInDown.duration(1000).springify()} style={styles.headerContainer}>
                    <Icon name="truck-fast" size={80} color="#0056b3" style={styles.logoIcon} />
                    <Text style={styles.welcomeText}>Welcome Back!</Text>
                    <Text style={styles.subText}>Sign in to continue</Text>
                </Animated.View>

                <Animated.View style={[styles.formContainer, formStyle]}>
                    <View style={styles.inputWrapper}>
                        <Icon name="account-outline" size={24} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Username / Email"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Icon name="lock-outline" size={24} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            secureTextEntry
                        />
                    </View>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>LOGIN</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
    },
    backgroundCircle: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(0, 86, 179, 0.1)',
    },
    backgroundCircleSmall: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(0, 86, 179, 0.05)',
    },
    contentContainer: {
        paddingHorizontal: 30,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoIcon: {
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subText: {
        fontSize: 16,
        color: '#666',
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 55,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
    },
    loginButton: {
        backgroundColor: '#0056b3',
        borderRadius: 12,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#0056b3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    forgotButton: {
        alignItems: 'center',
        marginTop: 20,
    },
    forgotText: {
        color: '#666',
        fontSize: 14,
    },
    errorText: {
        color: '#ff4444',
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 14,
    },
});

export default LoginScreen;
