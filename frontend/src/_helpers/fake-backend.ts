// fake-backend.ts
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
    status: string;
    lastLogin: Date;
    created: string;
    updated?: string;
    verificationToken?: string;
    verified?: Date;
    resetToken?: string;
    resetTokenExpires?: Date;
    isVerified: boolean;
    refreshTokens: { token: string; expires: Date; createdByIp: string }[];
    jwtToken?: string;
    passwordHash?: string;
    acceptTerms?: boolean;
}

// Array in local storage for accounts
const accountsKey = 'vue-accounts';
let accounts: Account[] = JSON.parse(localStorage.getItem(accountsKey) || '[]');

// Helper functions
const helpers = {
    basicDetails: (account: Account) => {
        const { id, title, firstName, lastName, email, role, created, updated, isVerified, status, lastLogin } = account;
        return { id, title, firstName, lastName, email, role, created, updated, isVerified, status, lastLogin };
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
    generateRefreshToken: (ipAddress: string): { token: string; expires: Date; createdByIp: string } => {
        return {
            token: crypto.randomUUID(),
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdByIp: ipAddress
        };
    },
    getRefreshTokenFromCookie: (request: Request): string | undefined => {
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader) return undefined;
        
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
        return refreshTokenCookie?.split('=')[1];
    },
    isAuthenticated: (headers: Headers): boolean => {
        return !!helpers.currentAccount(headers);
    },
    isAuthorized: (role: Role, headers: Headers): boolean => {
        const account = helpers.currentAccount(headers);
        return !!account && account.role === role;
    },
    hashPassword: async (password: string): Promise<string> => {
        // Simulate bcrypt hashing with a simple hash for fake backend
        return Promise.resolve(`fake-hash-${password}`);
    },
    randomTokenString: (): string => {
        return crypto.randomUUID().replace(/-/g, '');
    }
};

