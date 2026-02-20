import Product from '../models/product.js';
import QRCode from "qrcode";

/*
    CREATE PRODUCT
    Logged-in users can register their own product
*/
export async function createProduct(req, res) {

    if (!req.user) {
        return res.status(401).json({
            message: "Please login to register a product."
        });
    }

    try {

        const generatedProductID = "PRD-" + Date.now();

        // 🔥 Public URL (adjust if needed)
        const publicURL = `http://localhost:3000/product/${generatedProductID}`;

        // 🔥 Generate QR as base64 image
        const qrImage = await QRCode.toDataURL(publicURL);

        const product = new Product({
            productID: generatedProductID,
            ownerEmail: req.user.email,
            brand: req.body.brand,
            model: req.body.model,
            serialNumber: req.body.serialNumber,
            purchaseDate: req.body.purchaseDate,
            condition: req.body.condition,
            status: "registered",
            qrCode: qrImage,  // save QR image
            lifecycle: [
                {
                    eventType: "registered",
                    description: "Product registered into system"
                }
            ]
        });

        await product.save();

        res.status(201).json({
            message: "Product registered successfully!",
            product
        });

    } catch (error) {
        res.status(500).json({
            message: "Error creating product",
            error: error.message
        });
    }
}

/*
    GET ALL PRODUCTS
    User sees only their products
*/
export async function getProducts(req, res) {

    if (!req.user) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    try {

        const products = await Product.find({
            ownerEmail: req.user.email
        });

        res.json(products);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching products"
        });
    }
}


/*
    GET SINGLE PRODUCT
*/
export async function getProductById(req, res) {

    if (!req.user) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    try {

        const product = await Product.findOne({
            productID: req.params.productID,
            ownerEmail: req.user.email
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(product);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching product"
        });
    }
}


/*
    UPDATE PRODUCT
*/
export async function updateProduct(req, res) {

    if (!req.user) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    try {

        const product = await Product.findOne({
            productID: req.params.productID,
            ownerEmail: req.user.email
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        Object.assign(product, req.body);

        // Add lifecycle event if status changed
        if (req.body.status) {
            product.lifecycle.push({
                eventType: req.body.status,
                description: `Product status updated to ${req.body.status}`
            });
        }

        await product.save();

        res.json({
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating product"
        });
    }
}


/*
    DELETE PRODUCT
*/
export async function deleteProduct(req, res) {

    if (!req.user) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    try {

        const result = await Product.deleteOne({
            productID: req.params.productID,
            ownerEmail: req.user.email
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error deleting product"
        });
    }
}

/*
    ADD LIFECYCLE EVENT
*/
export async function addLifecycleEvent(req, res) {

    if (!req.user) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    try {

        const product = await Product.findOne({
            productID: req.params.productID,
            ownerEmail: req.user.email
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const { eventType, description } = req.body;

        product.lifecycle.push({
            eventType,
            description
        });

        // Optional: Update status automatically
        product.status = eventType;

        await product.save();

        res.json({
            message: "Lifecycle event added successfully",
            product
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding lifecycle event"
        });
    }
}