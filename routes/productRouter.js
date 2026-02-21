import express from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct, addLifecycleEvent, getMarketplaceProducts, toggleSellStatus, getPublicProductDetails } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.get('/public/:productID', getPublicProductDetails);

productRouter.get('/', getProducts);
productRouter.get('/marketplace', getMarketplaceProducts);
productRouter.get('/:productID', getProductById);
productRouter.post('/', createProduct);
productRouter.put('/:productID', updateProduct);
productRouter.patch('/:productID/sell', toggleSellStatus);
productRouter.delete('/:productID', deleteProduct);
productRouter.post('/:productID/lifecycle', addLifecycleEvent);

export default productRouter;