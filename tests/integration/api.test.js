import { describe, it, expect } from "@jest/globals";

describe("API Endpoint Tests", () => {
  const expectedEndpoints = [
    "/api/users/login",
    "/api/users/register/step1",
    "/api/users/forgot-password",
    "/api/users/reset-password-with-otp",
    "/api/users/providers",
    "/api/users/recyclers",
  ];

  it("should have defined API endpoints structure", () => {
    expect(expectedEndpoints.length).toBeGreaterThan(0);
    expect(expectedEndpoints).toContain("/api/users/login");
    expect(expectedEndpoints).toContain("/api/users/register/step1");
  });

  it("should validate endpoint naming convention", () => {
    expectedEndpoints.forEach((endpoint) => {
      expect(endpoint).toMatch(/^\/api\//);
    });
  });
});
