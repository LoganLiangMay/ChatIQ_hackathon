/**
 * React Native compatible UUID generator
 * Uses timestamp + random values for unique IDs
 */

/**
 * Generate a UUID v4-like string
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * Where x is any hexadecimal digit and y is one of 8, 9, A, or B
 * 
 * This is a simplified UUID generator that works in React Native
 * without requiring crypto.getRandomValues()
 */
export function generateUUID(): string {
  const timestamp = Date.now();
  const random1 = Math.floor(Math.random() * 0x10000);
  const random2 = Math.floor(Math.random() * 0x10000);
  const random3 = Math.floor(Math.random() * 0x10000);
  const random4 = Math.floor(Math.random() * 0x100000000);
  
  // Convert to hex and pad
  const hex1 = timestamp.toString(16).padStart(12, '0');
  const hex2 = random1.toString(16).padStart(4, '0');
  const hex3 = random2.toString(16).padStart(4, '0');
  const hex4 = random3.toString(16).padStart(4, '0');
  const hex5 = random4.toString(16).padStart(12, '0');
  
  // Format as UUID v4
  return `${hex1.slice(0, 8)}-${hex1.slice(8, 12)}-4${hex2.slice(1, 4)}-${getY()}${hex3.slice(1, 4)}-${hex4}${hex5.slice(0, 8)}`;
}

/**
 * Get a random hex digit that's either 8, 9, a, or b
 * (Required for UUID v4 format)
 */
function getY(): string {
  const values = ['8', '9', 'a', 'b'];
  return values[Math.floor(Math.random() * values.length)];
}


