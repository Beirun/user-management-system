// fake-backend.ts
import { Role } from '@/models/role'; // Assuming Role enum is defined elsewhere

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

// --- New Models for Fake Backend ---
interface Department {
    id: number;
    name: string;
    description: string;
    created: string;
    updated?: string;
    // employeeCount is a derived property, will be calculated on the fly
}

interface Employee {
    id: number;
    accountId: number;
    departmentId: number;
    position: string;
    hireDate: string; // "YYYY-MM-DD"
    status: string;
    created: string;
    updated?: string;
}

interface RequestItem {
    id: number;
    requestId: number;
    name: string;
    quantity: number;
    created: string;
    updated?: string;
}

interface RequestLeave {
    id: number;
    requestId: number;
    startDate: string; // "YYYY-MM-DD"
    endDate: string;   // "YYYY-MM-DD"
    created: string;
    updated?: string;
}

interface AppRequest { // Renamed to AppRequest to avoid conflict with global Request
    id: number;
    employeeId: number;
    type: string; // 'Leave', 'Item', 'Equipment'
    status: string; // 'Pending', 'Approved', 'Rejected'
    requestDate: string;
    created: string;
    updated?: string;
}

interface Workflow {
    id: number;
    employeeId: number;
    type: string;
    details: string;
    status: string; // 'Pending', 'ForReviewing', 'Completed'
    created: string;
    updated?: string;
}


// --- Local Storage Keys ---
const accountsKey = 'vue-accounts';
const departmentsKey = 'vue-departments';
const employeesKey = 'vue-employees';
const requestsKey = 'vue-requests';
const requestItemsKey = 'vue-request-items';
const requestLeavesKey = 'vue-request-leaves';
const workflowsKey = 'vue-workflows';

// --- Data Arrays ---
let accounts: Account[] = JSON.parse(localStorage.getItem(accountsKey) || '[]');
let departments: Department[] = JSON.parse(localStorage.getItem(departmentsKey) || '[]');
let employees: Employee[] = JSON.parse(localStorage.getItem(employeesKey) || '[]');
let appRequests: AppRequest[] = JSON.parse(localStorage.getItem(requestsKey) || '[]'); // Renamed
let requestItems: RequestItem[] = JSON.parse(localStorage.getItem(requestItemsKey) || '[]');
let requestLeaves: RequestLeave[] = JSON.parse(localStorage.getItem(requestLeavesKey) || '[]');
let workflows: Workflow[] = JSON.parse(localStorage.getItem(workflowsKey) || '[]');


