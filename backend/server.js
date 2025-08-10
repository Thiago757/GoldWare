require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');

const authRoutes = require('./src/api/auth');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;

pool.query('SELECT NOW()')
  .then(res => console.log('Banco conectado em:', res.rows[0].now))
  .catch(err => console.error('Erro na conexão com banco:', err));

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});