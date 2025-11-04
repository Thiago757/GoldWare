const gerarRelatorioVendas = require('../reports/vendasPeriodo');
const gerarRankingJoias = require('../reports/rankingJoias'); 
const gerarComissoes = require('../reports/comissoes');
const gerarRelatorioInventario = require('../reports/inventario');
const gerarRelatorioEstoqueBaixo = require('../reports/estoqueBaixo');
const gerarListaClientes = require('../reports/listaClientes');
const gerarContasReceber = require('../reports/contasReceber');
const gerarContasPagar = require('../reports/contasPagar');
const gerarFluxoCaixa = require('../reports/fluxoCaixa');

exports.gerarRelatorioVendas = (req, res) => {
    gerarRelatorioVendas(req, res);
};

exports.gerarRankingJoias = (req, res) => {
    gerarRankingJoias(req, res);
};

exports.gerarComissoes = (req, res) => {
    gerarComissoes(req, res);
};

exports.gerarRelatorioInventario = (req, res) => {
    gerarRelatorioInventario(req, res);
};

exports.gerarRelatorioEstoqueBaixo = (req, res) => {
    gerarRelatorioEstoqueBaixo(req, res);
};

exports.gerarListaClientes = (req, res) => {
    gerarListaClientes(req, res);
};

exports.gerarContasReceber = (req, res) => {
    gerarContasReceber(req, res);
};

exports.gerarContasPagar = (req, res) => {
    gerarContasPagar(req, res);
};

exports.gerarFluxoCaixa = (req, res) => {
    gerarFluxoCaixa(req, res);
};