// --- Helper functions ---
const helpers = {
    basicDetails: (account: Account) => {
        const { id, title, firstName, lastName, email, role, created, updated, isVerified, status, lastLogin } = account;
        return { id, title, firstName, lastName, email, role, created, updated, isVerified, status, lastLogin };
    },
    idFromUrl: (urlPath: string): number => { // Changed parameter name for clarity
        const urlParts = urlPath.split('/');
        return parseInt(urlParts[urlParts.length - 1]);
    },
    newId: <T extends { id: number }>(collection: T[]): number => {
        return collection.length ? Math.max(...collection.map(x => x.id)) + 1 : 1;
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
            exp: Math.round(Date.now() / 1000) + (15 * 60 * 60), // Extended to 15 hours for easier testing
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
    isAuthorized: (role: Role | Role[], headers: Headers): boolean => {
        const account = helpers.currentAccount(headers);
        if (!account) return false;
        if (Array.isArray(role)) {
            return role.includes(account.role);
        }
        return account.role === role;
    },
    hashPassword: async (password: string): Promise<string> => {
        return Promise.resolve(`fake-hash-${password}`);
    },
    randomTokenString: (): string => {
        return crypto.randomUUID().replace(/-/g, '');
    }
};

// --- Request handlers ---
const accountHandlers = { /* ... your existing account handlers ... */
    authenticate: async (request: Request) => {
        const data = await request.json();
        const { email, password } = data;
        const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const account = accounts.find(x => x.email === email);

        if (!account || !account.isVerified || account.password !== password) {
            throw { status: 400, message: 'Email or password is incorrect' };
        }
        account.lastLogin = new Date();
        const jwtToken = helpers.generateJwtToken(account);
        const refreshToken = helpers.generateRefreshToken(ipAddress);
        account.refreshTokens = account.refreshTokens || [];
        account.refreshTokens.push(refreshToken);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
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
        const newJwtToken = helpers.generateJwtToken(account);
        const newRefreshToken = helpers.generateRefreshToken(ipAddress);
        account.refreshTokens = account.refreshTokens
            .filter(t => t.token !== refreshToken)
            .concat(newRefreshToken);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
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
        account.refreshTokens = account.refreshTokens.filter(t => t.token !== token);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
        return new Response(JSON.stringify({ message: 'Token revoked' }), { status: 200 });
    },
    register: async (request: Request) => {
        const data = await request.json();
        if (accounts.some(x => x.email === data.email)) {
            throw { status: 400, message: `Email ${data.email} is already registered` };
        }
        const account: Account = {
            ...data,
            id: helpers.newId(accounts),
            role: accounts.length === 0 ? Role.Admin : Role.User, // First user is Admin
            status: accounts.length === 0 ? 'Active' : 'Inactive',
            created: new Date().toISOString(),
            verificationToken: helpers.randomTokenString(),
            isVerified: accounts.length === 0, // First user is auto-verified
            verified: accounts.length === 0 ? new Date() : undefined,
            refreshTokens: [],
            password: data.password
        };
        delete account.confirmPassword;
        accounts.push(account);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
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
        if (!account) {
            return new Response(JSON.stringify({
                message: 'Please check your email for password reset instructions'
            }), { status: 200 });
        }
        account.resetToken = helpers.randomTokenString();
        account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
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
        account.password = password; // In a real app, hash this
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
            token: account.isVerified ? undefined : account.verificationToken
        }), { status: 200 });
    },
    isPasswordCorrect: async (request: Request) => {
        const data = await request.json();
        const account = accounts.find(x => x.email === data.email);
        if (!account) {
            throw { status: 400, message: 'Email not found' };
        }
        // Compare plain text passwords for fake backend
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
    createAccount: async (request: Request) => { // Admin only for creating arbitrary accounts
        if (!helpers.isAuthorized(Role.Admin, request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }
        const data = await request.json();
        if (accounts.some(x => x.email === data.email)) {
            throw { status: 400, message: `Email ${data.email} is already registered` };
        }
        const account: Account = {
            ...data,
            id: helpers.newId(accounts),
            created: new Date().toISOString(),
            isVerified: true, // Admin created accounts are auto-verified
            verified: new Date(),
            refreshTokens: [],
            password: data.password, // In a real app, hash this
            role: data.role || Role.User,
            status: data.status || 'Active',
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
        if (account.id !== currentAccount.id && !helpers.isAuthorized(Role.Admin, request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }
        const data = await request.json();
        if (data.email && account.email !== data.email && accounts.some(x => x.id !== id && x.email === data.email)) {
            throw { status: 400, message: `Email ${data.email} is already taken` };
        }
        // Admins can change roles, users cannot
        if (data.role && account.role !== data.role && !helpers.isAuthorized(Role.Admin, request.headers)) {
            delete data.role; // Prevent non-admins from changing role
        }
        if (data.password) {
            account.password = data.password; // Update password if provided
            delete data.password; // Don't store plain password in other fields
        }

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
        if (accounts[accountIndex].id !== currentAccount.id && !helpers.isAuthorized(Role.Admin, request.headers)) {
            throw { status: 401, message: 'Unauthorized' };
        }
        accounts.splice(accountIndex, 1);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
        return new Response(JSON.stringify({ message: 'Account deleted successfully' }), { status: 200 });
    }
};

const departmentHandlers = {
    getAll: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const result = departments.map(d => ({
            ...d,
            employeeCount: employees.filter(e => e.departmentId === d.id).length
        }));
        return new Response(JSON.stringify(result), { status: 200 });
    },
    getById: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const department = departments.find(d => d.id === id);
        if (!department) throw { status: 404, message: 'Department not found' };
        return new Response(JSON.stringify({
            ...department,
            employeeCount: employees.filter(e => e.departmentId === department.id).length
        }), { status: 200 });
    },
    create: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const data = await request.json();
        if (!data.name) throw { status: 400, message: 'Name is required' };
        const newDepartment: Department = {
            id: helpers.newId(departments),
            name: data.name,
            description: data.description || '',
            created: new Date().toISOString(),
        };
        departments.push(newDepartment);
        localStorage.setItem(departmentsKey, JSON.stringify(departments));
        return new Response(JSON.stringify({ message: 'Department created successfully!' }), { status: 201 });
    },
    update: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const department = departments.find(d => d.id === id);
        if (!department) throw { status: 404, message: 'Department not found' };
        const data = await request.json();
        Object.assign(department, data);
        department.updated = new Date().toISOString();
        localStorage.setItem(departmentsKey, JSON.stringify(departments));
        return new Response(JSON.stringify({ message: 'Department updated successfully!' }), { status: 200 });
    },
    delete: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const departmentIndex = departments.findIndex(d => d.id === id);
        if (departmentIndex === -1) throw { status: 404, message: 'Department not found' };

        const employeeCount = employees.filter(e => e.departmentId === id).length;
        if (employeeCount > 0) {
            throw { status: 400, message: `Department cannot be deleted because it has ${employeeCount} employees assigned` };
        }
        departments.splice(departmentIndex, 1);
        localStorage.setItem(departmentsKey, JSON.stringify(departments));
        return new Response(JSON.stringify({ message: 'Department deleted successfully' }), { status: 200 });
    }
};

