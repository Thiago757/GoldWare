require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pool = require('./src/config/database');
const authRoutes = require('./src/api/auth');
const produtoRoutes = require('./src/api/produtos'); 
const dashboardRoutes = require('./src/api/dashboard');
const vendaRoutes = require('./src/api/vendas');
const ServicoRoutes = require('./src/api/tiposServicos');
const servicos = require('./src/api/servicos');
const categorias = require('./src/api/categorias');
const clienteRoutes = require('./src/api/clientes');
const relatoriosRoutes = require('./src/api/relatorios'); 
const contasReceberRoutes = require('./src/api/receber');

const ordensServicos = require('./src/api/ordensServicos');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/relatorios', relatoriosRoutes); 
app.use('/api/tipos-servico', ServicoRoutes);
app.use('/api/servicos', servicos);
app.use('/api/categorias', categorias);
app.use('/api/ordens-servico', ordensServicos);
app.use('/api/cidades', require('./src/api/cidades'));
app.use('/api/contas-bancarias', require('./src/api/contasBancarias'));
app.use('/api/formas-pagamento', require('./src/api/formasPagamento'));
app.use('/api/recebimentos', require('./src/api/recebimentos'));
app.use('/api/receber', contasReceberRoutes);

pool.query('SELECT NOW()')
  .then(res => console.log('Banco de dados conectado em:', res.rows[0].now))
  .catch(err => console.error('Falha na conexão com o banco de dados:', err));

app.listen(PORT, () => {
  console.log(`Servidor backend a rodar na porta ${PORT}`);
});