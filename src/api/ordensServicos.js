const express = require('express');
const router = express.Router();
const ordensServicoController = require('../controllers/ordensServicoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyToken, ordensServicoController.listarOS);
router.post('/', authMiddleware.verifyToken, ordensServicoController.criarOS);
router.get('/:id', authMiddleware.verifyToken, ordensServicoController.getOSDetalhes);
router.post('/:id_os/itens', authMiddleware.verifyToken, ordensServicoController.adicionarItemOS);
router.put('/:id_os/itens/:id_item_os', authMiddleware.verifyToken, ordensServicoController.atualizarItemOS);
router.delete('/:id_os/itens/:id_item_os', authMiddleware.verifyToken, ordensServicoController.removerItemOS);
router.put('/:id_os/status', authMiddleware.verifyToken, ordensServicoController.atualizarStatusOS);
router.put('/:id_os/finalizar', authMiddleware.verifyToken, ordensServicoController.finalizarOS);
router.put('/:id_os/observacao', authMiddleware.verifyToken, ordensServicoController.atualizarObservacaoOS);



module.exports = router;