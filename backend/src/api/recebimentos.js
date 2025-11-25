const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware.verifyToken, financeiroController.criarRecebimento);

router.post('/estornar/:id', authMiddleware.verifyToken, financeiroController.estornarRecebimento);

module.exports = router;