// Request handlers
const handlers = {
    authenticate: async (request: Request) => {
        const data = await request.json();
        const { email, password } = data;
        const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const account = accounts.find(x => x.email === email);
        
        if (!account || !account.isVerified || account.password !== password) {
            throw { status: 400, message: 'Email or password is incorrect' };
        }

        // Update last login
        account.lastLogin = new Date();
        
        // Generate tokens
        const jwtToken = helpers.generateJwtToken(account);
        const refreshToken = helpers.generateRefreshToken(ipAddress);
        
        // Save refresh token
        account.refreshTokens = account.refreshTokens || [];
        account.refreshTokens.push(refreshToken);
        
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        // Set cookie in response
        const response = new Response(JSON.stringify({
            ...helpers.basicDetails(account),
            jwtToken,
            refreshToken: refreshToken.token
        }), { status: 200 });
        
        response.headers.append('Set-Cookie', 
            `refreshToken=${refreshToken.token}; HttpOnly; Expires=${refreshToken.expires.toUTCString()}; Path=/`);
        
        return response;
    },

    refreshToken: async (request: Request) => {
        const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const refreshToken = helpers.getRefreshTokenFromCookie(request);
        if (!refreshToken) throw { status: 401, message: 'Unauthorized' };

        const account = accounts.find(x => 
            x.refreshTokens?.some(t => t.token === refreshToken && new Date(t.expires) > new Date())
        );
        if (!account) throw { status: 401, message: 'Unauthorized' };

        // Generate new tokens
        const newJwtToken = helpers.generateJwtToken(account);
        const newRefreshToken = helpers.generateRefreshToken(ipAddress);
        
        // Replace old refresh token
        account.refreshTokens = account.refreshTokens
            .filter(t => t.token !== refreshToken)
            .concat(newRefreshToken);
        
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        // Set cookie in response
        const response = new Response(JSON.stringify({
            ...helpers.basicDetails(account),
            jwtToken: newJwtToken,
            refreshToken: newRefreshToken.token
        }), { status: 200 });
        
        response.headers.append('Set-Cookie', 
            `refreshToken=${newRefreshToken.token}; HttpOnly; Expires=${newRefreshToken.expires.toUTCString()}; Path=/`);
        
        return response;
    },

    revokeToken: async (request: Request) => {
        const data = await request.json();
        const token = data.token || helpers.getRefreshTokenFromCookie(request);
        if (!token) throw { status: 400, message: 'Token is required' };

        const account = accounts.find(x => 
            x.refreshTokens?.some(t => t.token === token)
        );
        if (!account) throw { status: 400, message: 'Token not found' };

        // Revoke token
        account.refreshTokens = account.refreshTokens.filter(t => t.token !== token);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify({ message: 'Token revoked' }), { status: 200 });
    },

    register: async (request: Request) => {
        const data = await request.json();
        const origin = request.headers.get('origin') || '';
        
        if (accounts.some(x => x.email === data.email)) {
            // Simulate sending already registered email
            console.log(`Would send already registered email to ${data.email}`);
            throw { status: 400, message: `Email ${data.email} is already registered` };
        }

        const account: Account = {
            ...data,
            id: helpers.newAccountId(),
            role: accounts.length === 0 ? Role.Admin : Role.User,
            status: accounts.length === 0 ? 'Active' : 'Inactive',
            created: new Date().toISOString(),
            verificationToken: helpers.randomTokenString(),
            isVerified: false,
            refreshTokens: [],
            password: data.password // In real backend, this would be hashed
        };
        delete account.confirmPassword;

        accounts.push(account);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        // Simulate sending verification email
        console.log(`Would send verification email to ${account.email} with token ${account.verificationToken}`);

        return new Response(JSON.stringify({ 
            message: 'Registration successful, please check your email for verification instructions' 
        }), { status: 201 });
    },

    verifyEmail: async (request: Request) => {
        const data = await request.json();
        const token = data.token;
        const account = accounts.find(x => x.verificationToken === token);
        if (!account) throw { status: 400, message: 'Verification failed' };

        account.isVerified = true;
        account.verified = new Date();
        account.status = 'Active';
        delete account.verificationToken;
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify({ 
            message: 'Verification successful, you can now login' 
        }), { status: 200 });
    },

    forgotPassword: async (request: Request) => {
        const data = await request.json();
        const origin = request.headers.get('origin') || '';
        const account = accounts.find(x => x.email === data.email);
        
        // Always return success to prevent email enumeration
        if (!account) {
            return new Response(JSON.stringify({ 
                message: 'Please check your email for password reset instructions' 
            }), { status: 200 });
        }

        // Create reset token that expires after 24 hours
        account.resetToken = helpers.randomTokenString();
        account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        // Simulate sending password reset email
        console.log(`Would send password reset email to ${account.email} with token ${account.resetToken}`);
        
        const resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
        return new Response(JSON.stringify({ 
            url: resetUrl,
            message: 'Please check your email for password reset instructions' 
        }), { status: 200 });
    },

    validateResetToken: async (request: Request) => {
        const data = await request.json();
        const token = data.token;
        const account = accounts.find(x => 
            x.resetToken === token && 
            x.resetTokenExpires && 
            new Date(x.resetTokenExpires) > new Date()
        );

        if (!account) throw { status: 400, message: 'Invalid token' };

        return new Response(JSON.stringify({ 
            message: 'Token is valid' 
        }), { status: 200 });
    },

    resetPassword: async (request: Request) => {
        const data = await request.json();
        const { token, password, confirmPassword } = data;
        
        if (password !== confirmPassword) {
            throw { status: 400, message: 'Passwords do not match' };
        }

        const account = accounts.find(x => 
            x.resetToken === token && 
            x.resetTokenExpires && 
            new Date(x.resetTokenExpires) > new Date()
        );
        if (!account) throw { status: 400, message: 'Invalid token' };

        // Update password and clear reset token
        account.password = password;
        account.resetToken = undefined;
        account.resetTokenExpires = undefined;
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify({ 
            message: 'Password reset successful, you can now login' 
        }), { status: 200 });
    },

    isEmailVerified: async (request: Request) => {
        const data = await request.json();
        const account = accounts.find(x => x.email === data.email);
        
        if (!account) {
            throw { status: 400, message: 'Email not found' };
        }

        return new Response(JSON.stringify({ 
            isVerified: account.isVerified,
            token: account.verificationToken
        }), { status: 200 });
    },

    isPasswordCorrect: async (request: Request) => {
        const data = await request.json();
        const account = accounts.find(x => x.email === data.email);
        
        if (!account) {
            throw { status: 400, message: 'Email not found' };
        }

        return new Response(JSON.stringify({ 
            isCorrect: account.password === data.password
        }), { status: 200 });
    },

    emailExists: async (request: Request) => {
        const data = await request.json();
        const exists = accounts.some(x => x.email === data.email);
        
        return new Response(JSON.stringify({ 
            exists
        }), { status: 200 });
    },

    getAccounts: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }
        console.log("accounts",accounts)
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
    },

    createAccount: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }

        const data = await request.json();
        if (accounts.some(x => x.email === data.email)) {
            throw { status: 400, message: `Email ${data.email} is already registered` };
        }

        const account: Account = {
            ...data,
            id: helpers.newAccountId(),
            created: new Date().toISOString(),
            isVerified: true,
            verified: new Date(),
            refreshTokens: [],
            password: data.password // In real backend, this would be hashed
        };
        delete account.confirmPassword;

        accounts.push(account);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify(helpers.basicDetails(account)), { status: 201 });
    },

    updateAccount: async (request: Request) => {
        const currentAccount = helpers.currentAccount(request.headers);
        if (!currentAccount) throw { status: 401, message: 'Unauthorized' };

        const url = new URL(request.url);
        const id = helpers.idFromUrl(url.pathname);
        const account = accounts.find(x => x.id === id);
        if (!account) throw { status: 404, message: 'Account not found' };

        // Users can update their own account and admins can update any account
        if (account.id !== currentAccount.id && !helpers.isAuthorized(Role.Admin, request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }

        const data = await request.json();
        
        // Validate if email was changed
        if (data.email && account.email !== data.email && accounts.some(x => x.email === data.email)) {
            throw { status: 400, message: `Email ${data.email} is already taken` };
        }

        // Update account
        Object.assign(account, data);
        account.updated = new Date().toISOString();
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify(helpers.basicDetails(account)), { status: 200 });
    },

    deleteAccount: async (request: Request) => {
        const currentAccount = helpers.currentAccount(request.headers);
        if (!currentAccount) throw { status: 401, message: 'Unauthorized' };

        const url = new URL(request.url);
        const id = helpers.idFromUrl(url.pathname);
        const accountIndex = accounts.findIndex(x => x.id === id);
        if (accountIndex === -1) throw { status: 404, message: 'Account not found' };

        // Users can delete their own account and admins can delete any account
        if (accounts[accountIndex].id !== currentAccount.id && !helpers.isAuthorized(Role.Admin, request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }

        accounts.splice(accountIndex, 1);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));

        return new Response(JSON.stringify({ message: 'Account deleted successfully' }), { status: 200 });
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
            // Authentication
            if (pathname.endsWith('/accounts/authenticate') && request.method === 'POST') {
                return handlers.authenticate(request);
            }

            // Refresh token
            if (pathname.endsWith('/accounts/refresh-token') && request.method === 'POST') {
                return handlers.refreshToken(request);
            }

            // Revoke token
            if (pathname.endsWith('/accounts/revoke-token') && request.method === 'POST') {
                return handlers.revokeToken(request);
            }

            // Register
            if (pathname.endsWith('/accounts/register') && request.method === 'POST') {
                return handlers.register(request);
            }

            // Verify email
            if (pathname.endsWith('/accounts/verify-email') && request.method === 'POST') {
                return handlers.verifyEmail(request);
            }

            // Forgot password
            if (pathname.endsWith('/accounts/forgot-password') && request.method === 'POST') {
                return handlers.forgotPassword(request);
            }

            // Validate reset token
            if (pathname.endsWith('/accounts/validate-reset-token') && request.method === 'POST') {
                return handlers.validateResetToken(request);
            }

            // Reset password
            if (pathname.endsWith('/accounts/reset-password') && request.method === 'POST') {
                return handlers.resetPassword(request);
            }

            // Check email verification status
            if (pathname.endsWith('/accounts/is-email-verified') && request.method === 'POST') {
                return handlers.isEmailVerified(request);
            }

            // Check password correctness
            if (pathname.endsWith('/accounts/is-password-correct') && request.method === 'POST') {
                return handlers.isPasswordCorrect(request);
            }

            // Check if email exists
            if (pathname.endsWith('/accounts/email-exists') && request.method === 'POST') {
                return handlers.emailExists(request);
            }

            // Get all accounts
            if (pathname.endsWith('/accounts/') && request.method === 'GET') {
                console.log("Here")
                return handlers.getAccounts(request);
            }

            // Get account by id
            if (pathname.match(/\/accounts\/\d+$/) && request.method === 'GET') {
                return handlers.getAccountById(request);
            }

            // Create account
            if (pathname.endsWith('/accounts/') && request.method === 'POST') {
                return handlers.createAccount(request);
            }

            // Update account
            if (pathname.match(/\/accounts\/\d+$/) && request.method === 'PUT') {
                return handlers.updateAccount(request);
            }

            // Delete account
            if (pathname.match(/\/accounts\/\d+$/) && request.method === 'DELETE') {
                return handlers.deleteAccount(request);
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
        status: 'Active',
        lastLogin: new Date(),
        created: new Date().toISOString(),
        isVerified: true,
        refreshTokens: []
    });
    localStorage.setItem(accountsKey, JSON.stringify(accounts));
}