const employeeHandlers = {
    getAll: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const result = employees.map(emp => {
            const account = accounts.find(acc => acc.id === emp.accountId);
            const department = departments.find(dep => dep.id === emp.departmentId);
            return {
                ...emp,
                account: account ? { email: account.email, firstName: account.firstName, lastName: account.lastName, title: account.title } : undefined,
                department: department ? { id: department.id, name: department.name } : undefined,
                // workflows and requests can be added here if fetched together
            };
        });
        return new Response(JSON.stringify(result), { status: 200 });
    },
    getById: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const employee = employees.find(e => e.id === id);
        if (!employee) throw { status: 404, message: 'Employee not found' };
        const account = accounts.find(acc => acc.id === employee.accountId);
        const department = departments.find(dep => dep.id === employee.departmentId);
        return new Response(JSON.stringify({
             ...employee,
             account: account ? { email: account.email, firstName: account.firstName, lastName: account.lastName, title: account.title } : undefined,
             department: department ? { id: department.id, name: department.name } : undefined,
        }), { status: 200 });
    },
    create: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const data = await request.json();
        if (!data.accountId || !data.departmentId || !data.position || !data.hireDate || !data.status) {
            throw { status: 400, message: 'Missing required employee fields' };
        }
        if (!accounts.find(acc => acc.id === data.accountId)) throw { status: 400, message: 'Account not found' };
        if (!departments.find(dep => dep.id === data.departmentId)) throw { status: 400, message: 'Department not found' };

        const newEmployee: Employee = {
            id: helpers.newId(employees),
            accountId: data.accountId,
            departmentId: data.departmentId,
            position: data.position,
            hireDate: data.hireDate, // Should be YYYY-MM-DD
            status: data.status,
            created: new Date().toISOString(),
        };
        employees.push(newEmployee);
        localStorage.setItem(employeesKey, JSON.stringify(employees));
        return new Response(JSON.stringify({ message: 'Employee created' }), { status: 201 });
    },
    update: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const employee = employees.find(e => e.id === id);
        if (!employee) throw { status: 404, message: 'Employee not found' };
        const data = await request.json();
        // Prevent changing accountId or departmentId directly via this endpoint (use transfer for department)
        delete data.accountId;
        delete data.departmentId;
        Object.assign(employee, data);
        employee.updated = new Date().toISOString();
        localStorage.setItem(employeesKey, JSON.stringify(employees));
        return new Response(JSON.stringify({ message: 'Employee updated' }), { status: 200 });
    },
    delete: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const employeeIndex = employees.findIndex(e => e.id === id);
        if (employeeIndex === -1) throw { status: 404, message: 'Employee not found' };
        employees.splice(employeeIndex, 1);
        localStorage.setItem(employeesKey, JSON.stringify(employees));
        // Consider deleting related workflows and requests or reassigning them
        return new Response(JSON.stringify({ message: 'Employee deleted' }), { status: 200 });
    },
    transferDepartment: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname.replace('/transfer', '')); // Adjust path
        const employee = employees.find(e => e.id === id);
        if (!employee) throw { status: 404, message: 'Employee not found' };
        const data = await request.json();
        if (!data.departmentId) throw { status: 400, message: 'New Department ID is required' };
        if (!departments.find(dep => dep.id === data.departmentId)) throw { status: 400, message: 'Target department not found' };
        if (employee.departmentId === data.departmentId) throw { status: 400, message: 'Employee already in this department' };

        employee.departmentId = data.departmentId;
        employee.updated = new Date().toISOString();
        localStorage.setItem(employeesKey, JSON.stringify(employees));
        return new Response(JSON.stringify({ message: 'Employee transfered' }), { status: 200 });
    }
};

