const pool = require('../config/database'); 

exports.criarCategoria = async (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }

    try {
        const novaCategoria = await pool.query(
            'INSERT INTO categorias (nome) VALUES ($1) RETURNING *',
            [nome]
        );
        res.status(201).json(novaCategoria.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Essa categoria já existe.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar categoria.' });
    }
};

exports.listarCategorias = async (req, res) => {
    try {
        const todasCategorias = await pool.query('SELECT * FROM categorias ORDER BY nome ASC');
        res.status(200).json(todasCategorias.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao listar categorias.' });
    }
};

exports.atualizarCategoria = async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }

    try {
        const categoriaAtualizada = await pool.query(
            'UPDATE categorias SET nome = $1 WHERE id_categoria = $2 RETURNING *',
            [nome, id]
        );
        
        if (categoriaAtualizada.rowCount === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }

        res.status(200).json(categoriaAtualizada.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Esse nome de categoria já está em uso.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar categoria.' });
    }
};

exports.excluirCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        const produtoVinculado = await pool.query('SELECT 1 FROM produtos WHERE id_categoria = $1 LIMIT 1', [id]);

        if (produtoVinculado.rowCount > 0) {
            return res.status(400).json({ error: 'Não é possível excluir, pois esta categoria está sendo utilizada em produtos.' });
        }

        const resultadoDelete = await pool.query('DELETE FROM categorias WHERE id_categoria = $1', [id]);

        if (resultadoDelete.rowCount === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        
        res.status(204).send(); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor ao excluir categoria.' });
    }
};