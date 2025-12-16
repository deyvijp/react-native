import { LoginResult } from '../types/odoo';

export interface SessionState {
    uid: number;
    username: string;
    password?: string; // Optional, might not want to store it long term
    sessionId?: string;
    partnerId?: number;
    userContext?: any;
    companyId?: number;
}

let session: SessionState = {
    uid: 0,
    username: '',
};

export const setSession = (data: SessionState) => {
    session = { ...session, ...data };
    console.log('Session state updated:', { ...session, password: '***' });
};

export const updateSessionId = (newSessionId: string) => {
    if (newSessionId && newSessionId !== session.sessionId) {
        console.log('Updating Session ID from response header');
        session.sessionId = newSessionId;
    }
}

export const getSession = () => session;

export const clearSession = () => {
    session = { uid: 0, username: '' };
};
