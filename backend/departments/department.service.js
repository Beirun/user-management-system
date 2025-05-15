const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};
async function getAll() {
    const departments = await db.Department.findAll({
        include: [{model: db.Employee, attributes:['id']}]
    });

    return departments.map(d => ({...d.toJSON(), employeeCount: d.employees.length}));
}

async function getById(id) {
    const department =  await getDepartment(id);
    return {...department.toJSON(), employeeCount: department.employees.length};
}
async function create(params) {
    const department = new db.Department(params);
    await department.save();
}
async function update(id, params) {
    const department = await getDepartment(id);
    Object.assign(department, params);
    department.updated = Date.now();
    await department.save();
}

async function getDepartment(id){
    return await db.Department.findByPk(id);
}
async function _delete(id) {
    const department = await getDepartment(id);
    
    const employeeCount = await db.Employee.count({ where: { departmentId: department.id } });
    if (employeeCount > 0) {
        throw `Department cannot be deleted because it has ${employeeCount} employees assigned`;
    }
    
    await department.destroy();
}
