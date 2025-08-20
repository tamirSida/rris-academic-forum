/**
 * Phone number utilities for parsing and formatting
 */

export interface ParsedPhoneNumber {
  countryCode: string;
  number: string;
  formatted: string;
  cleanNumber: string; // Just digits + country code for tel: links
}

/**
 * Parse and clean phone number, handling various formats
 */
export function parsePhoneNumber(phoneInput: string): ParsedPhoneNumber {
  if (!phoneInput) {
    return {
      countryCode: '',
      number: '',
      formatted: '',
      cleanNumber: ''
    };
  }

  // Remove all non-digit characters except +
  let cleaned = phoneInput.replace(/[^\d+]/g, '');
  
  // Extract country code if present
  let countryCode = '';
  let number = cleaned;
  
  if (cleaned.startsWith('+')) {
    // Find where country code ends (usually 1-3 digits after +)
    const match = cleaned.match(/^(\+\d{1,3})(.*)$/);
    if (match) {
      countryCode = match[1];
      number = match[2];
    }
  }

  // Format for display
  const formatted = formatForDisplay(countryCode, number);
  
  // Clean number for tel: links (country code + number, no spaces or dashes)
  const cleanNumber = countryCode + number;

  return {
    countryCode,
    number,
    formatted,
    cleanNumber
  };
}

/**
 * Format phone number for display
 */
function formatForDisplay(countryCode: string, number: string): string {
  if (!number && !countryCode) return '';
  
  // Israeli number formatting example
  if (countryCode === '+972' && number.length >= 9) {
    // Format as +972 XX-XXX-XXXX
    const formatted = number.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    return `${countryCode} ${formatted}`;
  }
  
  // US number formatting
  if (countryCode === '+1' && number.length === 10) {
    // Format as +1 (XXX) XXX-XXXX
    const formatted = number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    return `${countryCode} ${formatted}`;
  }
  
  // Generic international formatting
  if (countryCode && number.length >= 7) {
    // Add spaces every 3-4 digits
    const formatted = number.replace(/(\d{2,3})(\d{3})(\d+)/, '$1 $2 $3');
    return `${countryCode} ${formatted}`;
  }
  
  // Fallback: just return with country code
  return countryCode ? `${countryCode} ${number}` : number;
}

/**
 * Extract WhatsApp number from phone or separate WhatsApp field
 */
export function extractWhatsAppNumber(phone: string, whatsapp?: string): string {
  // If we have a separate WhatsApp field, use that
  if (whatsapp && whatsapp.trim()) {
    return parsePhoneNumber(whatsapp).cleanNumber;
  }
  
  // Otherwise, assume WhatsApp is same as phone
  return parsePhoneNumber(phone).cleanNumber;
}

/**
 * Format phone number for tel: links
 */
export function formatForTelLink(phone: string): string {
  return parsePhoneNumber(phone).cleanNumber;
}

/**
 * Format phone number for WhatsApp links (no + prefix needed)
 */
export function formatForWhatsApp(phone: string): string {
  const cleanNumber = parsePhoneNumber(phone).cleanNumber;
  // Remove + prefix for WhatsApp
  return cleanNumber.startsWith('+') ? cleanNumber.substring(1) : cleanNumber;
}