/**
 * Comprehensive input validation utilities
 * Prevents injection attacks and ensures data integrity
 */

// Email validation with comprehensive checks
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Length validation
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email too long' };
  }

  // Domain validation
  const domain = trimmedEmail.split('@')[1];
  if (domain.length > 253) {
    return { isValid: false, error: 'Domain name too long' };
  }

  // Check for dangerous characters
  const dangerousChars = /[<>'"&]/;
  if (dangerousChars.test(trimmedEmail)) {
    return { isValid: false, error: 'Email contains invalid characters' };
  }

  return { isValid: true, value: trimmedEmail };
};

// Password validation with security requirements
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : null,
    errors: errors,
    strength: calculatePasswordStrength(password)
  };
};

// Calculate password strength score
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  if (password.length >= 16) score += 1;
  
  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return {
    score: score,
    level: levels[Math.min(score, levels.length - 1)]
  };
};

// Display name validation
export const validateDisplayName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Display name is required' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Display name must be less than 50 characters' };
  }

  // Allow letters, numbers, spaces, and common punctuation
  const validNameRegex = /^[a-zA-Z0-9\s\-_.]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Display name contains invalid characters' };
  }

  // Check for XSS attempts
  const xssRegex = /<script|javascript:|on\w+=/i;
  if (xssRegex.test(trimmedName)) {
    return { isValid: false, error: 'Display name contains invalid content' };
  }

  return { isValid: true, value: trimmedName };
};

// File validation for uploads
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    minSize = 100 // 100 bytes minimum
  } = options;

  if (!file) {
    return { isValid: false, error: 'File is required' };
  }

  // Size validation
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB` 
    };
  }

  if (file.size < minSize) {
    return { isValid: false, error: 'File too small' };
  }

  // Type validation
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  // Filename validation
  if (file.name) {
    const dangerousExtensions = /\.(exe|bat|cmd|scr|pif|com|js|html|php)$/i;
    if (dangerousExtensions.test(file.name)) {
      return { isValid: false, error: 'File type not allowed for security reasons' };
    }
  }

  return { isValid: true, file };
};

// Sanitize text input to prevent XSS
export const sanitizeText = (text, maxLength = 1000) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers

  return sanitized;
};

// Validate widget configuration
export const validateWidgetConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return { isValid: false, error: 'Widget configuration is required' };
  }

  const { type, title, settings } = config;

  // Validate type
  const allowedTypes = ['clock', 'photos', 'notes', 'weather', 'calendar'];
  if (!allowedTypes.includes(type)) {
    return { isValid: false, error: 'Invalid widget type' };
  }

  // Validate title
  const titleValidation = validateDisplayName(title);
  if (!titleValidation.isValid) {
    return { isValid: false, error: `Title: ${titleValidation.error}` };
  }

  // Validate settings object
  if (settings && typeof settings !== 'object') {
    return { isValid: false, error: 'Widget settings must be an object' };
  }

  return { isValid: true, config: { ...config, title: titleValidation.value } };
};

// Rate limiting helper
export const createRateLimiter = (maxRequests = 10, windowMs = 60000) => {
  const requests = new Map();

  return (identifier) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }

    // Check current requests
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      return {
        allowed: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      };
    }

    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);

    return { allowed: true };
  };
};

// Export validation utilities
export default {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateFile,
  validateWidgetConfig,
  sanitizeText,
  createRateLimiter,
  calculatePasswordStrength
};