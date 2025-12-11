import { ENV } from '../config/env';
import { OdooRpcRequest, OdooRpcResponse, LoginResult } from '../types/odoo';

export const login = async (username: string, password: string): Promise<LoginResult> => {
    // Remove trailing slash if present to avoid double slashes
    const baseUrl = ENV.ODOO_URL.replace(/\/$/, '');
    const url = `${baseUrl}/jsonrpc`;

    const payload: OdooRpcRequest = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'common',
            method: 'login',
            args: [ENV.ODOO_DB, username, password],
        },
        id: Math.floor(Math.random() * 1000000000),
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result: OdooRpcResponse<number | false> = await response.json();

        if (result.error) {
            throw new Error(result.error.data.message || result.error.message);
        }

        // Odoo returns the UID (number) on success, or false (boolean) on failure
        if (typeof result.result === 'number') {
            return {
                success: true,
                uid: result.result,
                username: username,
                // SECURITY: Password is NOT returned or stored here
            };
        } else {
            throw new Error('Credenciales inválidas');
        }
    } catch (error: any) {
        // SECURITY: Do not log the error object if it might contain the password payload
        console.error('Login Error Detailed:', error);
        return {
            success: false,
            error: error.message || 'Error de conexión',
        };
    }
};

