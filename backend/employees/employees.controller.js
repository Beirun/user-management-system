const express = require('express');
const router = express.Router();
const employeeService = require('./employee.service');
const validateRequest = require('_middleware/validate-request');
const Joi = require('joi');
const authorize = require('../_middleware/authorize');
const role = require('../_helpers/role');

router.post('/', authorize(role.Admin), createEmployeeSchema, create);
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id',authorize(role.Admin),update);
router.delete('/:id', authorize(role.Admin), _delete);
router.post('/:id/transfer', authorize(role.Admin),transferDepartmentSchema,  transferDepartment);
module.exports = router;

function createEmployeeSchema(req, res, next) {
    const schema = Joi.object({
        accountId: Joi.int().required(),
        departmentId: Joi.int().required(),
        position: Joi.string().required(),
        hireDate: Joi.date().required(),
        status: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function transferDepartmentSchema(req, res, next) {
    const schema = Joi.object({
        departmentId: Joi.int().required()    });
    validateRequest(req, next, schema);
}

function getById(req, res, next) {
    const {id} = req.params
    employeeService.getById(id)
        .then(employee => res.json(employee))
        .catch(next);
}

function getAll(req, res, next) {
    employeeService.getAll()
        .then(employees => res.json(employees))
        .catch(next);
}

function create(req, res, next) {
    employeeService.create(req.body)
        .then(() => res.json({ message: 'Employee created' }))
        .catch(next);
}

function update(req, res, next){
    const {id} = req.params
    employeeService.update(id, req.body)
        .then(() => res.json({ message: 'Employee updated' }))
        .catch(next);
}

function transferDepartment(req, res, next){
    const {id} = req.params
    employeeService.transferDepartment(id, req.body)
        .then(() => res.json({ message: 'Employee transfered' }))
        .catch(next);
}

function _delete(req, res, next){
    const {id} = req.params
    employeeService.delete(id)
        .then(() => res.json({ message: 'Employee deleted' }))
        .catch(next);
}