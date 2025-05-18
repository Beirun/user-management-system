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
    type: string; // 'Leave', 'Item', 'Equipment', 'Resources'
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
    status: string;
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
let appRequests: AppRequest[] = JSON.parse(localStorage.getItem(requestsKey) || '[]');
let requestItems: RequestItem[] = JSON.parse(localStorage.getItem(requestItemsKey) || '[]');
let requestLeaves: RequestLeave[] = JSON.parse(localStorage.getItem(requestLeavesKey) || '[]');
let workflows: Workflow[] = JSON.parse(localStorage.getItem(workflowsKey) || '[]');


// --- Helper functions ---
const helpers = {
    basicDetails: (account: Account) => {
        const { id, title, firstName, lastName, email, role, created, updated, isVerified, status, lastLogin } = account;
        return { id, title, firstName, lastName, email, role, created, updated, isVerified, status, lastLogin };
    },
    idFromUrl: (urlPath: string): number => {
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
            if (Date.now() > jwtToken.exp * 1000) return;

            return accounts.find(x => x.id === jwtToken.id);
        } catch {
            return undefined;
        }
    },
    generateJwtToken: (account: Account): string => {
        const tokenPayload = {
            exp: Math.round(Date.now() / 1000) + (15 * 60 * 60), // 15 hours, was 15 min in original, example service implies longer
            id: account.id,
            role: account.role
        };
        return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
    },
    generateRefreshToken: (ipAddress: string): { token: string; expires: Date; createdByIp: string } => {
        return {
            token: crypto.randomUUID(),
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    hashPassword: async (password: string): Promise<string> => { // Not used, but kept for consistency
        return Promise.resolve(`fake-hash-${password}`);
    },
    randomTokenString: (): string => {
        return crypto.randomUUID().replace(/-/g, '');
    }
};

// --- Request handlers ---
const accountHandlers = {
    authenticate: async (request: Request) => {
        const data = await request.json();
        const { email, password } = data;
        const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const account = accounts.find(x => x.email === email);

        if (!account || !account.isVerified || account.password !== password) { // Plain text password check for fake backend
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
        if (!account) throw { status: 400, message: 'Token not found' }; // Or 401 if preferred
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
            role: accounts.length === 0 ? Role.Admin : Role.User,
            status: 'Inactive',
            created: new Date().toISOString(),
            verificationToken: helpers.randomTokenString(),
            isVerified: accounts.length === 0,
            verified: accounts.length === 0 ? new Date() : undefined,
            refreshTokens: [],
            password: data.password // Store plain for fake backend
        };
        delete account.confirmPassword;
        accounts.push(account);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
        // Simulate sending email
        console.log(`Fake Backend: Would send verification email to ${account.email} with token ${account.verificationToken}`);
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
        if (!account) { // Silently succeed as per best practices
            return new Response(JSON.stringify({
                message: 'If your email is registered, you will receive password reset instructions.'
            }), { status: 200 });
        }
        account.resetToken = helpers.randomTokenString();
        account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
        // Simulate sending email
        const resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
        console.log(`Fake Backend: Would send password reset email to ${account.email} with token ${account.resetToken}. URL: ${resetUrl}`);
        return new Response(JSON.stringify({
            // url: resetUrl, // Typically not returned to client
            message: 'If your email is registered, you will receive password reset instructions.'
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
        if (!account) throw { status: 400, message: 'Invalid or expired token' };
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
        if (!account) throw { status: 400, message: 'Invalid or expired token' };
        account.password = password; // Store plain for fake backend
        account.resetToken = undefined;
        account.resetTokenExpires = undefined;
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
        return new Response(JSON.stringify({
            message: 'Password reset successful, you can now login'
        }), { status: 200 });
    },
    isEmailVerified: async (request: Request) => { // Custom endpoint, not standard
        const data = await request.json();
        const account = accounts.find(x => x.email === data.email);
        if (!account) {
            throw { status: 404, message: 'Email not found' };
        }
        return new Response(JSON.stringify({
            isVerified: account.isVerified,
            token: account.isVerified ? undefined : account.verificationToken // For resending, if needed
        }), { status: 200 });
    },
    isPasswordCorrect: async (request: Request) => { // Custom endpoint, not standard
        const data = await request.json();
        const account = accounts.find(x => x.email === data.email);
        if (!account) {
            throw { status: 404, message: 'Email not found' };
        }
        return new Response(JSON.stringify({
            isCorrect: account.password === data.password
        }), { status: 200 });
    },
    emailExists: async (request: Request) => { // Custom endpoint, not standard
        const data = await request.json();
        const exists = accounts.some(x => x.email === data.email);
        return new Response(JSON.stringify({
            exists
        }), { status: 200 });
    },
    getAccounts: (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) { // Typically Admin only
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
            throw { status: 403, message: 'Forbidden' };
        }
        return new Response(JSON.stringify(helpers.basicDetails(account)), { status: 200 });
    },
    createAccount: async (request: Request) => { // Admin only
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
            isVerified: true,
            verified: new Date(),
            refreshTokens: [],
            password: data.password,
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
            throw { status: 403, message: 'Forbidden' };
        }
        const data = await request.json();
        if (data.email && account.email !== data.email && accounts.some(x => x.id !== id && x.email === data.email)) {
            throw { status: 400, message: `Email ${data.email} is already taken` };
        }
        if (data.role && account.role !== data.role && !helpers.isAuthorized(Role.Admin, request.headers)) {
            delete data.role;
        }
        if (data.password) {
            account.password = data.password;
            delete data.password; // Don't store plain password in other fields if it's not the password field itself
        }

        // Prevent overwriting critical fields by non-admins or if not intended
        const isAdmin = helpers.isAuthorized(Role.Admin, request.headers);
        const allowedUpdates = { ...data };
        if (!isAdmin) {
            delete allowedUpdates.role;
            delete allowedUpdates.status; // Example: only admin can change status
        }
        delete allowedUpdates.id; // ID should not be changed
        delete allowedUpdates.created; // Creation date should not be changed
        delete allowedUpdates.verified; // Verification date should not be changed by user update
        delete allowedUpdates.isVerified; // isVerified status should not be changed by user update (use verify-email)


        Object.assign(account, allowedUpdates);
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
            throw { status: 403, message: 'Forbidden' };
        }
        // Check if employee exists for this account
        if (employees.some(emp => emp.accountId === id)) {
            throw { status: 400, message: 'Cannot delete account. It is associated with an employee. Please delete the employee record first.' };
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
            ...d, // In a real backend, toJSON() might be used, here spread is fine
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
        return new Response(JSON.stringify({ message: 'Department created successfully.' }), { status: 201 });
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
        return new Response(JSON.stringify({ message: 'Department updated successfully.' }), { status: 200 });
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
        return new Response(JSON.stringify({ message: 'Department deleted successfully.' }), { status: 200 });
    }
};

const employeeHandlers = {
    getAll: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const result = employees.map(emp => {
            const account = accounts.find(acc => acc.id === emp.accountId);
            const department = departments.find(dep => dep.id === emp.departmentId);
            
            const employeeWorkflows = workflows.filter(w => w.employeeId === emp.id);
            const employeeRequests = appRequests
                .filter(r => r.employeeId === emp.id)
                .map(r => ({
                    ...r,
                    requestItems: r.type !== 'Leave' ? requestItems.filter(item => item.requestId === r.id) : undefined,
                    requestLeave: r.type === 'Leave' ? requestLeaves.find(leave => leave.requestId === r.id) : undefined,
                }));

            return {
                ...emp,
                account: account ? { email: account.email, firstName: account.firstName, lastName: account.lastName, title: account.title } : undefined,
                department: department ? { id: department.id, name: department.name } : undefined, // Node service returns full department object
                workflows: employeeWorkflows,
                requests: employeeRequests,
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
        // Node service getById doesn't explicitly include workflows/requests, so we'll match that simplicity here.
        // If it did, we'd add them like in getAll.
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
            throw { status: 400, message: 'Missing required employee fields: accountId, departmentId, position, hireDate, status' };
        }
        if (!accounts.find(acc => acc.id === data.accountId)) throw { status: 400, message: 'Account not found for provided accountId' };
        if (employees.some(e => e.accountId === data.accountId)) throw { status: 400, message: 'This account is already linked to an employee.' };
        if (!departments.find(dep => dep.id === data.departmentId)) throw { status: 400, message: 'Department not found for provided departmentId' };

        const newEmployee: Employee = {
            id: helpers.newId(employees),
            accountId: data.accountId,
            departmentId: data.departmentId,
            position: data.position,
            hireDate: data.hireDate, // Assume "YYYY-MM-DD"
            status: data.status,
            created: new Date().toISOString(),
        };
        employees.push(newEmployee);
        localStorage.setItem(employeesKey, JSON.stringify(employees));
        // The Node service comments out workflowService.onboarding(employee);
        // Client would call /workflows/onboarding separately if needed.
        return new Response(JSON.stringify({ message: 'Employee created successfully.', employee: newEmployee }), { status: 201 });
    },
    update: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const employee = employees.find(e => e.id === id);
        if (!employee) throw { status: 404, message: 'Employee not found' };
        
        const data = await request.json();
        // Per Node service, accountId and departmentId are not updated here. departmentId is via /transfer
        delete data.accountId; 
        delete data.departmentId;
        delete data.id; // cannot change id
        delete data.created; // cannot change created

        Object.assign(employee, data);
        employee.updated = new Date().toISOString();
        localStorage.setItem(employeesKey, JSON.stringify(employees));
        return new Response(JSON.stringify({ message: 'Employee updated successfully.' }), { status: 200 });
    },
    delete: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const employeeIndex = employees.findIndex(e => e.id === id);
        if (employeeIndex === -1) throw { status: 404, message: 'Employee not found' };

        // Check for associated requests or workflows before deleting, if strict deletion is desired
        if (appRequests.some(req => req.employeeId === id)) {
            throw { status: 400, message: 'Cannot delete employee. They have associated requests. Please resolve or reassign requests first.' };
        }
        if (workflows.some(wf => wf.employeeId === id)) {
            throw { status: 400, message: 'Cannot delete employee. They have associated workflows. Please resolve or reassign workflows first.' };
        }

        employees.splice(employeeIndex, 1);
        localStorage.setItem(employeesKey, JSON.stringify(employees));
        return new Response(JSON.stringify({ message: 'Employee deleted successfully.' }), { status: 200 });
    },
    transferDepartment: async (request: Request) => {
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname.replace('/transfer', ''));
        const employee = employees.find(e => e.id === id);
        if (!employee) throw { status: 404, message: 'Employee not found' };
        
        const data = await request.json();
        if (data.departmentId === undefined || data.departmentId === null) throw { status: 400, message: 'New Department ID (departmentId) is required' };
        if (!departments.find(dep => dep.id === data.departmentId)) throw { status: 400, message: 'Target department not found' };
        if (employee.departmentId === data.departmentId) throw { status: 400, message: 'Employee is already in this department' };

        // The Node service comments out workflowService.transferDepartment.
        // Client would call /workflows/transfer separately.
        // We need old department for that workflow, so let's assume client has it or fetches it.
        employee.departmentId = data.departmentId;
        employee.updated = new Date().toISOString();
        localStorage.setItem(employeesKey, JSON.stringify(employees));
        return new Response(JSON.stringify({ message: 'Employee transfered successfully.' }), { status: 200 });
    }
};

