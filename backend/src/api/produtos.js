const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const upload = require('../config/multerConfig');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer'); 

const handleUpload = (req, res, next) => {
    const uploader = upload.single('imagem');

    uploader(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Erro: O arquivo é maior que o limite de 5MB.' });
            }
            return res.status(400).json({ message: `Erro de upload: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.use(authMiddleware.verifyToken);
router.get('/', produtoController.listarProdutos);
router.post('/', handleUpload, produtoController.createProduto);
router.get('/barcode/:code', produtoController.findByBarcode);
router.put('/:id', produtoController.updateProduto);
router.put('/:id/status', produtoController.updateStatusProduto);
router.post('/:id/upload-image', handleUpload, produtoController.uploadImage);

module.exports = router;