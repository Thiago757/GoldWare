const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.verifyToken);
router.get('/contas-a-receber', pagamentoController.listarContas);
router.get('/contas-a-receber/sumario', pagamentoController.getSumarioContasAReceber);
router.get('/contas-a-receber/cliente/:idCliente', pagamentoController.getDetalhesCliente);
router.put('/contas-a-receber/:idConta/pagar', pagamentoController.marcarParcelaComoPaga);

module.exports = router;