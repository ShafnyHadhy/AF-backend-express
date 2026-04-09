import express from 'express';
import {
    createProduct, deleteProduct, getProductById, getProducts, updateProduct,
    addLifecycleEvent, getMarketplaceProducts, toggleSellStatus, getPublicProductDetails,
    buyProduct, resolveRepair, completeRecycling
} from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';

const productRouter = express.Router();

productRouter.get('/public/:productID', getPublicProductDetails);

productRouter.get('/', authenticate, getProducts);
productRouter.get('/marketplace', getMarketplaceProducts);
productRouter.get('/:productID', authenticate, getProductById);
productRouter.post('/', authenticate, createProduct);
productRouter.put('/:productID', authenticate, updateProduct);
productRouter.patch('/:productID/sell', authenticate, toggleSellStatus);
productRouter.post('/:productID/buy', authenticate, buyProduct);
productRouter.post('/:productID/resolve-repair', authenticate, resolveRepair);
productRouter.post('/:productID/complete-recycling', authenticate, completeRecycling);
productRouter.delete('/:productID', authenticate, deleteProduct);
productRouter.post('/:productID/lifecycle', authenticate, addLifecycleEvent);

export default productRouter;
