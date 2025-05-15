const express = require('express');
const router = express.Router();
const departmentService = require('./department.service');
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

router.post('/', authorize(Role.Admin), createSchema, create);
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), updateSchema, update);
router.delete('/:id', authorize(Role.Admin), _delete);

module.exports = router;

function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('', null),
    });
    validateRequest(req, next, schema);
}
function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        description: Joi.string().allow('', null),
    });
    validateRequest(req, next, schema);
}
function getAll(req, res, next) {
    departmentService.getAll()
        .then(employees => res.json(employees))
        .catch(next);
}

function getById(req, res, next) {
    departmentService.getById(req.params.id)
        .then(employee => res.json(employee))
        .catch(next);
}

function create(req, res, next) {
    departmentService.create(req.body)
        .then(()=> res.json({message: 'Department created successfully!'}))
        .catch(next);
}

function update(req, res, next){
    departmentService.update(req.params.id, req.body)
        .then(()=> res.json({message: 'Department updated successfully!'}))
        .catch(next);
}

function _delete(req, res, next) {
    departmentService.delete(req.params.id)
        .then(() => res.json({ message: 'Department deleted successfully' }))
        .catch(next);
} 