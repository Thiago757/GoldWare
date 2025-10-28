const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.verifyToken);
router.get('/', clienteController.listarClientes);
router.post('/', clienteController.createCliente);
router.get('/search', clienteController.searchClientes);
router.put('/:id/status', clienteController.updateStatusCliente);
router.get('/:id', authMiddleware.verifyToken, clienteController.getClienteDetalhes);
router.put('/:id', authMiddleware.verifyToken, clienteController.updateCliente);

module.exports = router;