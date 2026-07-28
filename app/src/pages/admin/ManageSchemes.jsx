import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';
import { schemeApi } from '../../../services/schemeApi';

export default function ManageSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Farming',
    description: '',
    state: 'Central'
  });

  const fetchSchemes = async () => {
    try {
      const result = await schemeApi.getAllSchemes();
      setSchemes(result.data);
    } catch (error) {
      console.error('Failed to fetch schemes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await schemeApi.createScheme(formData);
      // Reset form and refresh list
      setFormData({ title: '', category: 'Farming', description: '', state: 'Central' });
      fetchSchemes();
      alert('Scheme added successfully!');
    } catch (error) {
      alert('Failed to add scheme');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this scheme?')) {
      try {
        await schemeApi.deleteScheme(id);
        fetchSchemes(); // Refresh list
      } catch (error) {
        alert('Failed to delete');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Panel: Manage Schemes</h1>

      {/* Add New Scheme Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 max-w-2xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaPlus className="mr-2 text-green-600" /> Add New Scheme
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Scheme Title</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleInputChange} 
              required 
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleInputChange} 
                className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PM-KISAN">PM-KISAN</option>
                <option value="Dairy Farming">Dairy Farming</option>
                <option value="Solar Pump Subsidy">Solar Pump Subsidy</option>
                <option value="Farming">Farming</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input 
                type="text" 
                name="state" 
                value={formData.state} 
                onChange={handleInputChange} 
                className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              required 
              rows="3" 
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition">
            Save Scheme
          </button>
        </form>
      </div>

      {/* List Existing Schemes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
            ) : (
              schemes.map((scheme) => (
                <tr key={scheme._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scheme.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scheme.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4" title="Edit">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(scheme._id)} className="text-red-600 hover:text-red-900" title="Delete">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
