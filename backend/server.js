require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pool = require('./src/config/database');

// Importação das suas rotas existentes
const authRoutes = require('./src/api/auth');
const produtoRoutes = require('./src/api/produtos'); 
const dashboardRoutes = require('./src/api/dashboard');
const vendaRoutes = require('./src/api/vendas');
const clienteRoutes = require('./src/api/clientes');
// AQUI ESTÁ A CORREÇÃO: o caminho agora é './src/api/relatorios'
const relatoriosRoutes = require('./src/api/relatorios'); 

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/relatorios', relatoriosRoutes); 


// Verificação da conexão com o banco de dados
pool.query('SELECT NOW()')
  .then(res => console.log('Banco de dados conectado em:', res.rows[0].now))
  .catch(err => console.error('Falha na conexão com o banco de dados:', err));

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend a rodar na porta ${PORT}`);
});