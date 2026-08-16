export const authKeys = {
    all: ['auth'],
    register: () => [...authKeys.all, 'register'],
    login: () => [...authKeys.all, 'login'],
};