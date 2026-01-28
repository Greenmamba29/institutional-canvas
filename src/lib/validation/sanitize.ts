/**
 * Input Sanitization Utilities
 * 
 * Provides secure sanitization for user inputs, particularly for
 * database pattern matching queries (ILIKE/LIKE).
 */

/**
 * Sanitizes user input for safe use in ILIKE/LIKE pattern matching.
 * Escapes SQL wildcards (%, _) and removes other special characters.
 * 
 * @param input - Raw user input string
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized string safe for pattern matching
 */
export function sanitizePatternMatch(input: string, maxLength = 100): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Escape Postgres LIKE/ILIKE wildcards
    .replace(/[%_]/g, '\\$&')
    // Remove SQL injection characters
    .replace(/[;'"\\]/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Validates and sanitizes a search query.
 * Returns empty string if input is too short or invalid.
 * 
 * @param query - Raw search query
 * @param minLength - Minimum required length (default: 2)
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized query or empty string
 */
export function sanitizeSearchQuery(
  query: string,
  minLength = 2,
  maxLength = 100
): string {
  const sanitized = sanitizePatternMatch(query, maxLength);
  
  if (sanitized.length < minLength) {
    return '';
  }
  
  return sanitized;
}
