import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function createProduct(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Access denied, Not authorized to create product.",
    });
    return;
  }

  try {
    const productdata = req.body;

    const product = new Product(productdata);

    await product.save();

    res.json({
      message: "Product created successfully",
      product: product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
}

export async function getProducts(req, res) {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching products",
    });
  }
}

export async function deleteProduct(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Access denied, Not authorized to create product.",
    });
    return;
  }

  try {
    const productId = req.params.productID;

    await Product.deleteOne({
      productID: productId,
    });

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
}

export async function updateProduct(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Access denied, Not authorized to update product.",
    });
    return;
  }

  try {
    const productId = req.params.productID;
    const updateData = req.body;

    await Product.updateOne({ productID: productId }, updateData);

    res.status(200).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
}

export async function getProductById(req, res) {
  try {
    const productId = req.params.productID;

    const product = await Product.findOne({
      productID: productId,
    });

    if (product == null) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    } else {
      res.json(product);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching product",
    });
  }
}
