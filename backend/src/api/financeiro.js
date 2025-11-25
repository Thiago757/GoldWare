const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.verifyToken);

// Rota do Extrato
router.get('/extrato', financeiroController.listarExtrato);

module.exports = router;