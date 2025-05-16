// ../_helpers/db should export your db object including models
const db = require('../_helpers/db');
// const workflowService = require('../workflows/workflow.service');

module.exports = {
    getById,
    create,
    getAll,
    getByEmployeeId,
    update,
    delete: _delete
};

async function getAll() {
    return await db.Request.findAll({
        include: [
            { model: db.RequestItem },
            { model: db.RequestLeave }
        ]
    });
}

async function getById(id) {
    return await db.Request.findByPk(id, {
        include: [
            { model: db.RequestItem },
            { model: db.RequestLeave }
        ]
    });
}

async function getByEmployeeId(id) {
    return await db.Request.findAll({
        where: { employeeId: id },
        include: [
            { model: db.RequestItem },
            { model: db.RequestLeave }
        ]
    });
}

async function create(params) {
    try {
        if (!params.employeeId) throw 'Employee is required';
        if (!params.type) throw 'Type is required';

        console.log(params)
        const requestData = {
            employeeId: params.employeeId,
            type: params.type,
            status: params.status || 'Pending',
            requestDate: params.requestDate || new Date().toISOString().slice(0, 10)
        };
        const request = await db.Request.create(requestData);

        if (params.type === 'Leave') {
            if (!params.startDate || !params.endDate) throw 'Start date and end date are required for Leave requests.';
            
            const leaveData = {
                startDate: params.startDate,
                endDate: params.endDate,
                requestId: request.id
            };
            await db.RequestLeave.create(leaveData);
            // Example: await workflowService.requestLeave(params.employeeId, createdLeaveRequest);
        } else {
            if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
                throw 'At least one item is required for this request type.';
            }

            const requestItemPromises = params.items.map(item => {
                if (!item.name || (item.quantity === undefined || item.quantity === null || item.quantity <= 0)) {
                    throw 'Each item must have a name and a valid positive quantity.';
                }
                return db.RequestItem.create({
                    name: item.name,
                    quantity: item.quantity,
                    requestId: request.id
                });
            });

            await Promise.all(requestItemPromises);
            // Example: await workflowService.requestItems(params.employeeId, createdItemsArray);
        }
        

    } catch (error) {
        console.error("Error creating request:", error.message || error);
        throw error.message || error;
    }
}

async function update(id, params) {
    try {
        const request = await db.Request.findByPk(id, {
            include: [db.RequestItem, db.RequestLeave]
        });

        if (!request) throw 'Request not found';

        // Update status if provided
        if (params.status) {
            request.status = params.status;
        }
        await request.save();

        // Clean up related records based on type
        if (request.type === 'Leave') {
            // Delete all RequestItems if they exist
            await db.RequestItem.destroy({ where: { requestId: id } });
            
            // Update or create Leave details
            const requestLeave = request.requestLeave || await db.RequestLeave.create({ requestId: id });
            
            if (params.startDate) requestLeave.startDate = params.startDate;
            if (params.endDate) requestLeave.endDate = params.endDate;
            await requestLeave.save();
        } else {
            // Delete Leave details if they exist
            if (request.requestLeave) {
                await db.RequestLeave.destroy({ where: { requestId: id } });
            }

            // Handle items update if provided
            if (params.items && Array.isArray(params.items)) {
                await db.RequestItem.destroy({ where: { requestId: id } });

                if (params.items.length > 0) {
                    const requestItemPromises = params.items.map(item => {
                        if (!item.name || (item.quantity === undefined || item.quantity === null || item.quantity <= 0)) {
                            throw 'Each item must have a name and a valid positive quantity.';
                        }
                        return db.RequestItem.create({
                            name: item.name,
                            quantity: item.quantity,
                            requestId: id
                        });
                    });
                    await Promise.all(requestItemPromises);
                }
            }
        }

        return request;
    } catch (error) {
        console.error("Error updating request:", error.message || error);
        throw error.message || error;
    }
}

async function _delete(id) {
    try {
        const request = await db.Request.findByPk(id);
        if (!request) throw 'Request not found';
        await request.destroy();

    } catch (error) {
        console.error("Error deleting request:", error.message || error);
        throw error.message || error;
    }
}