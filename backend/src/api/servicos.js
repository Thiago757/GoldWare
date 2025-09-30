const express = require('express');
const router = express.Router();
const servicosController = require('../controllers/servicosController');
const authMiddleware = require('../middlewares/authMiddleware'); 

router.get('/', authMiddleware.verifyToken, servicosController.listarServicos);
router.post('/', authMiddleware.verifyToken, servicosController.criarServico);
router.put('/:id', authMiddleware.verifyToken, servicosController.atualizarServico);

module.exports = router;