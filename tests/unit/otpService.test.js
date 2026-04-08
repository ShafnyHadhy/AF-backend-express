import { describe, it, expect } from "@jest/globals";
import { generateOTP, verifyOTPCode } from "../../utils/otpService.js";

describe("OTP Service", () => {
  describe("generateOTP", () => {
    it("should generate a 6-digit OTP", () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("should generate different OTPs", () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe("verifyOTPCode", () => {
    it("should return valid true for correct OTP", () => {
      const futureDate = new Date(Date.now() + 300000);
      const result = verifyOTPCode("123456", "123456", futureDate);
      expect(result.valid).toBe(true);
    });

    it("should return valid false for incorrect OTP", () => {
      const futureDate = new Date(Date.now() + 300000);
      const result = verifyOTPCode("123456", "654321", futureDate);
      expect(result.valid).toBe(false);
    });

    it("should return valid false for expired OTP", () => {
      const pastDate = new Date(Date.now() - 300000);
      const result = verifyOTPCode("123456", "123456", pastDate);
      expect(result.valid).toBe(false);
    });
  });
});
