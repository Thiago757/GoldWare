const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware.verifyToken, financeiroController.criarRecebimento);
module.exports = router;