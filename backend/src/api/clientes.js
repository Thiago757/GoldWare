// backend/src/api/clientes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/search', authMiddleware.verifyToken, clienteController.searchClientes);
router.post('/', authMiddleware.verifyToken, clienteController.createCliente);

module.exports = router;