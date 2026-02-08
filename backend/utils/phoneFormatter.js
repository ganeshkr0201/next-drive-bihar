/**
 * Format phone number to include +91 prefix for Indian numbers
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number with +91 prefix and space
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If it's a 10-digit number, add +91 with space
  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly}`;
  }
  
  // If it already has country code (11 or 12 digits), ensure it has + and space
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+91 ${digitsOnly.substring(2)}`;
  }
  
  // If it already starts with +91, ensure there's a space
  if (phoneNumber.startsWith('+91')) {
    const withoutPrefix = phoneNumber.substring(3).replace(/\D/g, '');
    return `+91 ${withoutPrefix}`;
  }
  
  // Return original if it doesn't match expected patterns
  return phoneNumber;
};

/**
 * Format multiple phone fields in an object
 * @param {Object} data - Object containing phone fields
 * @param {Array<string>} fields - Array of field names to format
 * @returns {Object} - Object with formatted phone fields
 */
export const formatPhoneFields = (data, fields = ['contactNumber', 'emergencyContact', 'phone', 'whatsapp']) => {
  const formatted = { ...data };
  
  fields.forEach(field => {
    if (formatted[field]) {
      formatted[field] = formatPhoneNumber(formatted[field]);
    }
  });
  
  return formatted;
};
