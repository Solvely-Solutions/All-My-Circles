/**
 * Input sanitization utilities for contact data
 * Prevents XSS, validates formats, and ensures data integrity
 */

/**
 * Sanitizes text input to prevent XSS and other malicious content
 */
export function sanitizeText(input: string | null | undefined, maxLength = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove HTML tags and dangerous content
  const sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object tags
    .replace(/<embed[^>]*>.*?<\/embed>/gi, '') // Remove embed tags
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:(?!image\/(png|jpeg|jpg|gif|webp))[^;]*;/gi, '') // Remove dangerous data: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
  
  // Limit length
  return sanitized.length > maxLength 
    ? sanitized.substring(0, maxLength).trim() + '...'
    : sanitized;
}

/**
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const sanitized = email.trim().toLowerCase();
  
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  // Additional security checks
  if (sanitized.length > 254) { // RFC 5321 limit
    return '';
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /<|>/,
    /\.\./,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(sanitized))) {
    return '';
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes phone numbers
 */
export function sanitizePhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Remove all non-numeric characters except + and spaces
  const cleaned = phone.replace(/[^\d\s+()-]/g, '');
  
  // Basic phone validation (international format)
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return '';
  }
  
  return cleaned.trim();
}

/**
 * Validates and sanitizes names (person names, company names)
 */
export function sanitizeName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and periods
  const sanitized = name
    .replace(/[^a-zA-Z\s\-'.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Length limits
  if (sanitized.length < 1 || sanitized.length > 100) {
    return '';
  }
  
  // Check for suspicious patterns
  if (/^[.\-'\s]+$/.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitizes job titles
 */
export function sanitizeJobTitle(title: string | null | undefined): string {
  if (!title || typeof title !== 'string') {
    return '';
  }
  
  // Allow letters, numbers, spaces, common punctuation
  const sanitized = title
    .replace(/[^a-zA-Z0-9\s\-'.&/,()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return sanitized.length > 200 ? sanitized.substring(0, 200).trim() : sanitized;
}

/**
 * Sanitizes company names
 */
export function sanitizeCompanyName(company: string | null | undefined): string {
  if (!company || typeof company !== 'string') {
    return '';
  }
  
  // Allow letters, numbers, spaces, and common business punctuation
  const sanitized = company
    .replace(/[^a-zA-Z0-9\s\-'.&,()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return sanitized.length > 150 ? sanitized.substring(0, 150).trim() : sanitized;
}

/**
 * Sanitizes tags and group names
 */
export function sanitizeTag(tag: string | null | undefined): string {
  if (!tag || typeof tag !== 'string') {
    return '';
  }
  
  // Allow letters, numbers, hyphens, underscores
  const sanitized = tag
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .toLowerCase()
    .trim();
  
  return sanitized.length > 50 ? sanitized.substring(0, 50) : sanitized;
}

/**
 * Sanitizes notes and longer text content
 */
export function sanitizeNote(note: string | null | undefined): string {
  if (!note || typeof note !== 'string') {
    return '';
  }
  
  return sanitizeText(note, 5000); // 5KB limit for notes
}

/**
 * Comprehensive contact data sanitization
 */
export function sanitizeContactData(data: any): any {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  return {
    name: sanitizeName(data.name),
    company: sanitizeCompanyName(data.company),
    title: sanitizeJobTitle(data.title),
    email: sanitizeEmail(data.email),
    phone: sanitizePhoneNumber(data.phone),
    note: sanitizeNote(data.note),
    tags: Array.isArray(data.tags) 
      ? data.tags.map((tag: any) => sanitizeTag(tag)).filter(Boolean)
      : [],
    groups: Array.isArray(data.groups)
      ? data.groups.map((group: any) => sanitizeName(group)).filter(Boolean)
      : [],
  };
}