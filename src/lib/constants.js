/**
 * Shared constants for the fleet dashboard.
 * Used by BookingModal and unit tests.
 */

/**
 * Department prefixes for vehicle naming convention
 * Format: [PREFIX]-[IDENTIFIER]
 * Examples:
 *   - RD-117, RD-125, RD-High Altitude (R&D Department)
 *   - Training-933, Training_TBD (Pilot Training)
 *   - Marketing-001 (Marketing Department - future)
 */
export const DEPARTMENT_PREFIXES = {
  RD: 'RD-',              // R&D Department
  TRAINING: 'Training-',  // Pilot Training
  MARKETING: 'Marketing-' // Marketing (future)
}

/**
 * Validates if a vehicle name follows the department naming convention
 * @param {string} name - Vehicle name to validate
 * @returns {boolean} - True if name follows convention
 */
export function isValidVehicleName(name) {
  if (!name || typeof name !== 'string') return false
  const validPrefixes = Object.values(DEPARTMENT_PREFIXES)
  return validPrefixes.some(prefix => name.startsWith(prefix))
}

/**
 * Extracts department from vehicle name based on prefix
 * @param {string} name - Vehicle name
 * @returns {string} - Department name (R&D, Training, Marketing) or 'Unknown'
 */
export function getDepartmentFromName(name) {
  if (!name) return 'Unknown'
  if (name.startsWith('RD-')) return 'R&D'
  if (name.startsWith('Training-')) return 'Training'
  if (name.startsWith('Marketing-')) return 'Marketing'
  return 'Unknown'
}

/** Pilot options for booking: static list in alphabetical order (PRD) */
export const PILOT_OPTIONS = [
  'Devon',
  'Edine',
  'Ezgi',
  'Jaco',
  'Michael',
  'Renzo',
  'Thijm',
  'Tjeerd',
  'Yamac',
]
