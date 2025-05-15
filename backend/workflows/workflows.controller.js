const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const role = require('../_helpers/role');
const workflowService = require('./workflow.service');

// routes
router.post('/', authorize(role.Admin), create);
router.get('/employee/:id', authorize(), getByEmployeeId);
router.put('/:id', authorize(role.Admin), updateSchema, update);
router.delete('/:id', authorize(role.Admin), _delete);
router.post('/onboarding', authorize(role.Admin), onboarding);
router.post('/transfer', authorize(role.Admin), transfer);
router.post('/leave', authorize(role.Admin), leave);
router.post('/resources', authorize(role.Admin), resources);


module.exports = router;

function transfer(req, res, next) {
    workflowService.transferDepartment(req.body)
        .then(() => res.json({message: "Workflow transfer created"}))
        .catch(next);
    }
    
    function leave(req, res, next) {
        workflowService.requestLeave(req.body)
        .then(() => res.json({message: "Workflow request leave created"}))
        .catch(next);
    }
    
    function resources(req, res, next) {
        workflowService.requestItem(req.body)
        .then(() => res.json({message: "Workflow request item created"}))
        .catch(next);
}

function onboarding(req, res, next) {
    workflowService.onboarding(req.body)
        .then(workflow => res.json(workflow))
        .catch(next);
        }

function getByEmployeeId(req, res, next) {
    const {id} = req.params
    workflowService.getByEmployeeId(id)
        .then((workflows) => res.json(workflows))
        .catch(next);
}

function create(req, res, next) {
    workflowService.create(req.body)
        .then(workflow => res.json(workflow))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        type: Joi.string().valid('Leave Request', 'Equipment Request', 'Department Change', 'Other'),
        details: Joi.string().allow('', null),
        status: Joi.string().valid('ForReviewing', 'Completed'),
        comments: Joi.string().allow('', null),
        handledBy: Joi.number().allow(null)
    });
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    workflowService.update(req.params.id, req.body)
        .then(workflow => res.json(workflow))
        .catch(next);
}

function _delete(req, res, next) {
    workflowService.delete(req.params.id)
        .then(() => res.json({ message: 'Workflow deleted successfully' }))
        .catch(next);
} 