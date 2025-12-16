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

        // Check for HTTP errors
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.data?.message || result.error.message);
        }

        if (result.result && result.result.uid) {
            let sessionId = result.result.session_id;

            // Odoo 18+ does not return session_id in JSON body typically.
            // We MUST extract it from the Set-Cookie header.
            const rpcCookieHeader = response.headers.get('set-cookie');
            if (rpcCookieHeader) {
                const match = rpcCookieHeader.match(/session_id=([^;]+)/);
                if (match) {
                    sessionId = match[1];
                }
            }
            console.log('RPC Extracted SessionID:', sessionId);

            // 1. RPC Login Successful. Now we MUST enforce Web Session sync.
            // Problem: RPC session often creates "Public User" orders in Website context.
            // Solution: Perform a real POST /web/login to get the authoritative Website Cookie.

            try {
                console.log('Performing Web Login verification with CSRF scraping...');

                // 1. GET login page to obtain CSRF token
                const loginPageResp = await fetch(`${baseUrl}/web/login`, {
                    method: 'GET',
                    headers: { 'User-Agent': 'React Native App' }
                });
                const loginPageHtml = await loginPageResp.text();

                // Extract CSRF Token
                // Look for: <input type="hidden" name="csrf_token" value="..."
                const csrfMatch = loginPageHtml.match(/name="csrf_token" value="([^"]+)"/);
                const csrfToken = csrfMatch ? csrfMatch[1] : '';
                console.log('CSRF Token found:', csrfToken ? 'Yes' : 'No');

                if (csrfToken) {
                    // 2. POST to login with token
                    // Odoo expects x-www-form-urlencoded, not FormData (multipart) usually
                    const params = new URLSearchParams();
                    params.append('login', username);
                    params.append('password', password);
                    params.append('csrf_token', csrfToken);
                    // params.append('redirect', '/my/home'); // Optional: force redirect check

                    // Maintain the cookie from the GET request
                    const getCookie = loginPageResp.headers.get('set-cookie');
                    const headers: any = {
                        'User-Agent': 'React Native App',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Referer': `${baseUrl}/web/login`,
                        'Origin': baseUrl
                    };
                    if (getCookie) {
                        const sessionMatch = getCookie.match(/session_id=([^;]+)/);
                        if (sessionMatch) headers['Cookie'] = `session_id=${sessionMatch[1]}`;
                    }

                    console.log('Posting Web Login Credentials...');
                    const webLoginResp = await fetch(`${baseUrl}/web/login?db=${ENV.ODOO_DB}`, {
                        method: 'POST',
                        body: params.toString(),
                        headers: headers,
                        redirect: 'manual' // Manual so we can see the 303 redirect
                    });

                    console.log('Web Login Status:', webLoginResp.status);

                    // If 303/302, it Means SUCCESS!
                    const webCookie = webLoginResp.headers.get('set-cookie');
                    if (webCookie) {
                        const webSessionMatch = webCookie.match(/session_id=([^;]+)/);
                        if (webSessionMatch) {
                            const webSessionId = webSessionMatch[1];
                            console.log('Web Login Explicit Cookie (Authenticated):', webSessionId);
                            if (webSessionId !== sessionId) {
                                console.log('Swapping RPC ID for Authenticated Web ID');
                                sessionId = webSessionId;
                                if (result.result) {
                                    result.result.session_id = webSessionId;
                                }
                            }
                        }
                    }
                } else {
                    console.warn('Could not find CSRF token, skipping explicit Web Login');
                }
            } catch (webAuthErr) {
                console.warn('Secondary Web Login failed:', webAuthErr);
            }

            // Try secondary web login ONLY if we have a session but verify it fails logic
            // ... (removed complex secondary login for now to isolate the cookie issue)
            // Instead, let's trust the cookie we have.

            // VERIFICATION: Check if this session is valid for Website (Portal)
            try {
                const verifyResp = await fetch(`${baseUrl}/my/home`, {
                    headers: { 'Cookie': `session_id=${sessionId}` }
                });

                // If redirect to login, header location or url change happens
                if (verifyResp.url.includes('/web/login') || verifyResp.url.includes('signin')) {
                    console.warn('WARNING: The obtained session is NOT valid for Website/Portal access. It redirects to login.');
                    console.warn('This explains why carts are Public User.');
                } else {
                    console.log('Session verified: Access to /my/home granted. User is recognized on Website.');
                }
            } catch (vErr) {
                console.log('Verification check failed (network?):', vErr);
            }

            console.log('Login successful:', {
                uid: result.result.uid,
                username: username,
                hasSessionId: !!sessionId
            });

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
