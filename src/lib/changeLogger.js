/**
 * Change Logger Utility
 * 
 * Logs all changes to vehicles, bookings, and profiles
 * to the change_logs table for audit trail purposes.
 */

import { supabase } from './supabase.js';

/**
 * Log a change to the change_logs table
 * 
 * @param {Object} params - Logging parameters
 * @param {string} params.entityType - 'vehicle' | 'booking' | 'profile'
 * @param {string} params.entityId - UUID of the entity
 * @param {string} params.entityName - Display name of the entity
 * @param {string} params.actionType - 'create' | 'update' | 'delete'
 * @param {Object|null} params.beforeData - Object snapshot before change (for update/delete)
 * @param {Object|null} params.afterData - Object snapshot after change (for create/update)
 * @param {string} params.userId - Current user ID
 * @param {string} params.userEmail - Current user email
 * @param {string} params.displayName - Current user display name
 * @param {string} [params.notes] - Optional notes about the change
 * @returns {Promise<void>}
 */
export async function logChange({
  entityType,
  entityId,
  entityName,
  actionType,
  beforeData = null,
  afterData = null,
  userId,
  userEmail,
  displayName,
  notes = null
}) {
  try {
    // Validate required fields
    if (!entityType || !entityId || !actionType || !userId) {
      console.error('Missing required fields for change log:', {
        entityType,
        entityId,
        actionType,
        userId
      });
      return;
    }

    // Validate entity type
    const validEntityTypes = ['vehicle', 'booking', 'profile'];
    if (!validEntityTypes.includes(entityType)) {
      console.error('Invalid entity type:', entityType);
      return;
    }

    // Validate action type
    const validActionTypes = ['create', 'update', 'delete'];
    if (!validActionTypes.includes(actionType)) {
      console.error('Invalid action type:', actionType);
      return;
    }

    // Calculate changed fields for updates
    let changedFields = null;
    if (actionType === 'update' && beforeData && afterData) {
      changedFields = {};
      for (const key in afterData) {
        // Skip metadata fields
        if (['id', 'created_at', 'updated_at'].includes(key)) continue;
        
        // Compare values (use JSON stringify for deep comparison)
        const beforeValue = beforeData[key];
        const afterValue = afterData[key];
        
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
          changedFields[key] = {
            old: beforeValue,
            new: afterValue
          };
        }
      }
      
      // If no fields changed, don't log
      if (Object.keys(changedFields).length === 0) {
        console.log('No fields changed, skipping log');
        return;
      }
    }

    // Prepare log entry
    const logEntry = {
      user_id: userId,
      user_email: userEmail,
      user_display_name: displayName,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      action_type: actionType,
      before_snapshot: beforeData,
      after_snapshot: afterData,
      changed_fields: changedFields,
      notes: notes
    };

    // Insert log entry
    const { error } = await supabase
      .from('change_logs')
      .insert(logEntry);

    if (error) {
      console.error('Error logging change:', error);
      // Don't throw - we don't want logging failures to break the app
      return;
    }

    console.log(`Successfully logged ${actionType} for ${entityType}:`, entityName);
  } catch (err) {
    console.error('Exception in logChange:', err);
    // Don't throw - we don't want logging failures to break the app
  }
}

/**
 * Fetch change history for a specific entity
 * 
 * @param {string} entityType - 'vehicle' | 'booking' | 'profile'
 * @param {string} entityId - UUID of the entity
 * @param {number} [limit=50] - Maximum number of records to fetch
 * @returns {Promise<Array>} Array of change log entries
 */
export async function getChangeHistory(entityType, entityId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('change_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching change history:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getChangeHistory:', err);
    return [];
  }
}

/**
 * Fetch all changes made by a specific user
 * 
 * @param {string} userId - UUID of the user
 * @param {number} [limit=100] - Maximum number of records to fetch
 * @returns {Promise<Array>} Array of change log entries
 */
export async function getUserChanges(userId, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('change_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user changes:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getUserChanges:', err);
    return [];
  }
}

/**
 * Format changed fields for display
 * 
 * @param {Object} changedFields - Changed fields object from log entry
 * @returns {Array<Object>} Formatted array of changes
 */
export function formatChangedFields(changedFields) {
  if (!changedFields) return [];
  
  return Object.entries(changedFields).map(([field, values]) => ({
    field,
    oldValue: values.old,
    newValue: values.new
  }));
}

/**
 * Get a human-readable label for a field name
 * 
 * @param {string} fieldName - Database field name
 * @returns {string} Human-readable label
 */
export function getFieldLabel(fieldName) {
  const labels = {
    name: 'Name',
    status: 'Status',
    department: 'Department',
    hw_config: 'Hardware Config',
    notes: 'Notes',
    project_name: 'Project Name',
    start_time: 'Start Time',
    end_time: 'End Time',
    risk_level: 'Risk Level',
    display_name: 'Display Name',
    role: 'Role',
    vehicle_id: 'Vehicle',
    user_id: 'User'
  };
  
  return labels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
