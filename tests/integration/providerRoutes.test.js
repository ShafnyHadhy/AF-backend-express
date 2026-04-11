import request from "supertest";
import app from "../../index.js";

describe("Provider Routes", () => {

  it("should reject /me without token", async () => {
    const res = await request(app).get("/api/providers/me");
    expect(res.status).toBe(401);
  });

  it("should return 400 if lat/lng missing", async () => {
    const res = await request(app).get("/api/providers/nearby");
    expect(res.status).toBe(400);
  });

  it("should return providers with valid query", async () => {
    const res = await request(app)
      .get("/api/providers/nearby?lat=6.9&lng=79.8");

    expect(res.status).toBe(200);
  });

});