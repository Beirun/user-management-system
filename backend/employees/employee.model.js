// employees/employee.model.js
const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        // No personal info like firstName, lastName, email here as they are in Account
        // The 'id' primary key will be automatically created by Sequelize

        position: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hireDate: {
            type: DataTypes.DATEONLY, // Just the date, no time
            allowNull: false
        },
        status: { 
            type: DataTypes.STRING,
            allowNull: false,
        },
        // department: { type: DataTypes.STRING, allowNull: true },
        created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated: { type: DataTypes.DATE }
    };

    const options = {
        timestamps: false, // Using manual 'created' and 'updated' fields
        // You can add defaultScope or other scopes if needed for Employee model specifically
    };

    return sequelize.define('employee', attributes, options);
}