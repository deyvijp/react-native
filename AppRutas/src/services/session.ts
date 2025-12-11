
let session = {
    uid: 0,
    username: '',
    password: '',
};

export const setSession = (uid: number, username: string, password: string) => {
    session = { uid, username, password };
};

export const getSession = () => session;

export const clearSession = () => {
    session = { uid: 0, username: '', password: '' };
};
