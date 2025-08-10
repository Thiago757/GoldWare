const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const userQuery = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user = userQuery.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

    console.log("\n--- DEBUG DE COMPARAÇÃO DE SENHA ---");
    console.log("SENHA RECEBIDA DO FORMULÁRIO:", `'${senha}'`);
    console.log("TIPO DA SENHA DO FORMULÁRIO:", typeof senha);
    console.log("HASH RECEBIDO DO BANCO:", `'${user.senha_hash}'`);
    console.log("TIPO DO HASH DO BANCO:", typeof user.senha_hash);
    console.log("------------------------------------\n");

        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' }); 
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            'SEGREDO_SUPER_SECRETO_PARA_PROJETO_GOLDWARE', 
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login bem-sucedido!', token });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};