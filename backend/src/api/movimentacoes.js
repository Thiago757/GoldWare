const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');
// NÃO vamos usar authMiddleware aqui por enquanto
// const authMiddleware = require('../middlewares/authMiddleware');

// Se quiser proteger depois, bastaria descomentar:
// router.use(authMiddleware.verifyToken);

router.get('/', movimentacaoController.listarMovimentacoes);

module.exports = router;
