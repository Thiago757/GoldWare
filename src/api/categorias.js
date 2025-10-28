const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriasController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware.verifyToken, categoriaController.criarCategoria);
router.get('/', authMiddleware.verifyToken, categoriaController.listarCategorias);
router.put('/:id', authMiddleware.verifyToken, categoriaController.atualizarCategoria);
router.delete('/:id', authMiddleware.verifyToken, categoriaController.excluirCategoria);

module.exports = router;