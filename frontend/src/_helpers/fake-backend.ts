// src/_helpers/fake-backend-fetch.ts
import { Role } from '@/models/role';

interface Account {
    id: number;
    title?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    password: string;
    confirmPassword?: string;
    dateCreated: string;
    verificationToken?: string;
    verified?: Date;
    resetToken?: string;
    resetTokenExpires?: Date;
    isVerified: boolean;
    refreshTokens: string[];
    jwtToken?: string;
}

// Array in local storage for accounts
const accountsKey = 'vue-accounts';
let accounts: Account[] = JSON.parse(localStorage.getItem(accountsKey) || '[]');

// Helper functions
const helpers = {
    basicDetails: (account: Account) => {
        const { id, title, firstName, lastName, email, role, dateCreated, isVerified } = account;
        return { id, title, firstName, lastName, email, role, dateCreated, isVerified };
    },
    idFromUrl: (url: string): number => {
        const urlParts = url.split('/');
        return parseInt(urlParts[urlParts.length - 1]);
    },
    newAccountId: (): number => {
        return accounts.length ? Math.max(...accounts.map(x => x.id)) + 1 : 1;
    },
    currentAccount: (headers: Headers): Account | undefined => {
        const authHeader = headers.get('Authorization') || headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer fake-jwt-token')) return;

        try {
            const tokenParts = authHeader.split('.');
            if (tokenParts.length !== 2) return;
            
            const jwtToken = JSON.parse(atob(tokenParts[1]));
            if (Date.now() > jwtToken.exp * 1000) return; // Token expired
            
            return accounts.find(x => x.id === jwtToken.id);
        } catch {
            return undefined;
        }
    },
    generateJwtToken: (account: Account): string => {
        const tokenPayload = {
            exp: Math.round(Date.now() / 1000) + (15 * 60), // 15 minutes
            id: account.id,
            role: account.role
        };
        return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
    },
    generateRefreshToken: (): string => {
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `fakeRefreshToken=${token}; expires=${expires.toUTCString()}; path=/`;
        return token;
    },
    getRefreshToken: (): string | undefined => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('fakeRefreshToken='))
            ?.split('=')[1];
    },
    isAuthenticated: (headers: Headers): boolean => {
        return !!helpers.currentAccount(headers);
    },
    isAuthorized: (role: Role, headers: Headers): boolean => {
        const account = helpers.currentAccount(headers);
        return !!account && account.role === role;
    }
};

// Request handlers
const handlers = {
    authenticate: async (request: Request) => {
        const data = await request.json();
        const { email, password } = data;
        const account = accounts.find(x => 
            x.email === email && 
            x.password === password && 
            x.isVerified
        );

        if (!account) {
            throw { status: 400, message: 'Email or password is incorrect' };
        }

        account.refreshTokens.push(helpers.generateRefreshToken());
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify({
            ...helpers.basicDetails(account),
            jwtToken: helpers.generateJwtToken(account)
        }), { status: 200 });
    },

    refreshToken: async () => {
        const refreshToken = helpers.getRefreshToken();
        if (!refreshToken) throw { status: 401, message: 'Unauthorized' };

        const account = accounts.find(x => x.refreshTokens.includes(refreshToken));
        if (!account) throw { status: 401, message: 'Unauthorized' };

        account.refreshTokens = account.refreshTokens.filter(x => x !== refreshToken);
        account.refreshTokens.push(helpers.generateRefreshToken());
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify({
            ...helpers.basicDetails(account),
            jwtToken: helpers.generateJwtToken(account)
        }), { status: 200 });
    },

    register: async (request: Request) => {
        const data = await request.json();
        if (accounts.some(x => x.email === data.email)) {
            throw { status: 400, message: `Email ${data.email} is already registered` };
        }

        const account: Account = {
            ...data,
            id: helpers.newAccountId(),
            role: data.id === 1 ? Role.Admin : Role.User,
            dateCreated: new Date().toISOString(),
            verificationToken: crypto.randomUUID(),
            isVerified: false,
            refreshTokens: []
        };
        delete account.confirmPassword;

        accounts.push(account);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify(helpers.basicDetails(account)), { status: 201 });
    },

    verifyEmail: async (request: Request) => {
        const data = await request.json();
        const token = data.token;
        const account = accounts.find(x => x.verificationToken === token);
        if (!account) throw { status: 400, message: 'Verification failed' };

        account.isVerified = true;
        account.verified = new Date();
        delete account.verificationToken;
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(null, { status: 200 });
    },

    getAccounts: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }
        return new Response(JSON.stringify(accounts.map(helpers.basicDetails)), { status: 200 });
    },

    getAccountById: (request: Request) => {
        const currentAccount = helpers.currentAccount(request.headers);
        if (!currentAccount) throw { status: 401, message: 'Unauthorized' };

        const url = new URL(request.url);
        const id = helpers.idFromUrl(url.pathname);
        const account = accounts.find(x => x.id === id);
        if (!account) throw { status: 404, message: 'Account not found' };

        if (account.id !== currentAccount.id && !helpers.isAuthorized(Role.Admin, request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }

        return new Response(JSON.stringify(helpers.basicDetails(account)), { status: 200 });
    }
};

export function configureFakeBackend() {
    // Override global fetch
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        try {
            // Test endpoint
            if (pathname.endsWith('/test') && request.method === 'GET') {
                console.log('Fake backend test endpoint called');
                return new Response(JSON.stringify({ message: 'Test successful' }), { status: 200 });
            }

            // Authentication
            if (pathname.endsWith('/accounts/authenticate') && request.method === 'POST') {
                return handlers.authenticate(request);
            }

            // Refresh token
            if (pathname.endsWith('/accounts/refresh-token') && request.method === 'POST') {
                return handlers.refreshToken();
            }

            // Register
            if (pathname.endsWith('/accounts/register') && request.method === 'POST') {
                return handlers.register(request);
            }

            // Verify email
            if (pathname.endsWith('/accounts/verify-email') && request.method === 'POST') {
                return handlers.verifyEmail(request);
            }

            // Get accounts
            if (pathname.endsWith('/accounts') && request.method === 'GET') {
                return handlers.getAccounts(request);
            }

            // Get account by id
            if (pathname.match(/\/accounts\/\d+$/) && request.method === 'GET') {
                return handlers.getAccountById(request);
            }

            // Fall back to original fetch for other requests
            return originalFetch(input, init);
        } catch (error: any) {
            return new Response(JSON.stringify({ 
                message: error.message || 'Server Error' 
            }), { 
                status: error.status || 500 
            });
        }
    };
}

// Initialize with a default admin account if none exists
if (!accounts.some(account => account.role === Role.Admin)) {
    accounts.push({
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123',
        role: Role.Admin,
        dateCreated: new Date().toISOString(),
        isVerified: true,
        refreshTokens: []
    });
    localStorage.setItem(accountsKey, JSON.stringify(accounts));
}