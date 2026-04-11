import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const saveMock = jest.fn();

const ProviderProfileMock = jest.fn().mockImplementation((data) => ({
  ...data,
  save: saveMock,
}));

ProviderProfileMock.find = jest.fn();
ProviderProfileMock.findOne = jest.fn();
ProviderProfileMock.aggregate = jest.fn();
ProviderProfileMock.findOneAndUpdate = jest.fn();
ProviderProfileMock.findByIdAndUpdate = jest.fn();

jest.unstable_mockModule("../../models/providerProfile.js", () => ({
  default: ProviderProfileMock,
}));

const {
  createProviderProfile,
  getMyProviderProfiles,
  updateMyProviderProfile,
  getNearbyProviders,
  approveProviderProfile,
  deactivateMyProviderProfile,
  restoreProviderProfile,
} = await import("../../controllers/providerController.js");

describe("Provider Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { userId: "user123", role: "provider" },
      params: {},
      query: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it("should create provider", async () => {
    ProviderProfileMock.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({ providerCode: "PROV0000001" }),
    });

    saveMock.mockResolvedValue({ providerCode: "PROV0000002" });

    req.body = {
      businessName: "Test",
      providerType: "repair_center",
      categories: ["Phone"],
      phone: "0771234567",
      email: "test@test.com",
      addressLine: "Colombo",
      location: { coordinates: [80.2, 7.1] },
      serviceRadiusKm: 10,
    };

    await createProviderProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should return 400 if lat/lng missing", async () => {
    await getNearbyProviders(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should reject non-admin approval", async () => {
    await approveProviderProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should deactivate profile", async () => {
    req.params.providerCode = "PROV1";
    ProviderProfileMock.findOne.mockResolvedValue({ userId: "user123" });
    ProviderProfileMock.findOneAndUpdate.mockResolvedValue({ isActive: false });

    await deactivateMyProviderProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should restore profile", async () => {
    req.params.providerCode = "PROV1";
    ProviderProfileMock.findOneAndUpdate.mockResolvedValue({ isActive: true });

    await restoreProviderProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});