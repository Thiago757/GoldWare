const express = require('express');
const router = express.Router();
const relatoriosController = require('../controllers/relatoriosController');

// Vendas
router.get('/vendas-periodo', relatoriosController.gerarRelatorioVendas);
router.get('/ranking-joias', relatoriosController.gerarRankingJoias);
router.get('/comissoes', relatoriosController.gerarComissoes);

// Estoque
router.get('/inventario', relatoriosController.gerarRelatorioInventario);
router.get('/estoque-baixo', relatoriosController.gerarRelatorioEstoqueBaixo);

// Clientes
router.get('/lista-clientes', relatoriosController.gerarListaClientes);

// Financeiro
router.get('/contas-receber', relatoriosController.gerarContasReceber);
router.get('/contas-pagar', relatoriosController.gerarContasPagar); // Rota Adicionada

module.exports = router;