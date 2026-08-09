import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaPaw as FaCow, FaSyringe, FaPlus, FaExclamationTriangle, 
  FaCheckCircle, FaSearch, FaHistory, FaBabyCarriage, FaStethoscope,
  FaLeaf, FaChartLine
} from 'react-icons/fa';
import LivestockCalendar from '../components/livestock/LivestockCalendar';
import FeedOptimizationDashboard from '../components/livestock/FeedOptimizationDashboard';
import ReproductiveDashboard from './ReproductiveDashboard';

const buildApiUrl = (path) => {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;
};

const LivestockDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalAnimals: 0, milkingCows: 0, pregnantCows: 0, calves: 0 });
  const [alerts, setAlerts] = useState({ deliveries: [], heatChecks: [], medical: [] });
  const [livestockList, setLivestockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  const initialAnimalState = { 
    tagId: '', category: 'Cow', breed: '', gender: 'Female', 
    status: 'Growing', weight: '', ageNumber: '', ageUnit: 'Years', buyingPrice: '', expectedDeliveryDate: '' 
  };
  const [newAnimal, setNewAnimal] = useState(initialAnimalState);
  const [medicalForm, setMedicalForm] = useState({ type: 'Vaccine', name: '', date: '', notes: '' });
  const [animalHistory, setAnimalHistory] = useState({ breeding: [], medical: [] });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  const runAIEvaluation = async () => {
    if (!selectedAnimal) return;
    setEvaluating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/livestock/${selectedAnimal._id}/viability`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAnimal(prev => ({ ...prev, aiHealthEvaluation: data }));
        setLivestockList(prevList => prevList.map(a => a._id === selectedAnimal._id ? { ...a, aiHealthEvaluation: data } : a));
      } else {
        alert('Failed to run AI Evaluation');
      }
    } catch (err) {
      console.error(err);
      alert('Error running AI Evaluation');
    } finally {
      setEvaluating(false);
    }
  };
  
  // Tabs: 'herd', 'feed', 'finance'
  const [activeTab, setActiveTab] = useState('herd');

  // Filtering states
  const [filterType, setFilterType] = useState('All'); // 'All', 'Milking', 'Pregnant', 'Calf'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, listRes] = await Promise.all([
        fetch(buildApiUrl('/livestock/dashboard/stats'), { headers }),
        fetch(buildApiUrl('/livestock'), { headers })
      ]);

      if (statsRes.ok && listRes.ok) {
        const statsData = await statsRes.json();
        const listData = await listRes.json();
        setStats(statsData.metrics);
        // Ensure medical array defaults to empty if not returned by backend
        setAlerts({ ...statsData.alerts, medical: statsData.alerts.medical || [] });
        setLivestockList(listData);
      }
    } catch (err) {
      console.error('Error fetching livestock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnimal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const animalToSubmit = { ...newAnimal };
      if (newAnimal.ageNumber) {
        // Build age string like "3 Years" or "6 Months"
        const translatedUnit = newAnimal.ageUnit === 'Years' ? t('livestock.modal_age_years', 'Years') : t('livestock.modal_age_months', 'Months');
        animalToSubmit.ageString = `${newAnimal.ageNumber} ${translatedUnit}`;
      }

      const res = await fetch(buildApiUrl('/livestock'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(animalToSubmit)
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewAnimal(initialAnimalState);
        fetchData(); // Refresh data
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to add animal');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleLogBreeding = async (livestockId, type) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/livestock/${livestockId}/breeding`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventType: type,
          eventDate: new Date().toISOString()
        })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogDelivery = async (livestockId) => {
    if(!window.confirm("Log automated calf delivery for this cow?")) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/livestock/${livestockId}/delivery`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          calfGender: 'Female', // Default, could be a prompt
          deliveryDate: new Date().toISOString()
        })
      });
      if (res.ok) {
        alert("Delivery logged! New calf added and cow moved to Milking.");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogMedicalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAnimal) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl(`/livestock/${selectedAnimal._id}/medical`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(medicalForm)
      });
      if (res.ok) {
        setShowMedicalModal(false);
        setMedicalForm({ type: 'Vaccine', name: '', date: '', notes: '' });
        alert(t('livestock.medical_logged', 'Medical record logged successfully!'));
      } else {
        alert('Failed to log medical record');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnimalHistory = async (animal) => {
    setSelectedAnimal(animal);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [breedRes, medRes] = await Promise.all([
        fetch(buildApiUrl(`/livestock/${animal._id}/breeding`), { headers }),
        fetch(buildApiUrl(`/livestock/${animal._id}/medical`), { headers })
      ]);
      const breeding = breedRes.ok ? await breedRes.json() : [];
      const medical = medRes.ok ? await medRes.json() : [];
      setAnimalHistory({ breeding, medical });
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Apply filters
  const filteredLivestock = livestockList.filter(animal => {
    // 1. Search Query Filter
    if (searchQuery && !animal.tagId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // 2. Metric Card Filter
    if (filterType === 'Milking') return animal.status === 'Milking';
    if (filterType === 'Pregnant') return animal.status === 'Pregnant';
    if (filterType === 'Calf') return animal.category === 'Calf';
    return true; // 'All'
  });

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaCow className="mr-3 text-green-600" />
            Livestock Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Manage your herd, feed inventory, and medical records.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('herd')}
          className={`pb-3 px-4 font-medium text-lg flex items-center transition-colors border-b-2 ${activeTab === 'herd' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FaCow className="mr-2" /> {t('livestock.tab_herd', 'Herd Directory')}
        </button>
        <button 
          onClick={() => setActiveTab('feed')}
          className={`pb-3 px-4 font-medium text-lg flex items-center transition-colors border-b-2 ${activeTab === 'feed' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FaLeaf className="mr-2" /> {t('livestock.tab_feed', 'Feed Management')}
        </button>
        <button 
          onClick={() => setActiveTab('reproductive')}
          className={`pb-3 px-4 font-medium text-lg flex items-center transition-colors border-b-2 ${activeTab === 'reproductive' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FaBabyCarriage className="mr-2" /> {t('livestock.tab_reproductive', 'Reproductive AI')}
        </button>
      </div>

      {activeTab === 'feed' && (
        <FeedOptimizationDashboard />
      )}

      {activeTab === 'reproductive' && (
        <ReproductiveDashboard />
      )}

      {activeTab === 'herd' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center shadow-md transition-colors"
              >
                <FaPlus className="mr-2" /> {t('livestock.add_animal', 'Add Animal')}
              </button>
            </div>

            {/* Fleet Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div 
                onClick={() => setFilterType('All')}
                className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'All' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'}`}
              >
                <div className="p-4 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <FaCow size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('livestock.total_animals', 'Total Animals')}</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.totalAnimals}</h3>
                </div>
              </div>
              <div 
                onClick={() => setFilterType('Milking')}
                className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Milking' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'}`}
              >
                <div className="p-4 rounded-full bg-green-100 text-green-600 mr-4">
                  <FaCheckCircle size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('livestock.milking_cows', 'Milking Cows')}</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.milkingCows}</h3>
                </div>
              </div>
              <div 
                onClick={() => setFilterType('Pregnant')}
                className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Pregnant' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-100'}`}
              >
                <div className="p-4 rounded-full bg-purple-100 text-purple-600 mr-4">
                  <FaBabyCarriage size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('livestock.pregnant_cows', 'Pregnant Cows')}</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.pregnantCows}</h3>
                </div>
              </div>
              <div 
                onClick={() => setFilterType('Calf')}
                className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Calf' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-100'}`}
              >
                <div className="p-4 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                  <FaCow size={20} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t('livestock.calves', 'Calves')}</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stats.calves}</h3>
                </div>
              </div>
            </div>

            {/* Livestock Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{t('livestock.inventory_directory', 'Inventory Directory')} {filterType !== 'All' && <span className="text-sm font-normal text-green-600 ml-2">({filterType})</span>}</h2>
                <div className="relative">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('livestock.search_placeholder', 'Search Tag ID...')} className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="p-4 font-semibold">{t('livestock.table_tag_id', 'Tag ID')}</th>
                      <th className="p-4 font-semibold">{t('livestock.table_age_price', 'Age / Price')}</th>
                      <th className="p-4 font-semibold">{t('livestock.table_status', 'Status')}</th>
                      <th className="p-4 font-semibold">{t('livestock.table_action', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLivestock.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500">{t('livestock.no_animals', 'No animals in inventory.')}</td>
                      </tr>
                    ) : (
                      filteredLivestock.map((animal) => (
                        <tr key={animal._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-medium text-gray-800">
                            {animal.tagId}
                            <div className="text-xs text-gray-500">{animal.category} • {animal.breed || 'Mixed'}</div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {animal.ageString || '-'} <br/>
                            {animal.buyingPrice ? <span className="text-green-600 font-medium">₹{animal.buyingPrice}</span> : '-'}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              animal.status === 'Milking' ? 'bg-green-100 text-green-700' :
                              animal.status === 'Pregnant' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {animal.status}
                            </span>
                          </td>
                          <td className="p-4 flex space-x-2">
                            {animal.gender === 'Female' && animal.status !== 'Pregnant' && (
                              <button onClick={() => handleLogBreeding(animal._id, 'Artificial Insemination')} className="text-sm text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-1 rounded">
                                <FaSyringe className="mr-1"/> {t('livestock.log_ai', 'Log AI')}
                              </button>
                            )}
                            {animal.status === 'Pregnant' && (
                              <button onClick={() => handleLogDelivery(animal._id)} className="text-sm text-pink-600 hover:text-pink-800 flex items-center bg-pink-50 px-2 py-1 rounded">
                                <FaBabyCarriage className="mr-1"/> {t('livestock.log_delivery', 'Log Delivery')}
                              </button>
                            )}
                            <button onClick={() => { setSelectedAnimal(animal); setShowMedicalModal(true); }} className="text-sm text-green-600 hover:text-green-800 flex items-center bg-green-50 px-2 py-1 rounded">
                              <FaStethoscope className="mr-1"/> {t('livestock.log_medical', 'Log Meds')}
                            </button>
                            <button onClick={() => fetchAnimalHistory(animal)} className="text-sm text-gray-600 hover:text-gray-800 flex items-center bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              <FaHistory className="mr-1"/> {t('livestock.view_history', 'History')}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Center / Alerts Panel */}
          <div className="space-y-6">
            
            {/* Calendar Widget */}
            <LivestockCalendar alerts={alerts} />

            {/* Medical Alerts Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FaStethoscope className="text-red-500 mr-2" />
                {t('livestock.medical_alerts_title', 'Medical Alerts')}
              </h2>
              {alerts.medical.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('livestock.no_medical_alerts', 'No pending medical tasks.')}</p>
              ) : (
                <ul className="space-y-3">
                  {alerts.medical.map(alert => (
                    <li key={alert._id} className="p-3 bg-red-50 rounded-lg text-sm border border-red-100">
                      <span className="font-bold text-gray-800">{alert.livestock.tagId}</span> needs <span className="font-bold text-red-600">Pre-Delivery Care / Drying Off</span> (Due before {new Date(alert.expectedDeliveryDate).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FaExclamationTriangle className="text-orange-500 mr-2" />
                {t('livestock.upcoming_deliveries_title', 'Upcoming Deliveries (Next 7 Days)')}
              </h2>
              {alerts.deliveries.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('livestock.no_upcoming_deliveries', 'No expected deliveries this week.')}</p>
              ) : (
                <ul className="space-y-3">
                  {alerts.deliveries.map(alert => (
                    <li key={alert._id} className="p-3 bg-orange-50 rounded-lg text-sm border border-orange-100">
                      <span className="font-bold text-gray-800">{alert.livestock.tagId}</span> is due around <span className="font-bold text-orange-600">{new Date(alert.expectedDeliveryDate).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <FaHistory className="text-blue-500 mr-2" />
                {t('livestock.heat_cycle_title', 'Heat Cycle Checks')}
              </h2>
              {alerts.heatChecks.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('livestock.no_heat_cycles', 'No cows predicted for heat this week.')}</p>
              ) : (
                <ul className="space-y-3">
                  {alerts.heatChecks.map(alert => (
                    <li key={alert._id} className="p-3 bg-blue-50 rounded-lg text-sm border border-blue-100">
                      Check <span className="font-bold text-gray-800">{alert.livestock.tagId}</span> for heat signs (Due {new Date(alert.nextHeatPredictionDate).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Animal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('livestock.modal_add_title', 'Add New Animal')}</h2>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
            <form onSubmit={handleAddAnimal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('livestock.modal_tag_id', 'Tag ID / Name')}</label>
                  <input required type="text" value={newAnimal.tagId} onChange={e => setNewAnimal({...newAnimal, tagId: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50" placeholder={t('livestock.modal_tag_ph', 'e.g. COW-001')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('livestock.modal_age', 'Age')}</label>
                  <div className="flex space-x-2">
                    <input type="number" min="0" value={newAnimal.ageNumber} onChange={e => setNewAnimal({...newAnimal, ageNumber: e.target.value})} className="w-2/3 p-2 border rounded-lg bg-gray-50" placeholder="e.g. 3" />
                    <select value={newAnimal.ageUnit} onChange={e => setNewAnimal({...newAnimal, ageUnit: e.target.value})} className="w-1/3 p-2 border rounded-lg bg-gray-50">
                      <option value="Years">{t('livestock.modal_age_years', 'Years')}</option>
                      <option value="Months">{t('livestock.modal_age_months', 'Months')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('livestock.modal_category', 'Category')}</label>
                  <select value={newAnimal.category} onChange={e => setNewAnimal({...newAnimal, category: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50">
                    <option value="Cow">{t('livestock.modal_cat_cow', 'Cow')}</option>
                    <option value="Buffalo">{t('livestock.modal_cat_buffalo', 'Buffalo')}</option>
                    <option value="Calf">{t('livestock.modal_cat_calf', 'Calf')}</option>
                    <option value="Bull">{t('livestock.modal_cat_bull', 'Bull')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('livestock.modal_breed', 'Breed')}</label>
                  <input type="text" value={newAnimal.breed} onChange={e => setNewAnimal({...newAnimal, breed: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50" placeholder={t('livestock.modal_breed_ph', 'Jersey')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('livestock.modal_price', 'Buying Price (₹)')}</label>
                  <input type="number" value={newAnimal.buyingPrice} onChange={e => setNewAnimal({...newAnimal, buyingPrice: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50" placeholder={t('livestock.modal_price_ph', 'e.g. 45000')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('livestock.modal_status', 'Current Status')}</label>
                  <select value={newAnimal.status} onChange={e => setNewAnimal({...newAnimal, status: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50">
                    <option value="Growing">{t('livestock.modal_stat_growing', 'Growing')}</option>
                    <option value="Milking">{t('livestock.modal_stat_milking', 'Milking')}</option>
                    <option value="Pregnant">{t('livestock.modal_stat_pregnant', 'Pregnant')}</option>
                    <option value="Dry">{t('livestock.modal_stat_dry', 'Dry')}</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Field: If bought pregnant, ask for expected delivery */}
              {newAnimal.status === 'Pregnant' && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <label className="block text-sm font-medium text-purple-800 mb-1">{t('livestock.modal_expected_delivery', 'Expected Delivery Date')}</label>
                  <p className="text-xs text-purple-600 mb-2">{t('livestock.modal_expected_delivery_desc', 'Since this cow is already pregnant, when is it due?')}</p>
                  <input 
                    required 
                    type="date" 
                    value={newAnimal.expectedDeliveryDate} 
                    onChange={e => setNewAnimal({...newAnimal, expectedDeliveryDate: e.target.value})} 
                    className="w-full p-2 border rounded-lg border-purple-200" 
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">{t('livestock.modal_cancel', 'Cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-colors">{t('livestock.modal_save', 'Save Animal')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Record Modal */}
      {showMedicalModal && selectedAnimal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">{t('livestock.medical_log_title', 'Log Medical Record')}</h2>
            <p className="text-sm text-gray-500 mb-6">For {selectedAnimal.tagId} ({selectedAnimal.breed})</p>
            
            <form onSubmit={handleLogMedicalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                <select value={medicalForm.type} onChange={e => setMedicalForm({...medicalForm, type: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50">
                  <option value="Vaccine">Vaccine (Injection)</option>
                  <option value="Treatment">Medical Treatment</option>
                  <option value="Vitamin">Vitamin / Supplement</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name / Details</label>
                <input required type="text" value={medicalForm.name} onChange={e => setMedicalForm({...medicalForm, name: e.target.value})} placeholder="e.g. FMD Vaccine" className="w-full p-2 border rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={medicalForm.date} onChange={e => setMedicalForm({...medicalForm, date: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea value={medicalForm.notes} onChange={e => setMedicalForm({...medicalForm, notes: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50" rows="2"></textarea>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowMedicalModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedAnimal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">History: {selectedAnimal.tagId}</h2>
                <p className="text-sm text-gray-500">{selectedAnimal.category} • {selectedAnimal.breed}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
            </div>
            
            {historyLoading ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500 mx-auto"></div></div>
            ) : (
              <div className="space-y-8">
                
                {/* AI Health Evaluation */}
                <div>
                  <div className="flex justify-between items-center border-b pb-2 mb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <FaLeaf className="mr-2 text-green-600"/> {t('livestock.ai_viability', 'AI Health & Viability Evaluation')}
                    </h3>
                    <button 
                      onClick={runAIEvaluation}
                      disabled={evaluating}
                      className={`px-3 py-1 rounded text-sm font-bold text-white transition-colors ${evaluating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {evaluating ? t('livestock.analyzing', 'Analyzing...') : (selectedAnimal.aiHealthEvaluation?.lastEvaluated ? t('livestock.reevaluate', 'Re-evaluate') : t('livestock.run_evaluation', 'Run AI Evaluation'))}
                    </button>
                  </div>
                  
                  {selectedAnimal.aiHealthEvaluation?.lastEvaluated ? (
                    <div className={`p-4 rounded-xl border ${
                      selectedAnimal.aiHealthEvaluation.recommendation === 'Keep' ? 'bg-green-50 border-green-200' :
                      selectedAnimal.aiHealthEvaluation.recommendation === 'Sell/Cull' ? 'bg-red-50 border-red-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm text-gray-500 uppercase tracking-wide">{t('livestock.recommendation', 'AI Recommendation')}</div>
                          <div className={`text-2xl font-bold ${
                            selectedAnimal.aiHealthEvaluation.recommendation === 'Keep' ? 'text-green-800' :
                            selectedAnimal.aiHealthEvaluation.recommendation === 'Sell/Cull' ? 'text-red-800' :
                            'text-yellow-800'
                          }`}>
                            {selectedAnimal.aiHealthEvaluation.recommendation}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 uppercase tracking-wide">{t('livestock.health_score', 'Health Score')}</div>
                          <div className="text-2xl font-bold text-gray-800">{selectedAnimal.aiHealthEvaluation.healthScore}/100</div>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-2">{selectedAnimal.aiHealthEvaluation.reasoning}</p>
                      <p className="text-xs text-gray-400 mt-3 text-right">{t('livestock.last_evaluated', 'Last evaluated:')} {new Date(selectedAnimal.aiHealthEvaluation.lastEvaluated).toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">{t('livestock.no_eval_yet', 'No AI evaluation has been run for this animal yet. Click the button to analyze its medical history.')}</p>
                  )}
                </div>

                {/* Medical History */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center border-b pb-2"><FaStethoscope className="mr-2 text-green-600"/> Medical & Injection History</h3>
                  {animalHistory.medical.length === 0 ? (
                    <p className="text-gray-500 text-sm">No medical records found.</p>
                  ) : (
                    <ul className="space-y-3">
                      {animalHistory.medical.map(med => (
                        <li key={med._id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-800">{med.name} <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">{med.type}</span></span>
                            <span className="text-sm text-gray-500">{new Date(med.date).toLocaleDateString()}</span>
                          </div>
                          {med.notes && <p className="text-sm text-gray-600 mt-1">{med.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Breeding History */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center border-b pb-2"><FaBabyCarriage className="mr-2 text-purple-600"/> Breeding History</h3>
                  {animalHistory.breeding.length === 0 ? (
                    <p className="text-gray-500 text-sm">No breeding records found.</p>
                  ) : (
                    <ul className="space-y-3">
                      {animalHistory.breeding.map(breed => (
                        <li key={breed._id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-800">{breed.eventType}</span>
                            <span className="text-sm text-gray-500">{new Date(breed.eventDate).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Outcome: <span className="font-medium text-purple-700">{breed.outcome}</span></div>
                          {breed.actualDeliveryDate && <div className="text-sm text-gray-600">Delivered on: {new Date(breed.actualDeliveryDate).toLocaleDateString()}</div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LivestockDashboard;
