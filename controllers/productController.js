import Product from '../models/product.js';
import QRCode from "qrcode";

/*
    CREATE PRODUCT
    Logged-in users can register their own product
*/
export async function createProduct(req, res) {
    console.log("!!! API-CONTROLLER: createProduct CALLED VERSION [2.0.1]");
    console.log("DEBUG: createProduct full body:", req.body);
    console.log("DEBUG: Schema paths:", Object.keys(Product.schema.paths));

    if (!req.user) {
        return res.status(401).json({
            message: "Please login to register a product."
        });
    }

    try {

        const generatedProductID = "PRD-" + Date.now();

        // Public URL pointing to frontend public details page
        const publicURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product-public/${generatedProductID}`;

        // Generate QR as base64 image
        const qrImage = await QRCode.toDataURL(publicURL);

        const product = new Product({
            productID: generatedProductID,
            ownerEmail: req.user.email,
            productName: req.body.productName,
            model: req.body.model,
            category: req.body.category,
            description: req.body.description || "",
            purchasePrice: req.body.purchasePrice || 0,
            condition: req.body.condition,
            status: "registered",
            qrCode: qrImage,  // save QR image
            images: req.body.images || [], // save product images
            lifecycle: [
                {
                    eventType: "registered",
                    description: "Product registered into system"
                }
            ]
        });

        console.log("Schema paths at runtime:", Object.keys(product.schema.paths));
        await product.save();

        res.status(201).json({
            message: "Product registered successfully!",
            product
        });

    } catch (error) {
        console.error("DEBUG: Error creating product details:", error);
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

        // Add lifecycle event ONLY if status changed
        if (req.body.status && req.body.status !== product.status) {
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

/*
    TOGGLE SELL STATUS
*/
export async function toggleSellStatus(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login first." });
    }

    try {
        const { isForSale, price } = req.body;
        const product = await Product.findOne({
            productID: req.params.productID,
            ownerEmail: req.user.email
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.isForSale = isForSale;
        product.price = price || 0;

        // Add lifecycle event
        product.lifecycle.push({
            eventType: isForSale ? "Marketplace Listing" : "Marketplace Unlisting",
            description: isForSale ? `Product listed for sale at $${price}` : "Product removed from marketplace"
        });

        await product.save();

        res.json({
            message: isForSale ? "Product listed for sale!" : "Product unlisted from marketplace",
            product
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating marketplace status", error: error.message });
    }
}

/*
    GET MARKETPLACE PRODUCTS
*/
export async function getMarketplaceProducts(req, res) {
    try {
        const products = await Product.find({ isForSale: true });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching marketplace products", error: error.message });
    }
}

/*
    GET PUBLIC PRODUCT DETAILS (No Login Required)
*/
export async function getPublicProductDetails(req, res) {
    try {
        const product = await Product.findOne({ productID: req.params.productID });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Error fetching public product details", error: error.message });
    }
}

/*
    BUY PRODUCT
    Marketplace users can "buy" a product, changing its status to SOLD
*/
export async function buyProduct(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login first to buy products." });
    }

    try {
        const product = await Product.findOne({
            productID: req.params.productID,
            isForSale: true
        });

        if (!product) {
            return res.status(404).json({ message: "Product not available for sale." });
        }

        product.status = "sold";
        product.isForSale = false;

        product.lifecycle.push({
            eventType: "sold",
            description: `Product purchased by ${req.user.email}. Status set to SOLD.`
        });

        await product.save();

        res.json({
            message: "Product purchased successfully!",
            product
        });
    } catch (error) {
        res.status(500).json({ message: "Error processing purchase", error: error.message });
    }
}

/*
    RESOLVE REPAIR
    Mark a product as REPAIRED (back to Active) or NOT REPAIRABLE
*/
export async function resolveRepair(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login first." });
    }

    try {
        const { resolution } = req.body; // "repaired" or "not repairable"
        const product = await Product.findOne({
            productID: req.params.productID,
            ownerEmail: req.user.email
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const newStatus = resolution === "repaired" ? "active" : "not repairable";
        product.status = newStatus;

        product.lifecycle.push({
            eventType: newStatus,
            description: resolution === "repaired" 
                ? "Repair completed. Product returned to active status."
                : "Repair failed. Product marked as not repairable."
        });

        await product.save();

        res.json({
            message: `Repair resolved as ${resolution}`,
            product
        });
    } catch (error) {
        res.status(500).json({ message: "Error resolving repair", error: error.message });
    }
}

/*
    COMPLETE RECYCLING
    Finalize the recycling process
*/
export async function completeRecycling(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login first." });
    }

    try {
        const product = await Product.findOne({
            productID: req.params.productID,
            ownerEmail: req.user.email
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.status = "recycled";
        product.lifecycle.push({
            eventType: "recycled",
            description: "Product has been successfully recycled."
        });

        await product.save();

        res.json({
            message: "Product marked as recycled",
            product
        });
    } catch (error) {
        res.status(500).json({ message: "Error completing recycling", error: error.message });
    }
}
