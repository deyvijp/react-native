import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { Platform } from 'react-native';

// Disable native screens on Web to prevent "disappearing" content
if (Platform.OS === 'web') {
    enableScreens(false);
}
import LoginScreen from '../screens/LoginScreen';
import { useAuthStore } from '../store/authStore';
import { View, Text, Button, StyleSheet } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const user = useAuthStore((state) => state.user);
    console.log('AppNavigator: Current User:', user);

    // Web-specific manual navigation to avoid react-native-screens issues
    if (Platform.OS === 'web') {
        if (user) {
            return <DashboardScreen navigation={{ navigate: () => { } }} />;
        } else {
            return <LoginScreen />;
        }
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {user ? (
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                ) : (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        marginBottom: 20,
    },
});

export default AppNavigator;
