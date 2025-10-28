const express = require('express');
const router = express.Router();
const { listarTipos, criarTipo, atualizarTipo, deletarTipo } = require('../controllers/tiposServicosController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyToken, listarTipos);
router.post('/', authMiddleware.verifyToken, criarTipo);
router.put('/:id', authMiddleware.verifyToken, atualizarTipo);
router.delete('/:id', authMiddleware.verifyToken, deletarTipo);

module.exports = router;