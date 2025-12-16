import { ENV } from '../config/env';
import { OdooRpcRequest, OdooRpcResponse, LoginResult } from '../types/odoo';

export const login = async (username: string, password: string): Promise<LoginResult> => {
    // Remove trailing slash if present to avoid double slashes
    const baseUrl = ENV.ODOO_URL.replace(/\/$/, '');
    const url = `${baseUrl}/web/session/authenticate`;

    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            db: ENV.ODOO_DB,
            login: username,
            password: password,
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

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.data?.message || result.error.message);
        }

        if (result.result && result.result.uid) {
            // Extract session_id from result if available (Odoo 10+)
            const sessionId = result.result.session_id;

            // Also try to get from header if needed, but result.session_id is reliable in JSON-RPC
            // Note: fetch in RN might handle cookies automatically or not depending on networking stack.
            // But we explicitly need the string for our manual headers.

            return {
                success: true,
                uid: result.result.uid,
                username: username,
                sessionId: sessionId,
                partnerId: result.result.partner_id,
                userContext: result.result.user_context,
                companyId: result.result.company_id
            };
        } else {
            throw new Error('Credenciales inválidas');
        }
    } catch (error: any) {
        console.error('Login Error Detailed:', error);
        return {
            success: false,
            error: error.message || 'Error de conexión',
        };
    }
};

