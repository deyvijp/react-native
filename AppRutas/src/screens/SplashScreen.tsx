import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Logo from '../../assets/logo_cecomsa.svg';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen = ({ navigation }: Props) => {
    useEffect(() => {
        const checkLogin = async () => {
            // Simulate checking session or loading assets
            // In the future, check AsyncStorage for a token here
            setTimeout(() => {
                navigation.replace('Login');
            }, 2000); // Show splash for 2 seconds
        };

        checkLogin();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Logo width={200} height={200} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // White background as per screenshot
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SplashScreen;
