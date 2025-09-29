const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyToken, vendaController.listarVendas);
router.get('/:id', authMiddleware.verifyToken, vendaController.getVendaDetalhes);
router.post('/finalizar', authMiddleware.verifyToken, vendaController.finalizarVenda);
router.put('/:id/cancelar', authMiddleware.verifyToken, vendaController.cancelarVenda);
router.put('/:id/devolver', vendaController.devolverVenda);
router.post('/iniciar', vendaController.iniciarVenda);
router.post('/:id_venda/itens', vendaController.adicionarItemVenda);
router.delete('/:id_venda/itens/:id_item_venda', vendaController.removerItemVenda);
router.get('/aberta/:id', authMiddleware.verifyToken, vendaController.getVendaAbertaDetalhes);
router.put('/:id_venda/itens/:id_item_venda', vendaController.updateItemQuantidade);
router.delete('/:id_venda/itens', vendaController.removerMultiplosItens);

module.exports = router;