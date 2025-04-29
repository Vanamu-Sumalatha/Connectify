/**
 * Simple utility to combine class names
 * This is a basic implementation without dependencies
 * 
 * @param {...any} inputs - Class names or arrays of class names
 * @returns {string} A combined class name string
 */
export function cn(...inputs) {
  // Flatten all inputs and filter out falsy values
  const classes = inputs
    .flat()
    .filter(Boolean)
    .map(item => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        // Handle objects where keys are class names and values are boolean conditions
        return Object.entries(item)
          .filter(([_, condition]) => Boolean(condition))
          .map(([className]) => className.trim());
      }
      return '';
    })
    .flat()
    .filter(Boolean);

  // Remove duplicates
  const uniqueClasses = Array.from(new Set(classes));
  return uniqueClasses.join(' ');
}

/**
 * Formats a date using the Intl.DateTimeFormat API
 * 
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - The options for Intl.DateTimeFormat
 * @returns {string} The formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Truncates a string to the specified length and appends an ellipsis
 * 
 * @param {string} text - The text to truncate
 * @param {number} length - The maximum length before truncation
 * @returns {string} The truncated text
 */
export function truncateText(text, length = 100) {
  if (!text || text.length <= length) return text || '';
  return text.slice(0, length).trim() + '...';
}

/**
 * Generates a random ID
 * 
 * @param {number} length - The length of the ID
 * @returns {string} The generated ID
 */
export function generateId(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Validates an email address
 * 
 * @param {string} email - The email to validate
 * @returns {boolean} Whether the email is valid
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formats a currency value
 * 
 * @param {number} value - The value to format
 * @param {string} currency - The currency code
 * @returns {string} The formatted currency string
 */
export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
} 