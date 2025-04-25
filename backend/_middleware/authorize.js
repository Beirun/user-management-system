const { expressjwt: jwt } = require("express-jwt");
const { secret } = require('../config.json');
const db = require('../_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // JWT middleware with proper configuration
        jwt({
            secret,
            algorithms: ['HS256'],
            credentialsRequired: true,
            requestProperty: 'auth' // Store decoded token in req.auth
        }),

        // Authorization middleware
        async (req, res, next) => {
            try {
                // Check if token was properly verified
                if (!req.auth || !req.auth.id) {
                    return res.status(401).json({ message: 'Invalid token' });
                }
                // Get account from database
                const account = await db.Account.findByPk(req.auth.id);        
                if (!account) {
                    return res.status(401).json({ message: 'Account not found' });
                }
                
                // Check roles if specified
                if (roles.length && !roles.includes(account.role)) {
                    return res.status(401).json({ message: 'Insufficient permissions' });
                }

                // Attach user to request
                req.user = {
                    id: account.id,
                    role: account.role,
                    // Add refresh token verification
                    ownsToken: async (token) => {
                        const refreshTokens = await account.getRefreshTokens();
                        return refreshTokens.some(x => x.token === token);
                    }
                };

                next();
            } catch (err) {
                next(err);
            }
        }
    ];
}