const requestHandlers = {
    getAll: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const currentAccount = helpers.currentAccount(request.headers);
        let filteredAppRequests = appRequests;

        // If not admin, filter to only show requests for the current user's employee record
        if (currentAccount && currentAccount.role !== Role.Admin) {
            const userEmployee = employees.find(e => e.accountId === currentAccount.id);
            if (userEmployee) {
                filteredAppRequests = appRequests.filter(r => r.employeeId === userEmployee.id);
            } else {
                // User is not an employee, or no employee record found for this account
                filteredAppRequests = []; 
            }
        }

        return new Response(JSON.stringify(filteredAppRequests.map(r => ({
            ...r,
            requestItems: r.type !== 'Leave' ? requestItems.filter(item => item.requestId === r.id) : undefined, // Node service returns array
            requestLeave: r.type === 'Leave' ? requestLeaves.find(leave => leave.requestId === r.id) : undefined, // Node service returns object
        }))), { status: 200 });
    },
    getById: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const req = appRequests.find(r => r.id === id);
        if (!req) throw { status: 404, message: 'Request not found' };

        const currentAccount = helpers.currentAccount(request.headers);
        const employeeForRequest = employees.find(e => e.id === req.employeeId);
        if (currentAccount?.role !== Role.Admin && (!employeeForRequest || employeeForRequest.accountId !== currentAccount?.id)) {
            throw { status: 403, message: 'Forbidden: You do not have permission to view this request.' };
        }

        return new Response(JSON.stringify({
            ...req,
            requestItem: req.type !== 'Leave' ? requestItems.filter(item => item.requestId === req.id) : undefined,
            requestLeave: req.type === 'Leave' ? requestLeaves.find(leave => leave.requestId === req.id) : undefined,
        }), { status: 200 });
    },
    getByEmployeeId: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const employeeId = helpers.idFromUrl(new URL(request.url).pathname.replace('/employee/', ''));
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) throw { status: 404, message: 'Employee not found' };

        const currentAccount = helpers.currentAccount(request.headers);
        if (currentAccount?.role !== Role.Admin && employee.accountId !== currentAccount?.id) {
             throw { status: 403, message: 'Forbidden: You do not have permission to view these requests.' };
        }

        const employeeRequests = appRequests.filter(r => r.employeeId === employeeId).map(r => ({
            ...r,
            requestItem: r.type !== 'Leave' ? requestItems.filter(item => item.requestId === r.id) : undefined,
            requestLeave: r.type === 'Leave' ? requestLeaves.find(leave => leave.requestId === r.id) : undefined,
        }));
        return new Response(JSON.stringify(employeeRequests), { status: 200 });
    },
    create: async (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const data = await request.json(); // Node service expects { employeeId, type, items?, startDate?, endDate?, status?, requestDate? }
        const currentAccount = helpers.currentAccount(request.headers);
        
        let employeeIdToUse = data.employeeId;
        if (!employeeIdToUse) { // If employeeId not provided by an admin, try to get it from current user
            const employee = employees.find(e => e.accountId === currentAccount?.id);
            if (!employee) {
                 throw { status: 403, message: 'User is not an employee or employeeId not provided.' };
            }
            employeeIdToUse = employee.id;
        } else { // employeeId IS provided, check if current user is admin
            if (currentAccount?.role !== Role.Admin) {
                 throw { status: 403, message: 'Only admins can create requests for other employees.' };
            }
            if (!employees.find(e => e.id === employeeIdToUse)) {
                throw { status: 400, message: 'Provided employeeId does not correspond to an existing employee.' };
            }
        }

        if (!data.type) throw { status: 400, message: 'Request type is required' };

        const newReq: AppRequest = {
            id: helpers.newId(appRequests),
            employeeId: employeeIdToUse,
            type: data.type,
            status: data.status || 'Pending',
            requestDate: data.requestDate || new Date().toISOString().slice(0,10), // YYYY-MM-DD
            created: new Date().toISOString(),
        };
        appRequests.push(newReq);

        if (data.type === 'Leave') {
            if (!data.startDate || !data.endDate) throw { status: 400, message: 'Start date and end date are required for leave requests' };
            const newLeave: RequestLeave = {
                id: helpers.newId(requestLeaves),
                requestId: newReq.id,
                startDate: data.startDate, // Assume YYYY-MM-DD
                endDate: data.endDate,     // Assume YYYY-MM-DD
                created: new Date().toISOString(),
            };
            requestLeaves.push(newLeave);
        } else { // Item, Equipment, Resources
            if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
                throw { status: 400, message: 'At least one item is required for this request type (Item, Equipment, Resources).' };
            }
            data.items.forEach((item: { name: string, quantity: number }) => {
                if (!item.name || (item.quantity === undefined || item.quantity === null || item.quantity <= 0)) {
                    throw { status: 400, message: 'Each item must have a name and a valid positive quantity.' };
                }
                const newItem: RequestItem = {
                    id: helpers.newId(requestItems),
                    requestId: newReq.id,
                    name: item.name,
                    quantity: item.quantity,
                    created: new Date().toISOString(),
                };
                requestItems.push(newItem);
            });
        }

        localStorage.setItem(requestsKey, JSON.stringify(appRequests));
        localStorage.setItem(requestItemsKey, JSON.stringify(requestItems));
        localStorage.setItem(requestLeavesKey, JSON.stringify(requestLeaves));
        return new Response(JSON.stringify({ message: 'Request created successfully.' }), { status: 201 });
    },
    update: async (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const req = appRequests.find(r => r.id === id);
        if (!req) throw { status: 404, message: 'Request not found' };

        const currentAccount = helpers.currentAccount(request.headers);
        const employeeForRequest = employees.find(e => e.id === req.employeeId);
        const isOwner = employeeForRequest && employeeForRequest.accountId === currentAccount?.id;

        if (currentAccount?.role !== Role.Admin && !isOwner) {
            throw { status: 403, message: 'Forbidden: You cannot update this request.' };
        }
        // Non-admins can only update if they are the owner AND the request is 'Pending'
        if (currentAccount?.role !== Role.Admin && isOwner && req.status !== 'Pending') {
            throw { status: 400, message: 'Cannot update request that is not in Pending status.' };
        }
        // Admins can update status etc. regardless of current status.

        const data = await request.json(); // { status?, items?, startDate?, endDate? }
        
        // Admins can change status. Owners cannot directly change status via this update if not Admin.
        if (data.status && currentAccount?.role === Role.Admin) {
            req.status = data.status;
        } else if (data.status && currentAccount?.role !== Role.Admin) {
            // Silently ignore status changes from non-admins, or throw error
            // For now, ignore, as the primary purpose of update for owner is content.
        }


        if (req.type === 'Leave') {
            // For leave, only startDate and endDate can be updated (if pending by owner, or by admin)
            const leaveDetail = requestLeaves.find(l => l.requestId === req.id);
            if (leaveDetail) {
                if (data.startDate) leaveDetail.startDate = data.startDate;
                if (data.endDate) leaveDetail.endDate = data.endDate;
                leaveDetail.updated = new Date().toISOString();
            } else if (data.startDate && data.endDate) { // Should not happen if created correctly
                const newLeave: RequestLeave = {
                    id: helpers.newId(requestLeaves), requestId: req.id,
                    startDate: data.startDate, endDate: data.endDate,
                    created: new Date().toISOString(), updated: new Date().toISOString()
                };
                requestLeaves.push(newLeave);
            }
             // Remove any requestItems if type is Leave (cleanup, Node service does this)
            requestItems = requestItems.filter(i => i.requestId !== req.id);

        } else { // Item, Equipment, Resources
            // For item requests, items can be updated (if pending by owner, or by admin)
            if (data.items) {
                if (!Array.isArray(data.items)) {
                    throw { status: 400, message: 'Items must be provided as an array.' };
                }
                // Remove old items for this request
                requestItems = requestItems.filter(i => i.requestId !== req.id);
                // Add new items
                data.items.forEach((item: { name: string, quantity: number }) => {
                    if (!item.name || typeof item.quantity !== 'number' || item.quantity <= 0) {
                        throw { status: 400, message: 'Each item must have a name and a valid positive quantity.' };
                    }
                    requestItems.push({
                        id: helpers.newId(requestItems), requestId: req.id,
                        name: item.name, quantity: item.quantity,
                        created: new Date().toISOString(), updated: new Date().toISOString()
                    });
                });
            }
            // Remove any requestLeaves if type is not Leave (cleanup, Node service does this)
            requestLeaves = requestLeaves.filter(l => l.requestId !== req.id);
        }
        req.updated = new Date().toISOString();

        localStorage.setItem(requestsKey, JSON.stringify(appRequests));
        localStorage.setItem(requestItemsKey, JSON.stringify(requestItems));
        localStorage.setItem(requestLeavesKey, JSON.stringify(requestLeaves));
        
        return new Response(JSON.stringify({ message: 'Request updated successfully.' }), { status: 200 });
    },
    delete: async (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const reqIndex = appRequests.findIndex(r => r.id === id);
        if (reqIndex === -1) throw { status: 404, message: 'Request not found' };
        const reqToDelete = appRequests[reqIndex];

        const currentAccount = helpers.currentAccount(request.headers);
        const employeeForRequest = employees.find(e => e.id === reqToDelete.employeeId);
        const isOwner = employeeForRequest && employeeForRequest.accountId === currentAccount?.id;

        // Admin can delete any request. Owner can delete only if 'Pending'.
        if (currentAccount?.role !== Role.Admin && !(isOwner && reqToDelete.status === 'Pending')) {
            throw { status: 403, message: 'Forbidden: You cannot delete this request or it is not in a deletable (Pending) state.' };
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
        return new Response(JSON.stringify({ message: 'Request deleted successfully.' }), { status: 200 });
    }
};


