import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/schemes`;

export const schemeApi = {
  // Fetch all schemes, optionally filtered by search, category, or state
  getAllSchemes: async (params = {}) => {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching schemes:', error);
      throw error;
    }
  },

  // Fetch a single scheme by ID
  getSchemeById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scheme ${id}:`, error);
      throw error;
    }
  },

  // Create a new scheme (Admin)
  createScheme: async (schemeData) => {
    try {
      const response = await axios.post(API_URL, schemeData);
      return response.data;
    } catch (error) {
      console.error('Error creating scheme:', error);
      throw error;
    }
  },

  // Update a scheme (Admin)
  updateScheme: async (id, schemeData) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, schemeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating scheme ${id}:`, error);
      throw error;
    }
  },

  // Delete a scheme (Admin)
  deleteScheme: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting scheme ${id}:`, error);
      throw error;
    }
  }
};
