import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PersonalDataScreen from './src/screens/PersonalDataScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import QuotationsScreen from './src/screens/QuotationsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import { RootStackParamList } from './src/navigation/types';

import { CartProvider } from './src/context/CartContext';
import { CompanyProvider } from './src/context/CompanyContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <CompanyProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="PersonalData" component={PersonalDataScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="Quotations" component={QuotationsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </CompanyProvider>
  );
};
