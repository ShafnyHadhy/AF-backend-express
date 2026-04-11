import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const saveMock = jest.fn();

const ProductMock = jest.fn().mockImplementation((data) => ({
  ...data,
  save: saveMock,
  lifecycle: data.lifecycle || [],
  schema: { paths: {} }
}));

ProductMock.find = jest.fn();
ProductMock.findOne = jest.fn();
ProductMock.countDocuments = jest.fn();
ProductMock.deleteOne = jest.fn();
ProductMock.schema = { paths: {} };

jest.unstable_mockModule("../../models/product.js", () => ({
  default: ProductMock,
}));

jest.unstable_mockModule("qrcode", () => ({
  default: {
    toDataURL: jest.fn().mockResolvedValue("mock-qr-code-url"),
  },
}));

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addLifecycleEvent,
  toggleSellStatus,
  buyProduct,
  resolveRepair,
  completeRecycling
} = await import("../../controllers/productController.js");

describe("Product Controller Unit Tests", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { email: "test@example.com", userId: "user123" },
      params: {},
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("createProduct", () => {
    it("should create a product successfully", async () => {
      req.body = {
        productName: "iPhone 13",
        model: "A2633",
        Brand: "Apple",
        category: "Smartphone",
        condition: "new"
      };

      saveMock.mockResolvedValue({ ...req.body, productID: "PRD-123" });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Product registered successfully!"
      }));
    });

    it("should return 401 if user is not logged in", async () => {
      req.user = null;
      await createProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("getProducts", () => {
    it("should return all products for the logged in user", async () => {
      const mockProducts = [{ productName: "P1" }, { productName: "P2" }];
      ProductMock.find.mockResolvedValue(mockProducts);
      ProductMock.countDocuments.mockResolvedValue(2);

      await getProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(mockProducts);
      expect(ProductMock.find).toHaveBeenCalledWith({ ownerEmail: "test@example.com" });
    });
  });

  describe("addLifecycleEvent", () => {
    it("should add a lifecycle event and update status", async () => {
      const mockProduct = {
        productID: "P1",
        ownerEmail: "test@example.com",
        status: "active",
        lifecycle: [],
        save: saveMock
      };
      ProductMock.findOne.mockResolvedValue(mockProduct);

      req.params.productID = "P1";
      req.body = {
        eventType: "repair request",
        description: "Need repair"
      };

      await addLifecycleEvent(req, res);

      expect(mockProduct.status).toBe("under repair");
      expect(mockProduct.lifecycle.length).toBe(1);
      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Lifecycle event added successfully"
      }));
    });

    it("should return 404 if product not found", async () => {
      ProductMock.findOne.mockResolvedValue(null);
      req.params.productID = "P999";
      
      await addLifecycleEvent(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("buyProduct", () => {
    it("should mark product as sold and remove from marketplace", async () => {
      const mockProduct = {
        productID: "P1",
        isForSale: true,
        status: "active",
        lifecycle: [],
        save: saveMock
      };
      ProductMock.findOne.mockResolvedValue(mockProduct);

      req.params.productID = "P1";

      await buyProduct(req, res);

      expect(mockProduct.status).toBe("sold");
      expect(mockProduct.isForSale).toBe(false);
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe("resolveRepair", () => {
    it("should resolve repair as active when repaired", async () => {
      const mockProduct = {
        productID: "P1",
        status: "under repair",
        lifecycle: [],
        save: saveMock
      };
      ProductMock.findOne.mockResolvedValue(mockProduct);

      req.params.productID = "P1";
      req.body.resolution = "repaired";

      await resolveRepair(req, res);

      expect(mockProduct.status).toBe("active");
      expect(saveMock).toHaveBeenCalled();
    });
  });
});
