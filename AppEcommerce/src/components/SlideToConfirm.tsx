import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SLIDE_THRESHOLD = width * 0.7; // 70% del ancho

type Props = {
    onComplete: () => void;
    text?: string;
    icon?: string;
};

export const SlideToConfirm = ({ onComplete, text = 'Desliza para cotizar', icon = 'arrow-forward' }: Props) => {
    const [completed, setCompleted] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const slidePosition = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                slideAnim.setOffset(slidePosition.current);
                slideAnim.setValue(0);
            },
            onPanResponderMove: (_, gesture) => {
                if (gesture.dx >= 0 && gesture.dx <= SLIDE_THRESHOLD) {
                    slideAnim.setValue(gesture.dx);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                slideAnim.flattenOffset();

                if (gesture.dx >= SLIDE_THRESHOLD) {
                    // Completado
                    Animated.spring(slideAnim, {
                        toValue: SLIDE_THRESHOLD,
                        useNativeDriver: false,
                    }).start(() => {
                        setCompleted(true);
                        setTimeout(() => {
                            onComplete();
                        }, 300);
                    });
                } else {
                    // Volver al inicio
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: false,
                    }).start();
                }

                slidePosition.current = gesture.dx >= SLIDE_THRESHOLD ? SLIDE_THRESHOLD : 0;
            },
        })
    ).current;

    const sliderOpacity = slideAnim.interpolate({
        inputRange: [0, SLIDE_THRESHOLD],
        outputRange: [1, 0],
    });

    const checkOpacity = slideAnim.interpolate({
        inputRange: [0, SLIDE_THRESHOLD],
        outputRange: [0, 1],
    });

    // Width of the filled track
    const filledWidth = slideAnim.interpolate({
        inputRange: [0, SLIDE_THRESHOLD],
        outputRange: [60, SLIDE_THRESHOLD + 60],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <View style={styles.track}>
                {/* Filled progress bar */}
                <Animated.View
                    style={[
                        styles.filledTrack,
                        {
                            width: filledWidth,
                        },
                    ]}
                />

                <Animated.Text style={[styles.text, { opacity: sliderOpacity }]}>
                    {text}
                </Animated.Text>
                <Animated.View style={[styles.checkContainer, { opacity: checkOpacity }]}>
                    <Ionicons name="checkmark-circle" size={32} color="#fff" />
                </Animated.View>
            </View>

            <Animated.View
                style={[
                    styles.slider,
                    {
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <Ionicons name={icon as any} size={28} color="#fff" />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 60,
        position: 'relative',
    },
    track: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E3F2FD',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    filledTrack: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        backgroundColor: '#0047AB',
        borderRadius: 30,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0047AB',
        zIndex: 1,
    },
    checkContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    slider: {
        position: 'absolute',
        left: 5,
        top: 5,
        width: 50,
        height: 50,
        backgroundColor: '#0047AB',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 2,
    },
});
