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
    if (!Array.isArray(params.items)) {
    throw new Error('Items must be provided as an array');
  }

  // Handle empty array case
  if (params.items.length === 0) {
    throw new Error('At least one item must be provided');
  }

  // Create a grammatically correct summary of all requested items
  const itemSummary = params.items.map((item, index) => {
    const prefix = index === params.items.length - 1 && params.items.length > 1 
      ? 'and ' 
      : '';
    return `${prefix}${item.quantity} ${item.name}${item.quantity > 1 ? 's' : ''}`;
  }).join(params.items.length > 1 ? ', ' : ' ');

  const workflow = new db.Workflow({
    employeeId: params.employeeId,
    type: 'Request Approval',
    details: `Employee requested ${itemSummary}`,
    items: params.items // Store the full items array if needed
  });

  await workflow.save();
  return workflow;
}

async function requestLeave(params){
    const workflow = new db.Workflow({employeeId: params.employeeId, type: 'Request Approval', details: `Employee requested leave from ${params.startDate} to ${params.endDate}`});
    await workflow.save();
}