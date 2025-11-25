const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyToken, financeiroController.listarContasBancarias);
router.post('/', authMiddleware.verifyToken, financeiroController.criarContaBancaria);

module.exports = router;