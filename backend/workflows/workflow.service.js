const db = require('../_helpers/db');


module.exports = {
    onboarding,
    create,
    transferDepartment,
    requestItem,
    requestLeave,
    getAll,
    getById,
    update,
    getByEmployeeId,
    delete: _delete
}

async function create(params) {
    const workflow = new db.Workflow(params);
    await workflow.save();
}

async function _delete(id){
    const workflow = await getById(id);
    await workflow.destroy();
}
async function getAll(){
    return await db.Workflow.findAll();
    }


async function getById(id){
    return await db.Workflow.findByPk(id);
}

async function update(id, params){
    const workflow = await getById(id);
    Object.assign(workflow, params);
    await workflow.save();
}

async function getByEmployeeId(id){
    return await db.Workflow.findAll({where: {employeeId: id}});

}

async function onboarding(params){
    const workflow = new db.Workflow({employeeId: params.employeeId, type: 'Onboarding', details: 'Setting up workstation'});
    await workflow.save();
}

async function transferDepartment(params){
    const workflow = new db.Workflow(
            {
                employeeId: params.employeeId, 
                type: 'Department Transfer', 
                details: `Employee transfered from ${params.oldDepartment.name} to ${params.newDepartment.name}`
            });
        await workflow.save();
}

async function requestItem(params){
    const workflow = new db.Workflow({employeeId: params.employeeId, type: 'Request Approval', details: `Employee requested ${params.quantity} ${params.name}${params.quantity > 1? 's':''}`});
    await workflow.save();
}

async function requestLeave(params){
    const workflow = new db.Workflow({employeeId: params.employeeId, type: 'Request Approval', details: `Employee requested leave from ${params.startDate} to ${params.endDate}`});
    await workflow.save();
}