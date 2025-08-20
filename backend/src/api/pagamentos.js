const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/contas-a-receber', authMiddleware.verifyToken, pagamentoController.listarContasAReceber);

module.exports = router;