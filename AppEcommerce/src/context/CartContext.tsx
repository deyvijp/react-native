import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService } from '../services/cart';

type CartContextType = {
    cartCount: number;
    updateCartCount: () => Promise<void>;
    incrementCartCount: (qty: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartCount, setCartCount] = useState(0);

    const updateCartCount = async () => {
        try {
            const cart = await cartService.getCart();
            if (cart && cart.items) {
                const total = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                setCartCount(total);
            } else {
                setCartCount(0);
            }
        } catch (e) {
            console.error('Error updating cart count:', e);
        }
    };

    const incrementCartCount = (qty: number) => {
        setCartCount(prev => prev + qty);
    };

    useEffect(() => {
        updateCartCount();
    }, []);

    return (
        <CartContext.Provider value={{ cartCount, updateCartCount, incrementCartCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
