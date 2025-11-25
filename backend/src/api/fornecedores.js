const express = require('express');
const router = express.Router();
const fornecedoresController = require('../controllers/fornecedoresController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.verifyToken);
router.get('/', fornecedoresController.listarFornecedores);
router.get('/:id', fornecedoresController.obterFornecedor);
router.post('/', fornecedoresController.criarFornecedor);
router.put('/:id', fornecedoresController.atualizarFornecedor);
router.put('/:id/status', fornecedoresController.atualizarStatus);

module.exports = router;