const requestHandlers = {
    getAll: (request: Request) => { // Assuming this means all requests, accessible by admin or based on user role
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        // For simplicity, admin sees all, users see their own. Adjust if needed.
        const currentAccount = helpers.currentAccount(request.headers);
        let filteredRequests = appRequests;
        if (currentAccount && currentAccount.role !== Role.Admin) {
            const userEmployee = employees.find(e => e.accountId === currentAccount.id);
            if (userEmployee) {
                filteredRequests = appRequests.filter(r => r.employeeId === userEmployee.id);
            } else {
                filteredRequests = []; // Non-employee users see no requests unless admin
            }
        }
        return new Response(JSON.stringify(filteredRequests.map(r => ({
            ...r,
            requestItem: r.type !== 'Leave' ? requestItems.find(item => item.requestId === r.id) : undefined,
            requestLeave: r.type === 'Leave' ? requestLeaves.find(leave => leave.requestId === r.id) : undefined,
        }))), { status: 200 });
    },
    getById: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const req = appRequests.find(r => r.id === id);
        if (!req) throw { status: 404, message: 'Request not found' };

        // Authorization: User can see their own request, Admin can see any
        const currentAccount = helpers.currentAccount(request.headers);
        const employeeForRequest = employees.find(e => e.id === req.employeeId);
        if (currentAccount?.role !== Role.Admin && (!employeeForRequest || employeeForRequest.accountId !== currentAccount?.id)) {
            throw { status: 403, message: 'Forbidden: You do not have permission to view this request.' };
        }

        return new Response(JSON.stringify({
            ...req,
            requestItem: req.type !== 'Leave' ? requestItems.find(item => item.requestId === req.id) : undefined,
            requestLeave: req.type === 'Leave' ? requestLeaves.find(leave => leave.requestId === req.id) : undefined,
        }), { status: 200 });
    },
    getByEmployeeId: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const employeeId = helpers.idFromUrl(new URL(request.url).pathname.replace('/employee/', '')); // Adjust path
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) throw { status: 404, message: 'Employee not found' };

        // Authorization: User can see their own requests if their employeeId matches, Admin can see any
        const currentAccount = helpers.currentAccount(request.headers);
        if (currentAccount?.role !== Role.Admin && employee.accountId !== currentAccount?.id) {
             throw { status: 403, message: 'Forbidden: You do not have permission to view these requests.' };
        }

        const employeeRequests = appRequests.filter(r => r.employeeId === employeeId).map(r => ({
            ...r,
            requestItem: r.type !== 'Leave' ? requestItems.find(item => item.requestId === r.id) : undefined,
            requestLeave: r.type === 'Leave' ? requestLeaves.find(leave => leave.requestId === r.id) : undefined,
        }));
        return new Response(JSON.stringify(employeeRequests), { status: 200 });
    },
    create: async (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const data = await request.json();
        const currentAccount = helpers.currentAccount(request.headers);
        const employee = employees.find(e => e.accountId === currentAccount?.id);

        if (!employee && currentAccount?.role !== Role.Admin) { // Allow admin to create for any employeeId if provided
            throw { status: 403, message: 'User is not an employee or not authorized to create requests.' };
        }

        const employeeIdToUse = currentAccount?.role === Role.Admin && data.employeeId ? data.employeeId : employee?.id;
        if (!employeeIdToUse) throw { status: 400, message: 'Employee ID is required or could not be determined.' };
        if (!data.type) throw { status: 400, message: 'Request type is required' };

        const newReq: AppRequest = {
            id: helpers.newId(appRequests),
            employeeId: employeeIdToUse,
            type: data.type,
            status: 'Pending',
            requestDate: new Date().toISOString(),
            created: new Date().toISOString(),
        };
        appRequests.push(newReq);

        if (data.type === 'Leave') {
            if (!data.startDate || !data.endDate) throw { status: 400, message: 'Start date and end date are required for leave requests' };
            const newLeave: RequestLeave = {
                id: helpers.newId(requestLeaves),
                requestId: newReq.id,
                startDate: data.startDate,
                endDate: data.endDate,
                created: new Date().toISOString(),
            };
            requestLeaves.push(newLeave);
        } else { // Item or Equipment
            if (!data.name || !data.quantity) throw { status: 400, message: 'Name and quantity are required for item requests' };
            const newItem: RequestItem = {
                id: helpers.newId(requestItems),
                requestId: newReq.id,
                name: data.name,
                quantity: data.quantity,
                created: new Date().toISOString(),
            };
            requestItems.push(newItem);
        }

        localStorage.setItem(requestsKey, JSON.stringify(appRequests));
        localStorage.setItem(requestItemsKey, JSON.stringify(requestItems));
        localStorage.setItem(requestLeavesKey, JSON.stringify(requestLeaves));
        return new Response(JSON.stringify({ message: 'Request created successfully' }), { status: 201 });
    },
    update: async (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const req = appRequests.find(r => r.id === id);
        if (!req) throw { status: 404, message: 'Request not found' };

        // Authorization: Admin can update any, user can update their own if pending
        const currentAccount = helpers.currentAccount(request.headers);
        const employeeForRequest = employees.find(e => e.id === req.employeeId);
        const isOwner = employeeForRequest && employeeForRequest.accountId === currentAccount?.id;

        if (currentAccount?.role !== Role.Admin && !isOwner) {
            throw { status: 403, message: 'Forbidden: You cannot update this request.' };
        }
        if (currentAccount?.role !== Role.Admin && isOwner && req.status !== 'Pending') {
            throw { status: 400, message: 'Cannot update request that is not pending.'}
        }

        const data = await request.json();
        if (data.status) req.status = data.status; // Admins can change status
        req.updated = new Date().toISOString();

        if (req.type === 'Leave' && (data.startDate || data.endDate)) {
            const leaveDetail = requestLeaves.find(l => l.requestId === req.id);
            if (leaveDetail) {
                if(data.startDate) leaveDetail.startDate = data.startDate;
                if(data.endDate) leaveDetail.endDate = data.endDate;
                leaveDetail.updated = new Date().toISOString();
            }
        } else if (req.type !== 'Leave' && (data.name || data.quantity)) {
            const itemDetail = requestItems.find(i => i.requestId === req.id);
            if (itemDetail) {
                if(data.name) itemDetail.name = data.name;
                if(data.quantity) itemDetail.quantity = data.quantity;
                itemDetail.updated = new Date().toISOString();
            }
        }

        localStorage.setItem(requestsKey, JSON.stringify(appRequests));
        localStorage.setItem(requestItemsKey, JSON.stringify(requestItems));
        localStorage.setItem(requestLeavesKey, JSON.stringify(requestLeaves));
        return new Response(JSON.stringify({ message: 'Request updated successfully' }), { status: 200 });
    },
    delete: async (request: Request) => {
        // Only Admin can delete or user if request is pending
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const reqIndex = appRequests.findIndex(r => r.id === id);
        if (reqIndex === -1) throw { status: 404, message: 'Request not found' };
        const reqToDelete = appRequests[reqIndex];

        const currentAccount = helpers.currentAccount(request.headers);
        const employeeForRequest = employees.find(e => e.id === reqToDelete.employeeId);
        const isOwner = employeeForRequest && employeeForRequest.accountId === currentAccount?.id;

        if (currentAccount?.role !== Role.Admin && !(isOwner && reqToDelete.status === 'Pending')) {
            throw { status: 403, message: 'Forbidden: You cannot delete this request or it is not in a deletable state.' };
        }

        appRequests.splice(reqIndex, 1);
        if (reqToDelete.type === 'Leave') {
            requestLeaves = requestLeaves.filter(l => l.requestId !== reqToDelete.id);
        } else {
            requestItems = requestItems.filter(i => i.requestId !== reqToDelete.id);
        }
        localStorage.setItem(requestsKey, JSON.stringify(appRequests));
        localStorage.setItem(requestItemsKey, JSON.stringify(requestItems));
        localStorage.setItem(requestLeavesKey, JSON.stringify(requestLeaves));
        return new Response(JSON.stringify({ message: 'Request deleted successfully' }), { status: 200 });
    }
};

