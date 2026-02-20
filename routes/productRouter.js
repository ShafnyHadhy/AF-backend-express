import express from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct, addLifecycleEvent } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.get('/', getProducts);
productRouter.post('/', createProduct);
productRouter.delete('/:productID', deleteProduct);
productRouter.put('/:productID', updateProduct);
productRouter.get('/:productID', getProductById);
productRouter.post('/:productID/lifecycle', addLifecycleEvent);

export default productRouter;