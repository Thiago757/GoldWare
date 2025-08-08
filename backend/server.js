require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios ORDER BY id');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

const PORT = process.env.PORT || 3001;

pool.query('SELECT NOW()')
  .then(res => console.log('Banco conectado em:', res.rows[0].now))
  .catch(err => console.error('Erro na conexão com banco:', err));

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});