const workflowHandlers = {
    // GET /workflows/employee/:id
    getByEmployeeId: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const employeeId = helpers.idFromUrl(new URL(request.url).pathname.replace('/employee/', ''));
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) throw { status: 404, message: 'Employee not found for workflows' };

        // Authorization: User can see their own workflows if their employeeId matches, Admin can see any
        const currentAccount = helpers.currentAccount(request.headers);
        if (currentAccount?.role !== Role.Admin && employee.accountId !== currentAccount?.id) {
             throw { status: 403, message: 'Forbidden: You do not have permission to view these workflows.' };
        }
        const employeeWorkflows = workflows.filter(w => w.employeeId === employeeId);
        return new Response(JSON.stringify(employeeWorkflows), { status: 200 });
    },
    // POST /workflows/ (Generic workflow creation)
    create: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for generic workflow creation' };
        const data = await request.json();
        if (!data.employeeId || !data.type || !data.details) {
            throw { status: 400, message: 'Missing required fields for workflow' };
        }
        if (!employees.find(e => e.id === data.employeeId)) throw { status: 400, message: 'Employee not found for workflow' };
        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: data.type,
            details: data.details,
            status: data.status || 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify(newWorkflow), { status: 201 }); // Return created object
    },
    // PUT /workflows/:id
    update: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized to update workflow' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) throw { status: 404, message: 'Workflow not found' };
        const data = await request.json();
        Object.assign(workflow, data);
        workflow.updated = new Date().toISOString();
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify(workflow), { status: 200 }); // Return updated object
    },
    // DELETE /workflows/:id
    delete: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized to delete workflow' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const workflowIndex = workflows.findIndex(w => w.id === id);
        if (workflowIndex === -1) throw { status: 404, message: 'Workflow not found' };
        workflows.splice(workflowIndex, 1);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({ message: 'Workflow deleted successfully' }), { status: 200 });
    },
    // POST /workflows/onboarding
    onboarding: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for onboarding workflow' };
        const data = await request.json();
        if (!data.employeeId) throw { status: 400, message: 'Employee ID required for onboarding' };
        const employee = employees.find(e => e.id === data.employeeId);
        if (!employee) throw { status: 404, message: 'Employee not found for onboarding' };
        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: 'Onboarding',
            details: `Setting up workstation for ${employee.position} (ID: ${employee.id})`,
            status: 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify(newWorkflow), { status: 201 }); // Return created object
    },
    // POST /workflows/transfer
    transfer: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for transfer workflow' };
        const data = await request.json(); // Expects { employeeId, oldDepartment: { name }, newDepartment: { name } }
        if (!data.employeeId || !data.oldDepartment?.name || !data.newDepartment?.name) {
            throw { status: 400, message: 'Employee ID, old department name, and new department name required' };
        }
        if (!employees.find(e => e.id === data.employeeId)) throw { status: 404, message: 'Employee not found for transfer workflow' };
        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: 'Department Transfer',
            details: `Employee transfered from ${data.oldDepartment.name} to ${data.newDepartment.name}`,
            status: 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({ message: "Workflow transfer created" }), { status: 201 });
    },
    // POST /workflows/leave
    leave: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for leave workflow' };
        const data = await request.json(); // Expects { employeeId, startDate, endDate }
        if (!data.employeeId || !data.startDate || !data.endDate) {
            throw { status: 400, message: 'Employee ID, start date, and end date required' };
        }
        if (!employees.find(e => e.id === data.employeeId)) throw { status: 404, message: 'Employee not found for leave workflow' };
        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: 'Request Approval', // Matches backend service
            details: `Employee requested leave from ${data.startDate} to ${data.endDate}`,
            status: 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({ message: "Workflow request leave created" }), { status: 201 });
    },
    // POST /workflows/resources
    resources: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for resources workflow' };
        const data = await request.json(); // Expects { employeeId, name, quantity }
        if (!data.employeeId || !data.name || data.quantity === undefined) {
            throw { status: 400, message: 'Employee ID, item name, and quantity required' };
        }
        if (!employees.find(e => e.id === data.employeeId)) throw { status: 404, message: 'Employee not found for resources workflow' };
        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: 'Request Approval', // Matches backend service
            details: `Employee requested ${data.quantity} ${data.name}${data.quantity > 1 ? 's' : ''}`,
            status: 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({ message: "Workflow request item created" }), { status: 201 });
    }
};


