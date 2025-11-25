require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pool = require('./src/config/database');

// --- IMPORTS DAS ROTAS ---
const authRoutes = require('./src/api/auth');
const produtoRoutes = require('./src/api/produtos'); 
const dashboardRoutes = require('./src/api/dashboard');
const vendaRoutes = require('./src/api/vendas');
const servicoRoutes = require('./src/api/tiposServicos'); // Atenção ao nome da variável
const servicos = require('./src/api/servicos');
const categorias = require('./src/api/categorias');
const clienteRoutes = require('./src/api/clientes');
const relatoriosRoutes = require('./src/api/relatorios'); 
const ordensServicos = require('./src/api/ordensServicos');

// --- NOVAS ROTAS FINANCEIRAS ---
const contasReceberRoutes = require('./src/api/receber');
const financeiroRoutes = require('./src/api/financeiro'); // Extrato
const recebimentosRoutes = require('./src/api/recebimentos'); // Baixar/Reabrir
const contasBancariasRoutes = require('./src/api/contasBancarias'); // Gerenciar Contas
const formasPagamentoRoutes = require('./src/api/formasPagamento'); // Gerenciar Formas

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- REGISTRO DAS ROTAS (APP.USE) ---
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/relatorios', relatoriosRoutes); 
app.use('/api/tipos-servico', servicoRoutes);
app.use('/api/servicos', servicos);
app.use('/api/categorias', categorias);
app.use('/api/ordens-servico', ordensServicos);

// Rotas Auxiliares
app.use('/api/cidades', require('./src/api/cidades')); // Pode deixar inline se preferir

// --- REGISTRO DAS ROTAS FINANCEIRAS (CORRIGIDO) ---
app.use('/api/receber', contasReceberRoutes);
app.use('/api/financeiro', financeiroRoutes); // <--- ESTAVA FALTANDO ESTA LINHA (Extrato)
app.use('/api/recebimentos', recebimentosRoutes);
app.use('/api/contas-bancarias', contasBancariasRoutes);
app.use('/api/formas-pagamento', formasPagamentoRoutes);

// Teste de Conexão
pool.query('SELECT NOW()')
  .then(res => console.log('Banco de dados conectado em:', res.rows[0].now))
  .catch(err => console.error('Falha na conexão com o banco de dados:', err));

app.listen(PORT, () => {
  console.log(`Servidor backend a rodar na porta ${PORT}`);
});