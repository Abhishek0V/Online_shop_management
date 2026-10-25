// Each validator returns an error message, or "" when the value is valid.
export const required = (label) => (value) => (String(value ?? "").trim() ? "" : `${label} is required.`);

export const validateEmail = (value) => {
  if (!value.trim()) return "Email is required.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? "" : "Enter a valid email address.";
};

// Accepts "9876543210", "+91 98765 43210", "09876543210"; returns the 10 digits.
export const normalizePhone = (value) => value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");

export const validatePhone = (value) => {
  if (!value.trim()) return "Phone number is required.";
  return /^[6-9]\d{9}$/.test(normalizePhone(value)) ? "" : "Enter a valid 10-digit mobile number.";
};

export const validatePassword = (value) => {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (/^\d+$/.test(value)) return "Password cannot be entirely numeric.";
  return "";
};

export const validateConfirm = (password) => (value) =>
  !value ? "Please confirm your password." : value === password ? "" : "Passwords do not match.";

// Runs a { field: validatorFn } map against values and returns { field: message } for failures.
export const runValidators = (values, rules) =>
  Object.fromEntries(
    Object.entries(rules)
      .map(([field, fn]) => [field, fn(values[field] ?? "")])
      .filter(([, message]) => message)
  );

export const validatePincode = (value) => {
  if (!value.trim()) return "Pincode is required.";
  return /^\d{6}$/.test(value.trim()) ? "" : "Enter a valid 6-digit pincode.";
};