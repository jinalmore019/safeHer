// Validation Utilities — SafeHer

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Name is required' };
  if (trimmed.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (trimmed.length > 50) return { valid: false, error: 'Name is too long' };
  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  const trimmed = phone.trim().replace(/\s+/g, '');
  if (!trimmed) return { valid: false, error: 'Phone number is required' };
  // Accepts +91XXXXXXXXXX or 10-digit Indian numbers
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(trimmed)) {
    return { valid: false, error: 'Enter a valid 10-digit Indian mobile number' };
  }
  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { valid: true }; // email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Enter a valid email address' };
  }
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  return { valid: true };
}

export function validateConfirmPassword(
  password: string,
  confirm: string
): ValidationResult {
  if (!confirm) return { valid: false, error: 'Please confirm your password' };
  if (password !== confirm) return { valid: false, error: 'Passwords do not match' };
  return { valid: true };
}

export function validateOTP(otp: string): ValidationResult {
  if (!otp) return { valid: false, error: 'OTP is required' };
  if (!/^\d{4,6}$/.test(otp)) {
    return { valid: false, error: 'Enter a valid OTP' };
  }
  return { valid: true };
}
