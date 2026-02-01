/**
 * Database Abstraction Layer
 * Prevents vendor lock-in by centralizing all database operations
 * 
 * Centralizes all Supabase queries for easier migration to other databases
 */

import { supabase } from './supabase'

export const db = {
    //==========================================
    // Vehicles Management
    //==========================================

    async getVehicles() {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    async getVehicle(id) {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    async createVehicle(vehicle) {
        const { data, error } = await supabase
            .from('vehicles')
            .insert(vehicle)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateVehicle(id, updates) {
        const { data, error } = await supabase
            .from('vehicles')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async deleteVehicle(id) {
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    //==========================================
    // Bookings Management
    //==========================================

    async getBookings(vehicleId = null) {
        let query = supabase
            .from('bookings')
            .select('*')
            .order('start_time', { ascending: true })

        if (vehicleId) {
            query = query.eq('vehicle_id', vehicleId)
        }

        const { data, error } = await query
        if (error) throw error
        return data
    },

    async getUpcomingBookings() {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(10)

        if (error) throw error
        return data
    },

    async createBooking(booking) {
        const { data, error } = await supabase
            .from('bookings')
            .insert(booking)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateBooking(id, updates) {
        const { data, error } = await supabase
            .from('bookings')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async deleteBooking(id) {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    //==========================================
    // Team Members Management
    //==========================================

    async getTeamMembers(activeOnly = true) {
        let query = supabase
            .from('team_members')
            .select('*')
            .order('name')

        if (activeOnly) {
            query = query.eq('is_active', true)
        }

        const { data, error } = await query
        if (error) throw error
        return data
    },

    async createTeamMember(member) {
        const { data, error } = await supabase
            .from('team_members')
            .insert(member)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateTeamMember(id, updates) {
        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async deactivateTeamMember(id) {
        return await this.updateTeamMember(id, { is_active: false })
    },

    //==========================================
    // Activities & Logs
    //==========================================

    async getActivities(vehicleId = null, limit = 50) {
        let query = supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (vehicleId) {
            query = query.eq('vehicle_id', vehicleId)
        }

        const { data, error } = await query
        if (error) throw error
        return data
    },

    async logActivity(activity) {
        const { error } = await supabase
            .from('activities')
            .insert(activity)

        if (error) throw error
    },

    //==========================================
    // User Profiles
    //==========================================

    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) throw error
        return data
    },

    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async getAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('email')

        if (error) throw error
        return data
    },

    //==========================================
    // Utility Functions
    //==========================================

    /**
     * Check if there are conflicting bookings in the time period
     */
    async checkBookingConflict(vehicleId, startTime, endTime, excludeBookingId = null) {
        const conflict = await this.getConflictBooking(vehicleId, startTime, endTime, excludeBookingId)
        return !!conflict
    },

    /**
     * Get first conflicting booking (for Soft Lock toast: project name)
     * Overlap: existing.start_time <= endTime AND existing.end_time >= startTime
     */
    async getConflictBooking(vehicleId, startTime, endTime, excludeBookingId = null) {
        let query = supabase
            .from('bookings')
            .select('id, project_name')
            .eq('vehicle_id', vehicleId)
            .lte('start_time', endTime)
            .gte('end_time', startTime)
            .limit(1)

        if (excludeBookingId) {
            query = query.neq('id', excludeBookingId)
        }

        const { data, error } = await query
        if (error) throw error
        return data && data[0] ? data[0] : null
    },

    /**
     * Get the next booking for a vehicle
     */
    async getNextBooking(vehicleId) {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
        return data
    }
}

export default db
