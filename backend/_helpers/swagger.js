
const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const swaggerDocument = YAML.load('./swagger.yaml');

router.use('/', swaggerUi.serve)
router.get('/', swaggerUi.setup(swaggerDocument));

module.exports = router;
