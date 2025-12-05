// Configuration - REPLACE WITH YOUR ACTUAL SERVER DETAILS
export const ODOO_CONFIG = {
    url: 'http://20.12.240.8:8069', // Note: HTTP is insecure for passwords. Use HTTPS in production.
    db: 'v18',
};

export const login = async (username: string, password: string): Promise<any> => {
    // Remove trailing slash if present to avoid double slashes
    const baseUrl = ODOO_CONFIG.url.replace(/\/$/, '');
    const url = `${baseUrl}/jsonrpc`;

    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'common',
            method: 'login',
            args: [ODOO_CONFIG.db, username, password],
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
            throw new Error(result.error.data.message || result.error.message);
        }

        // result.result contains the UID if successful, or false if failed
        if (result.result) {
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
        console.error('Login Error: Connection failed or server error');
        return {
            success: false,
            error: error.message || 'Error de conexión',
        };
    }
};
