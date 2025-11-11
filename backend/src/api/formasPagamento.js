const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyToken, financeiroController.listarFormasPagamento);
module.exports = router;