const workflowHandlers = {
    getByEmployeeId: (request: Request) => {
        if (!helpers.isAuthenticated(request.headers)) throw { status: 401, message: 'Unauthorized' };
        const employeeId = helpers.idFromUrl(new URL(request.url).pathname.replace('/employee/', ''));
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) throw { status: 404, message: 'Employee not found for workflows' };

        const currentAccount = helpers.currentAccount(request.headers);
        if (currentAccount?.role !== Role.Admin && employee.accountId !== currentAccount?.id) {
             throw { status: 403, message: 'Forbidden: You do not have permission to view these workflows.' };
        }
        const employeeWorkflows = workflows.filter(w => w.employeeId === employeeId);
        return new Response(JSON.stringify(employeeWorkflows), { status: 200 });
    },
    create: async (request: Request) => { // Generic create, Admin only
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for generic workflow creation' };
        const data = await request.json();
        if (!data.employeeId || !data.type || !data.details) {
            throw { status: 400, message: 'Missing required fields for workflow: employeeId, type, details' };
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
        return new Response(JSON.stringify(newWorkflow), { status: 201 }); // Node service returns created workflow
    },
    update: async (request: Request) => { // Admin only to update status
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized to update workflow' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const workflow = workflows.find(w => w.id === id);
        if (!workflow) throw { status: 404, message: 'Workflow not found' };
        const data = await request.json(); // Node controller schema expects { status: Joi.string().required() }
        if (data.status === undefined) throw { status: 400, message: 'Status is required for update.' };
        
        workflow.status = data.status; // Only update status as per Node schema
        workflow.updated = new Date().toISOString();
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({message : "Workflow updated successfully."}), { status: 200 });
    },
    delete: async (request: Request) => { // Admin only
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized to delete workflow' };
        const id = helpers.idFromUrl(new URL(request.url).pathname);
        const workflowIndex = workflows.findIndex(w => w.id === id);
        if (workflowIndex === -1) throw { status: 404, message: 'Workflow not found' };
        workflows.splice(workflowIndex, 1);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({ message: 'Workflow deleted successfully.' }), { status: 200 });
    },
    onboarding: async (request: Request) => { // Admin only
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for onboarding workflow' };
        const data = await request.json(); // { employeeId }
        if (!data.employeeId) throw { status: 400, message: 'Employee ID (employeeId) required for onboarding' };
        const employee = employees.find(e => e.id === data.employeeId);
        if (!employee) throw { status: 404, message: 'Employee not found for onboarding' };
        
        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: 'Onboarding', // Matches Node service
            details: `Setting up workstation`, // Matches Node service (was more detailed before, simplified to match)
            status: 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({message: "Workflow onboarding created successfully."}), { status: 201 });
    },
    transfer: async (request: Request) => { // Admin only
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for transfer workflow' };
        const data = await request.json(); // { employeeId, oldDepartment: { name }, newDepartment: { name } }
        if (!data.employeeId || !data.oldDepartment?.name || !data.newDepartment?.name) {
            throw { status: 400, message: 'Employee ID, oldDepartment.name, and newDepartment.name required' };
        }
        if (!employees.find(e => e.id === data.employeeId)) throw { status: 404, message: 'Employee not found for transfer workflow' };
        
        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: 'Department Transfer', // Matches Node service
            details: `Employee transfered from ${data.oldDepartment.name} to ${data.newDepartment.name}`, // Matches Node service
            status: 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({ message: "Workflow transfer created successfully." }), { status: 201 });
    },
    leave: async (request: Request) => { // Admin only
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for leave workflow' };
        const data = await request.json(); // { employeeId, startDate, endDate }
        if (!data.employeeId || !data.startDate || !data.endDate) {
            throw { status: 400, message: 'Employee ID, start date, and end date required' };
        }
        if (!employees.find(e => e.id === data.employeeId)) throw { status: 404, message: 'Employee not found for leave workflow' };
        
        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: 'Request Approval', // Matches Node service (requestLeave function)
            details: `Employee requested leave from ${data.startDate} to ${data.endDate}`, // Matches Node service
            status: 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        return new Response(JSON.stringify({ message: "Workflow request leave created successfully." }), { status: 201 });
    },
    resources: async (request: Request) => { // Admin only, mapped from /workflows/resources
        if (!helpers.isAuthorized(Role.Admin, request.headers)) throw { status: 401, message: 'Unauthorized for resources workflow' };
        const data = await request.json(); // { employeeId, items: [{ name, quantity }] }
        if (!data.employeeId || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
            throw { status: 400, message: 'Employee ID and at least one item in items array are required' };
        }
        if (!employees.find(e => e.id === data.employeeId)) {
            throw { status: 404, message: 'Employee not found for resources workflow' };
        }
        for (const item of data.items) {
            if (!item.name || typeof item.quantity !== 'number' || item.quantity < 1) {
                throw { status: 400, message: 'Each item must have a name and quantity (minimum 1)' };
            }
        }

        const itemStrings = data.items.map((item: { quantity: number; name: any; }) => 
            `${item.quantity} ${item.name}${item.quantity > 1 ? 's' : ''}`
        );
        let itemSummary; // Matches Node service logic for itemSummary
        if (itemStrings.length === 1) {
            itemSummary = itemStrings[0];
        } else if (itemStrings.length > 1) {
            const allButLast = itemStrings.slice(0, -1).join(', ');
            const lastItem = itemStrings[itemStrings.length - 1];
            itemSummary = `${allButLast}, and ${lastItem}`; // Node service actually does prefix for 'and' - this is fine
        } else {
            itemSummary = "items"; // Fallback, should not happen due to validation
        }


        const newWorkflow: Workflow = {
            id: helpers.newId(workflows),
            employeeId: data.employeeId,
            type: 'Request Approval', // Matches Node service (requestItem function which is called by /resources)
            details: `Employee requested ${itemSummary}`, // Matches Node service
            status: 'Pending',
            created: new Date().toISOString(),
        };
        workflows.push(newWorkflow);
        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        // Node controller for /resources returns {message: "Workflow request item created successfully."}
        return new Response(JSON.stringify({ message: "Workflow request item created successfully." }), { status: 201 });
    }
};


