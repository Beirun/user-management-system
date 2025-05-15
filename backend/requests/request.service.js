const db = require('../_helpers/db');
const { getAll } = require('../accounts/account.service');
const workflowService = require('../workflows/workflow.service');
module.exports = {
    getById,
    create,
    getAll,
    getByEmployeeId,
    update,
    delete: _delete
}


async function getById(id) {
    return await db.Request.findByPk(id,
        {
            include: [ {
                model: db.RequestItem,
            },
            {
                model: db.RequestLeave,
            }
        ]
        }
    );
}

async function getByEmployeeId(id){
    return await db.Request.findAll({where: {employeeId: id},
    include: [ {
                model: db.RequestItem,
            },
            {
                model: db.RequestLeave,
            }
        ]
    });
}

async function update(id, params){
    const request = await getById(id);
    if(!request) throw 'Request not found';
    Object.assign(request, params);
    await request.save();
    if(params.type === 'Leave'){
        const requestLeave = await db.RequestLeave.findOne({where: {requestId: id}});
        Object.assign(requestLeave, params);
        await requestLeave.save();
    } else {
        const requestItem = await db.RequestItem.findOne({where: {requestId: id}});
        Object.assign(requestItem, params);
        await requestItem.save();
    }

}

async function _delete(id){
    const request = await getById(id);
    if(!request) throw 'Request not found';
    await request.destroy();
}

async function create(params){
    if(!params.employeeId) throw 'Employee is required';
    const request = new db.Request(params);
    await request.save();
    if(!params.type) throw 'Type is required';
    if(params.type === 'Leave'){
        if(!params.startDate || !params.endDate) throw 'Start date and end date are required';
        const requestLeave = new db.RequestLeave({...params, requestId: request.id});
        await requestLeave.save();
        // workflowService.requestLeave(params.employeeId,requestLeave);
    } else {
        if(!params.name || !params.quantity) throw 'Name and quantity are required';
        const requestItem = new db.RequestItem({...params, requestId: request.id});
        await requestItem.save();
        // workflowService.requestItem(params.employeeId,requestItem);
    }
}