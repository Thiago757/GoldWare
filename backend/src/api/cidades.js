const express = require('express');
const router = express.Router();
const cidadeController = require('../controllers/cidadeController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protege todas as rotas deste arquivo
router.use(authMiddleware.verifyToken);

// GET /api/cidades/ -> Chama a função listarCidades
router.get('/', cidadeController.listarCidades);

module.exports = router;