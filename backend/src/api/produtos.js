const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const upload = require('../config/multerConfig');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.verifyToken);
router.get('/', produtoController.listarProdutos);
router.post('/', produtoController.createProduto);
router.get('/barcode/:code', produtoController.findByBarcode);
router.put('/:id/status', produtoController.updateStatusProduto);
router.post('/:id/upload-image', upload.single('imagem'), produtoController.uploadImage);

module.exports = router;