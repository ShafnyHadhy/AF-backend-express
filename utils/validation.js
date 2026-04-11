export const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { isValid: false, message: "Email is required" };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: "Please provide a valid email address (e.g., user@example.com)",
    };
  }

  return { isValid: true };
};

export const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter (A-Z)",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter (a-z)",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number (0-9)",
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message:
        "Password must contain at least one special character (!@#$%^&* etc.)",
    };
  }

  return { isValid: true };
};

export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return { isValid: false, message: "Phone number is required" };
  }

  const phoneRegex = /^(?:\+94|0)?[1-9]\d{8}$/;

  if (!phoneRegex.test(phoneNumber)) {
    return {
      isValid: false,
      message:
        "Please provide a valid Sri Lankan phone number (e.g., 0771234567 or +94771234567)",
    };
  }

  return { isValid: true };
};

export const validateName = (name, fieldName = "Name") => {
  if (!name || typeof name !== "string") {
    return { isValid: false, message: `${fieldName} is required` };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 2 characters long`,
    };
  }

  if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
    return {
      isValid: false,
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }

  return { isValid: true };
};

export const validateRole = (role) => {
  const validRoles = ["customer", "provider", "recycler", "admin"];

  if (!role) {
    return { isValid: false, message: "Role is required" };
  }

  if (!validRoles.includes(role)) {
    return {
      isValid: false,
      message: `Role must be one of: ${validRoles.join(", ")}`,
    };
  }

  return { isValid: true };
};

export const validateOTP = (otp) => {
  if (!otp || typeof otp !== "string") {
    return { isValid: false, message: "OTP is required" };
  }

  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    return { isValid: false, message: "OTP must be a 6-digit number" };
  }

  return { isValid: true };
};

export const validateRegistrationData = (data) => {
  const errors = [];

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) errors.push(emailValidation.message);

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) errors.push(passwordValidation.message);

  const firstNameValidation = validateName(data.firstName, "First name");
  if (!firstNameValidation.isValid) errors.push(firstNameValidation.message);

  const lastNameValidation = validateName(data.lastName, "Last name");
  if (!lastNameValidation.isValid) errors.push(lastNameValidation.message);

  const phoneValidation = validatePhoneNumber(data.phoneNumber);
  if (!phoneValidation.isValid) errors.push(phoneValidation.message);

  const roleValidation = validateRole(data.role);
  if (!roleValidation.isValid) errors.push(roleValidation.message);

  if (data.role === "provider") {
    if (!data.providerDetails) {
      errors.push("Provider details are required for provider role");
    } else {
      if (!data.providerDetails.companyName) {
        errors.push("Company name is required");
      }
      if (!data.providerDetails.companyPhone) {
        errors.push("Company phone is required");
      }
      if (!data.providerDetails.companyRegistrationNo) {
        errors.push("Company registration number is required");
      }
    }
  }

  if (data.role === "recycler") {
    if (!data.recyclerDetails) {
      errors.push("Recycler details are required for recycler role");
    } else {
      if (!data.recyclerDetails.companyName) {
        errors.push("Company name is required");
      }
      if (!data.recyclerDetails.companyPhone) {
        errors.push("Company phone is required");
      }
      if (!data.recyclerDetails.companyRegistrationNo) {
        errors.push("Company registration number is required");
      }
      // Recycler details validation - don't require arrays to be non-empty
      // Just check if they exist (can be empty arrays)
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// ==================== LOGIN DATA VALIDATION ====================
export const validateLoginData = (data) => {
  const errors = [];

  if (!data.email || typeof data.email !== "string") {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Please provide a valid email address");
    }
  }

  if (!data.password || typeof data.password !== "string") {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// ==================== PROFILE UPDATE DATA VALIDATION ====================
export const validateProfileUpdateData = (data) => {
  const errors = [];

  if (data.firstName !== undefined) {
    if (
      typeof data.firstName !== "string" ||
      data.firstName.trim().length < 2
    ) {
      errors.push("First name must be at least 2 characters long");
    }
  }

  if (data.lastName !== undefined) {
    if (typeof data.lastName !== "string" || data.lastName.trim().length < 2) {
      errors.push("Last name must be at least 2 characters long");
    }
  }

  if (data.phoneNumber !== undefined) {
    const phoneRegex = /^(?:\+94|0)?[1-9]\d{8}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      errors.push(
        "Please provide a valid Sri Lankan phone number (e.g., 0771234567 or +94771234567)",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// ==================== FORGOT PASSWORD DATA VALIDATION ====================
export const validateForgotPasswordData = (data) => {
  const errors = [];

  if (!data.email || typeof data.email !== "string") {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Please provide a valid email address");
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};
