const config = require('../config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        const { host, port, user, password, database } = config.database;
        // const connection = await mysql.createConnection({ host, port, user, password });
        // await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

        const sequelize = new Sequelize(database, user, password, {
            host: host,
            port: port,
            dialect: 'mysql'
        });

        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
        db.Employee = require('../employees/employee.model')(sequelize);
        db.Department = require('../departments/department.model')(sequelize);
        db.Request = require('../requests/request.model')(sequelize);
        db.RequestItem = require('../requests/request-item.model')(sequelize);
        db.RequestLeave = require('../requests/request-leave.model')(sequelize); 
        db.Workflow = require('../workflows/workflow.model')(sequelize);

        db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account);

        db.Account.hasOne(db.Employee, { onDelete: 'CASCADE' });
        db.Employee.belongsTo(db.Account);

        db.Employee.hasMany(db.Workflow, { onDelete: 'CASCADE' });
        db.Workflow.belongsTo(db.Employee);

        db.Employee.hasMany(db.Request,  { onDelete: 'CASCADE' });
        db.Request.belongsTo(db.Employee);

        db.Request.hasMany(db.RequestItem, {onDelete: 'CASCADE'});
        db.RequestItem.belongsTo(db.Request);

        db.Request.hasOne(db.RequestLeave, {onDelete: 'CASCADE'});
        db.RequestLeave.belongsTo(db.Request);

        db.Department.hasMany(db.Employee, {onDelete: 'CASCADE'});
        db.Employee.belongsTo(db.Department);

        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('Database connected...');

    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }
}