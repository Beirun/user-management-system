const db = require('../_helpers/db');
const workflowService = require('../workflows/workflow.service');
module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    transferDepartment,
};


async function getAll() {
    const employees = await db.Employee.findAll({
            include: [
                {
                    model: db.Account,
                    attributes: ['email', 'firstName', 'lastName', 'title'] // Example: select specific account fields
                },
                {
                    model: db.Department,
                    // as: 'departmentInfo', // Use the alias defined in your Employee.belongsTo(Department)
                    // attributes: ['name']  // <--- THIS IS THE KEY CHANGE: Only select the 'name' attribute
                },
                {
                    model: db.Workflow,
                    // as: 'workflows',
                    // You might want to select specific attributes for workflows too
                    // attributes: ['id', 'status', 'type']
                },
                {
                    model: db.Request,
                    // as: 'requests',
                    // attributes: ['id', 'type', 'status', 'requestDate'], // Select specific request fields
                    include: [
                        {
                            model: db.RequestItem,
                            // as: 'items',
                            required: false,
                            // attributes: ['id', 'name', 'quantity'] // Select specific item fields
                        },
                        {
                            model: db.RequestLeave,
                            // as: 'leaveDetails',
                            required: false,
                            // attributes: ['id', 'leaveType', 'startDate', 'endDate'] // Select specific leave fields
                        }
                    ]
                }
            ],
            // Optional: To make the top-level employee object cleaner, you can also specify its attributes
            // attributes: ['id', 'employeeId', /* other employee fields you need */],
        });

        return employees;
}


async function create(params){
    if(!params.accountId){
        throw 'Account ID is required';
    }
    if(!params.departmentId){throw 'Department ID is required';}

    const employee = new db.Employee(params);
    await employee.save();
    // workflowService.onboarding(employee);
    
}

async function update(id, params){
    const employee = await getEmployee(id);
    if(!employee) throw 'Employee not found';
    Object.assign(employee, params);
    await employee.save();
}

async function getEmployee(id){
    return await db.Employee.findByPk(id);
}

async function transferDepartment(id,params){
    const employee = await getEmployee(id);
    if(!employee) throw 'Employee not found';
    if(employee.departmentId == params.departmentId) throw 'Employee already in this department';

    // const oldDepartment = await db.Department.findByPk(employee.departmentId);
    // const newDepartment = await db.Department.findByPk(params.departmentId);
    employee.departmentId = params.departmentId;
    await employee.save();
    // workflowService.transferDepartment(employee, oldDepartment, newDepartment);
}

async function getById(id){
    const employee = await getEmployee(id);
    if(!employee) throw 'Employee not found';
    return employee;
}

async function _delete(id){
    const employee = await getEmployee(id);
    if(!employee) throw 'Employee not found';
    await employee.destroy();
}