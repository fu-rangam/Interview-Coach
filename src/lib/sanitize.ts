// Prevent XSS attacks by escaping HTML
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Limit input length to prevent DoS
export function truncateInput(input: string, maxLength: number): string {
  return input.slice(0, maxLength);
}
