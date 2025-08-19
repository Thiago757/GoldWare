require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const router = express.Router();
const pool = require('./src/config/database');

const authRoutes = require('./src/api/auth');
const produtoRoutes = require('./src/api/produtos'); 
const dashboardRoutes = require('./src/api/dashboard');
const vendaRoutes = require('./src/api/vendas');
const clienteRoutes = require('./src/api/clientes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/clientes', clienteRoutes);

const PORT = process.env.PORT || 3001;

pool.query('SELECT NOW()')
  .then(res => console.log('Banco conectado em:', res.rows[0].now))
  .catch(err => console.error('Erro na conexão com banco:', err));

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});