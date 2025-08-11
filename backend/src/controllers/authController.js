const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../config/mailer');
const nodemailer = require('nodemailer');

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

    // console.log("\n--- DEBUG DE COMPARAÇÃO DE SENHA ---");
    // console.log("SENHA RECEBIDA DO FORMULÁRIO:", `'${senha}'`);
    // console.log("TIPO DA SENHA DO FORMULÁRIO:", typeof senha);
    // console.log("HASH RECEBIDO DO BANCO:", `'${user.senha_hash}'`);
    // console.log("TIPO DO HASH DO BANCO:", typeof user.senha_hash);
    // console.log("------------------------------------\n");

        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' }); 
        }

        const token = jwt.sign(
            { userId: user.id_usuario, email: user.email },
            'SEGREDO_SUPER_SECRETO_PARA_PROJETO_GOLDWARE', 
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login bem-sucedido!', token });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const userQuery = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user = userQuery.rows[0];

        if (!user) {
            return res.status(200).json({ message: 'Se um usuário com este email existir, um link de redefinição de senha foi enviado.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query(
            'UPDATE usuarios SET reset_token = $1, reset_token_expires = $2 WHERE id_usuario = $3',
            [hashedToken, tokenExpires, user.id_usuario]
        );

        const resetUrl = `http://localhost:3000/redefinir-senha?token=${resetToken}`;

        const info = await mailer.sendMail({
            from: '"Gold Ware System" <no-reply@goldware.com>',
            to: user.email,
            subject: 'Redefinição de Senha',
            html: `<p>Você solicitou uma redefinição de senha. Por favor, clique no link a seguir para criar uma nova senha:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Este link expira em 15 minutos.</p>`,
        });

        console.log(`Email de redefinição enviado para ${user.email}.`);
        console.log("URL de Preview do Ethereal: %s", nodemailer.getTestMessageUrl(info));

        res.status(200).json({ message: 'Se um usuário com este email existir, um link de redefinição de senha foi enviado.' });

    } catch (error) {
        console.error('Erro no forgotPassword:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        const { senha } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const userQuery = await pool.query(
            'SELECT * FROM usuarios WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [hashedToken]
        );
        const user = userQuery.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Token de redefinição inválido ou expirado.' });
        }

        const newHashedPassword = await bcrypt.hash(senha, 10);

        await pool.query(
            'UPDATE usuarios SET senha_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id_usuario = $2',
            [newHashedPassword, user.id_usuario]
        );

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error('Erro no resetPassword:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};