import { create } from 'zustand';
import api from '../services/api';

interface User {
    uid: number;
    name: string;
    username: string;
    session_id?: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (db: string, login: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    error: null,

    login: async (db, login, password) => {
        set({ isLoading: true, error: null });
        try {
            // Odoo JSON-RPC login endpoint
            console.log('AuthStore: Sending login request...');
            const response = await api.post('/web/session/authenticate', {
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    db: db,
                    login: login,
                    password: password,
                },
            });

            console.log('AuthStore: Response received', response.status, response.data);

            if (response.data.result) {
                console.log('AuthStore: Login success', response.data.result);
                const { uid, name, username, session_id } = response.data.result;
                set({
                    user: { uid, name, username, session_id },
                    isLoading: false,
                });
            } else if (response.data.error) {
                console.log('AuthStore: Login error', response.data.error);
                set({
                    isLoading: false,
                    error: response.data.error.data.message || 'Login failed',
                });
            } else {
                console.log('AuthStore: Unexpected response structure', response.data);
                set({ isLoading: false, error: 'Unexpected response from server' });
            }
        } catch (e: any) {
            set({
                isLoading: false,
                error: e.message || 'Network error',
            });
        }
    },

    logout: () => {
        set({ user: null });
    },
}));
