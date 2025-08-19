const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyToken, vendaController.listarVendas);
router.post('/finalizar', authMiddleware.verifyToken, vendaController.finalizarVenda);
router.put('/:id/cancelar', authMiddleware.verifyToken, vendaController.cancelarVenda);

module.exports = router;