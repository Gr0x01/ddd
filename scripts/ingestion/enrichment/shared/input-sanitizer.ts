/**
 * Input sanitization utilities to prevent prompt injection and other attacks
 */

/**
 * Sanitize user input for safe use in LLM prompts
 * Removes potentially dangerous characters and limits length
 */
export function sanitizeForPrompt(input: string, maxLength: number = 200): string {
  if (!input) return '';

  return input
    .replace(/["'`]/g, '') // Remove quotes
    .replace(/[<>]/g, '')  // Remove HTML-like tags
    .replace(/[\n\r]/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .substring(0, maxLength);
}

/**
 * Sanitize restaurant name for safe use
 */
export function sanitizeRestaurantName(name: string): string {
  return sanitizeForPrompt(name, 100);
}

/**
 * Sanitize city/state for safe use
 */
export function sanitizeLocation(location: string): string {
  return sanitizeForPrompt(location, 50);
}

/**
 * Validate UUID format (v4)
 */
export function isValidUUID(id: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(id);
}
