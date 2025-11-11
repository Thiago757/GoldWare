const express = require('express');
const router = express.Router();
const contasReceberController = require('../controllers/contasReceberController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protege todas as rotas de "receber" com autenticação
router.use(authMiddleware.verifyToken);

// GET /api/receber
// (Esta rota usará o controlador para lidar com /api/receber?status=pago&clienteId=1, etc.)
router.get('/', contasReceberController.listarContasReceber);

module.exports = router;