const express = require('express');
const router = express.Router();
const requestService = require('./request.service');
router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
router.get('/employee/:id', getByEmployeeId);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;


function create(req, res, next) {
    requestService.create(req.body)
        .then(() => res.json({ message: 'Request created successfully.' }))
        .catch(next);
}

function getAll(req, res, next){
    requestService.getAll()
       .then(requests => res.json(requests))
       .catch(next);
}

function getById(req, res, next) {
    requestService.getById(req.params.id)
        .then(request => res.json(request))
        .catch(next);
}

function getByEmployeeId(req, res, next) {
    requestService.getByEmployeeId(req.params.id)
        .then(requests => res.json(requests))
        .catch(next);
}

function update(req, res, next) {
    requestService.update(req.params.id, req.body)
        .then(() => res.json({ message: 'Request updated successfully.' }))
        .catch(next);
}

function _delete(req, res, next) {
    requestService.delete(req.params.id)
        .then(() => res.json({ message: 'Request deleted successfully.' }))
        .catch(next);
}