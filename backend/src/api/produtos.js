const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/barcode/:code', produtoController.findByBarcode);

module.exports = router;