export function configureFakeBackend() {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        const { pathname } = url;
        const { method } = request;

        try {
            // Accounts
            if (pathname.endsWith('/accounts/authenticate') && method === 'POST') return accountHandlers.authenticate(request);
            if (pathname.endsWith('/accounts/refresh-token') && method === 'POST') return accountHandlers.refreshToken(request);
            if (pathname.endsWith('/accounts/revoke-token') && method === 'POST') return accountHandlers.revokeToken(request);
            if (pathname.endsWith('/accounts/register') && method === 'POST') return accountHandlers.register(request);
            if (pathname.endsWith('/accounts/verify-email') && method === 'POST') return accountHandlers.verifyEmail(request);
            if (pathname.endsWith('/accounts/forgot-password') && method === 'POST') return accountHandlers.forgotPassword(request);
            if (pathname.endsWith('/accounts/validate-reset-token') && method === 'POST') return accountHandlers.validateResetToken(request);
            if (pathname.endsWith('/accounts/reset-password') && method === 'POST') return accountHandlers.resetPassword(request);
            if (pathname.endsWith('/accounts/is-email-verified') && method === 'POST') return accountHandlers.isEmailVerified(request);
            if (pathname.endsWith('/accounts/is-password-correct') && method === 'POST') return accountHandlers.isPasswordCorrect(request);
            if (pathname.endsWith('/accounts/email-exists') && method === 'POST') return accountHandlers.emailExists(request);
            if (pathname.match(/\/accounts\/\d+$/) && method === 'GET') return accountHandlers.getAccountById(request);
            if (pathname.match(/\/accounts\/\d+$/) && method === 'PUT') return accountHandlers.updateAccount(request);
            if (pathname.match(/\/accounts\/\d+$/) && method === 'DELETE') return accountHandlers.deleteAccount(request);
            if (pathname.endsWith('/accounts/') && method === 'GET') return accountHandlers.getAccounts(request);
            if (pathname.endsWith('/accounts/') && method === 'POST') return accountHandlers.createAccount(request); // Admin create

            // Departments
            if (pathname.match(/\/departments\/\d+$/) && method === 'GET') return departmentHandlers.getById(request);
            if (pathname.match(/\/departments\/\d+$/) && method === 'PUT') return departmentHandlers.update(request);
            if (pathname.match(/\/departments\/\d+$/) && method === 'DELETE') return departmentHandlers.delete(request);
            if (pathname.endsWith('/departments/') && method === 'GET') return departmentHandlers.getAll(request);
            if (pathname.endsWith('/departments/') && method === 'POST') return departmentHandlers.create(request);

            // Employees
            if (pathname.match(/\/employees\/\d+\/transfer$/) && method === 'POST') return employeeHandlers.transferDepartment(request);
            if (pathname.match(/\/employees\/\d+$/) && method === 'GET') return employeeHandlers.getById(request);
            if (pathname.match(/\/employees\/\d+$/) && method === 'PUT') return employeeHandlers.update(request);
            if (pathname.match(/\/employees\/\d+$/) && method === 'DELETE') return employeeHandlers.delete(request);
            if (pathname.endsWith('/employees/') && method === 'GET') return employeeHandlers.getAll(request);
            if (pathname.endsWith('/employees/') && method === 'POST') return employeeHandlers.create(request);

            // Requests
            if (pathname.match(/\/requests\/employee\/\d+$/) && method === 'GET') return requestHandlers.getByEmployeeId(request);
            if (pathname.match(/\/requests\/\d+$/) && method === 'GET') return requestHandlers.getById(request);
            if (pathname.match(/\/requests\/\d+$/) && method === 'PUT') return requestHandlers.update(request);
            if (pathname.match(/\/requests\/\d+$/) && method === 'DELETE') return requestHandlers.delete(request);
            if (pathname.endsWith('/requests/') && method === 'GET') return requestHandlers.getAll(request);
            if (pathname.endsWith('/requests/') && method === 'POST') return requestHandlers.create(request);

            // Workflows
            if (pathname.endsWith('/workflows/onboarding') && method === 'POST') return workflowHandlers.onboarding(request);
            if (pathname.endsWith('/workflows/transfer') && method === 'POST') return workflowHandlers.transfer(request);
            if (pathname.endsWith('/workflows/leave') && method === 'POST') return workflowHandlers.leave(request);
            if (pathname.endsWith('/workflows/resources') && method === 'POST') return workflowHandlers.resources(request);
            if (pathname.match(/\/workflows\/employee\/\d+$/) && method === 'GET') return workflowHandlers.getByEmployeeId(request);
            if (pathname.match(/\/workflows\/\d+$/) && method === 'PUT') return workflowHandlers.update(request);
            if (pathname.match(/\/workflows\/\d+$/) && method === 'DELETE') return workflowHandlers.delete(request);
            if (pathname.endsWith('/workflows/') && method === 'POST') return workflowHandlers.create(request); // Generic Admin create

            // Fallback to original fetch for unhandled routes
            return originalFetch(input, init);
        } catch (error: any) {
            console.error("Fake backend error:", error.status, error.message, error);
            return new Response(JSON.stringify({
                message: error.message || 'An unexpected error occurred in the fake backend.'
            }), {
                status: error.status || 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    };
}

// --- Initialize with default data if local storage is empty ---
function initializeDefaultData() {
    if (!accounts.length) {
        const adminAccount: Account = {
            id: 1,
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
        };
        accounts.push(adminAccount);

        const userAccount: Account = {
            id: 2,
            firstName: 'Normal',
            lastName: 'User',
            email: 'user@example.com',
            password: 'user123',
            role: Role.User,
            status: 'Active',
            lastLogin: new Date(),
            created: new Date().toISOString(),
            isVerified: true,
            verified: new Date(),
            refreshTokens: []
        };
        accounts.push(userAccount);
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
    }

    if (!departments.length) {
        departments.push(
            { id: 1, name: 'Human Resources', description: 'Manages employee relations and company policies.', created: new Date().toISOString() },
            { id: 2, name: 'Engineering', description: 'Develops new products and technologies.', created: new Date().toISOString() },
            { id: 3, name: 'Sales', description: 'Drives company revenue and customer acquisition.', created: new Date().toISOString() }
        );
        localStorage.setItem(departmentsKey, JSON.stringify(departments));
    }

    if (!employees.length && accounts.length >= 2 && departments.length >= 2) {
        const adminAcc = accounts.find(a => a.email === 'admin@example.com');
        const userAcc = accounts.find(a => a.email === 'user@example.com');
        const hrDept = departments.find(d => d.name === 'Human Resources');
        const engDept = departments.find(d => d.name === 'Engineering');

        if (adminAcc && hrDept) {
            employees.push({
                id: 1,
                accountId: adminAcc.id,
                departmentId: hrDept.id,
                position: 'HR Manager (Admin)',
                hireDate: '2023-01-15',
                status: 'Active',
                created: new Date().toISOString()
            });
        }
        if (userAcc && engDept) {
            employees.push({
                id: 2,
                accountId: userAcc.id,
                departmentId: engDept.id,
                position: 'Software Engineer',
                hireDate: '2023-03-01',
                status: 'Active',
                created: new Date().toISOString()
            });
        }
        localStorage.setItem(employeesKey, JSON.stringify(employees));
    }

    if (!appRequests.length && employees.length >= 1) {
        const emp1 = employees[0]; // Assuming employee with ID 1 exists
        if (emp1) {
            const leaveReqId = helpers.newId(appRequests);
            appRequests.push({
                id: leaveReqId, employeeId: emp1.id, type: 'Leave', status: 'Pending',
                requestDate: '2024-01-10', created: new Date().toISOString()
            });
            requestLeaves.push({
                id: helpers.newId(requestLeaves), requestId: leaveReqId,
                startDate: '2024-02-01', endDate: '2024-02-05', created: new Date().toISOString()
            });

            const itemReqId = helpers.newId(appRequests);
            appRequests.push({
                id: itemReqId, employeeId: emp1.id, type: 'Equipment', status: 'Approved',
                requestDate: '2024-01-05', created: new Date().toISOString()
            });
            requestItems.push({
                id: helpers.newId(requestItems), requestId: itemReqId,
                name: 'New Laptop', quantity: 1, created: new Date().toISOString()
            });
            requestItems.push({
                id: helpers.newId(requestItems), requestId: itemReqId,
                name: 'Ergonomic Keyboard', quantity: 1, created: new Date().toISOString()
            });
            localStorage.setItem(requestsKey, JSON.stringify(appRequests));
            localStorage.setItem(requestItemsKey, JSON.stringify(requestItems));
            localStorage.setItem(requestLeavesKey, JSON.stringify(requestLeaves));
        }
    }
    
    if (!workflows.length && employees.length >= 1) {
        const emp1 = employees[0];
        const emp2 = employees[1];
         if (emp1) {
            workflows.push({
                id: helpers.newId(workflows), employeeId: emp1.id, type: 'Onboarding',
                details: 'Setting up workstation.', status: 'Approved',
                created: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(), // Older workflow
                updated: new Date(new Date().setDate(new Date().getDate() - 29)).toISOString()
            });
            workflows.push({
                id: helpers.newId(workflows), employeeId: emp1.id, type: 'Request Approval',
                details: 'Employee requested 1 New Laptop, and 1 Ergonomic Keyboard.', status: 'Pending',
                created: new Date().toISOString()
            });
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        }
        if(emp2) {
            workflows.push({
                id: helpers.newId(workflows), employeeId: emp2.id, type: 'Onboarding',
                details: 'Setting up workstation.', status: 'Approved',
                created: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(), // Older workflow
                updated: new Date(new Date().setDate(new Date().getDate() - 29)).toISOString()
            });
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
        }
    }
}

initializeDefaultData();

// To activate: call configureFakeBackend() from your main application entry point (e.g., main.ts)
// configureFakeBackend();