export function configureFakeBackend() {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        const { pathname } = url; // Use const for pathname

        try {
            // Accounts
            if (pathname.endsWith('/accounts/authenticate') && request.method === 'POST') return accountHandlers.authenticate(request);
            if (pathname.endsWith('/accounts/refresh-token') && request.method === 'POST') return accountHandlers.refreshToken(request);
            if (pathname.endsWith('/accounts/revoke-token') && request.method === 'POST') return accountHandlers.revokeToken(request);
            if (pathname.endsWith('/accounts/register') && request.method === 'POST') return accountHandlers.register(request);
            if (pathname.endsWith('/accounts/verify-email') && request.method === 'POST') return accountHandlers.verifyEmail(request);
            if (pathname.endsWith('/accounts/forgot-password') && request.method === 'POST') return accountHandlers.forgotPassword(request);
            if (pathname.endsWith('/accounts/validate-reset-token') && request.method === 'POST') return accountHandlers.validateResetToken(request);
            if (pathname.endsWith('/accounts/reset-password') && request.method === 'POST') return accountHandlers.resetPassword(request);
            if (pathname.endsWith('/accounts/is-email-verified') && request.method === 'POST') return accountHandlers.isEmailVerified(request);
            if (pathname.endsWith('/accounts/is-password-correct') && request.method === 'POST') return accountHandlers.isPasswordCorrect(request);
            if (pathname.endsWith('/accounts/email-exists') && request.method === 'POST') return accountHandlers.emailExists(request);
            if (pathname.match(/\/accounts\/\d+$/) && request.method === 'GET') return accountHandlers.getAccountById(request);
            if (pathname.match(/\/accounts\/\d+$/) && request.method === 'PUT') return accountHandlers.updateAccount(request);
            if (pathname.match(/\/accounts\/\d+$/) && request.method === 'DELETE') return accountHandlers.deleteAccount(request);
            if (pathname.endsWith('/accounts/') && request.method === 'GET') return accountHandlers.getAccounts(request); // Must be after /:id
            if (pathname.endsWith('/accounts/') && request.method === 'POST') return accountHandlers.createAccount(request); // Must be after /:id

            // Departments
            if (pathname.match(/\/departments\/\d+$/) && request.method === 'GET') return departmentHandlers.getById(request);
            if (pathname.match(/\/departments\/\d+$/) && request.method === 'PUT') return departmentHandlers.update(request);
            if (pathname.match(/\/departments\/\d+$/) && request.method === 'DELETE') return departmentHandlers.delete(request);
            if (pathname.endsWith('/departments/') && request.method === 'GET') return departmentHandlers.getAll(request);
            if (pathname.endsWith('/departments/') && request.method === 'POST') return departmentHandlers.create(request);

            // Employees
            if (pathname.match(/\/employees\/\d+\/transfer$/) && request.method === 'POST') return employeeHandlers.transferDepartment(request);
            if (pathname.match(/\/employees\/\d+$/) && request.method === 'GET') return employeeHandlers.getById(request);
            if (pathname.match(/\/employees\/\d+$/) && request.method === 'PUT') return employeeHandlers.update(request);
            if (pathname.match(/\/employees\/\d+$/) && request.method === 'DELETE') return employeeHandlers.delete(request);
            if (pathname.endsWith('/employees/') && request.method === 'GET') return employeeHandlers.getAll(request);
            if (pathname.endsWith('/employees/') && request.method === 'POST') return employeeHandlers.create(request);

            // Requests
            if (pathname.match(/\/requests\/employee\/\d+$/) && request.method === 'GET') return requestHandlers.getByEmployeeId(request);
            if (pathname.match(/\/requests\/\d+$/) && request.method === 'GET') return requestHandlers.getById(request);
            if (pathname.match(/\/requests\/\d+$/) && request.method === 'PUT') return requestHandlers.update(request);
            if (pathname.match(/\/requests\/\d+$/) && request.method === 'DELETE') return requestHandlers.delete(request);
            if (pathname.endsWith('/requests/') && request.method === 'GET') return requestHandlers.getAll(request);
            if (pathname.endsWith('/requests/') && request.method === 'POST') return requestHandlers.create(request);

            // Workflows
            if (pathname.endsWith('/workflows/onboarding') && request.method === 'POST') return workflowHandlers.onboarding(request);
            if (pathname.endsWith('/workflows/transfer') && request.method === 'POST') return workflowHandlers.transfer(request);
            if (pathname.endsWith('/workflows/leave') && request.method === 'POST') return workflowHandlers.leave(request);
            if (pathname.endsWith('/workflows/resources') && request.method === 'POST') return workflowHandlers.resources(request);
            if (pathname.match(/\/workflows\/employee\/\d+$/) && request.method === 'GET') return workflowHandlers.getByEmployeeId(request);
            if (pathname.match(/\/workflows\/\d+$/) && request.method === 'PUT') return workflowHandlers.update(request);
            if (pathname.match(/\/workflows\/\d+$/) && request.method === 'DELETE') return workflowHandlers.delete(request);
            if (pathname.endsWith('/workflows/') && request.method === 'POST') return workflowHandlers.create(request); // Generic create

            // Fall back to original fetch
            return originalFetch(input, init);
        } catch (error: any) {
            console.error("Fake backend error:", error);
            return new Response(JSON.stringify({
                message: error.message || 'Server Error'
            }), {
                status: error.status || 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    };
}

// --- Initialize with default data if local storage is empty ---
if (!accounts.length) {
    accounts.push({
        id: helpers.newId(accounts),
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123', // Plain text for fake backend
        role: Role.Admin,
        status: 'Active',
        lastLogin: new Date(),
        created: new Date().toISOString(),
        isVerified: true,
        verified: new Date(),
        refreshTokens: []
    });
    localStorage.setItem(accountsKey, JSON.stringify(accounts));
}

// Example initial data for other entities (optional)
if (!departments.length) {
    departments.push(
        { id: helpers.newId(departments), name: 'Human Resources', description: 'Manages employee relations', created: new Date().toISOString() },
        { id: helpers.newId(departments), name: 'Engineering', description: 'Develops new products', created: new Date().toISOString() }
    );
    localStorage.setItem(departmentsKey, JSON.stringify(departments));
}

if (!employees.length && accounts.length > 0 && departments.length > 0) {
    const adminAccount = accounts.find(a => a.role === Role.Admin);
    const hrDepartment = departments.find(d => d.name === 'Human Resources');
    if (adminAccount && hrDepartment) {
        employees.push({
            id: helpers.newId(employees),
            accountId: adminAccount.id,
            departmentId: hrDepartment.id,
            position: 'Head Admin',
            hireDate: '2023-01-01',
            status: 'Active',
            created: new Date().toISOString()
        });
        localStorage.setItem(employeesKey, JSON.stringify(employees));
    }
}

// Ensure this is called to set up the fetch override
// configureFakeBackend(); // Call this from your main.ts or equivalent setup file