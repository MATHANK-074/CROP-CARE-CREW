import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaPaw as FaCow, FaFire, FaExclamationTriangle, 
  FaBabyCarriage, FaStethoscope, FaChartBar, FaCalendarAlt
} from 'react-icons/fa';
import LivestockCalendar from '../components/livestock/LivestockCalendar';

const buildApiUrl = (path) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api${path}`;

const ReproductiveDashboard = () => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCow, setSelectedCow] = useState(null);
  const [showCowModal, setShowCowModal] = useState(false);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/reproductive/insights'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (err) {
      console.error('Error fetching insights', err);
    } finally {
      setLoading(false);
    }
  };

  const openCowDetails = (cowData) => {
    setSelectedCow(cowData);
    setShowCowModal(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div></div>;
  }

  if (!insights) return <div className="p-8">{t('reproductive_ai.failed_to_load', 'Failed to load insights.')}</div>;

  const { summaryStats, cowInsights, calendarEvents } = insights;

  // Derived lists for sections
  const possibleHeatCows = cowInsights.filter(c => c.status === 'Possible Heat');
  const pregnancyPendingCows = cowInsights.filter(c => c.status === 'Pregnancy Confirmation Pending');
  const followUpCows = cowInsights.filter(c => c.status === 'Repeated Conception Failure');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaCow className="mr-3 text-purple-600" />
          {t('reproductive_ai.title', 'AI Reproductive Insights')}
        </h1>
        <p className="text-gray-500 mt-2">{t('reproductive_ai.subtitle', 'Smart monitoring for breeding, heat prediction, and gestation.')}</p>
      </div>

      {/* 1. Summary Cards (Herd Directory Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <div 
          onClick={() => setFilterType('All')}
          className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'All' ? 'border-gray-500 ring-2 ring-gray-200' : 'border-gray-100'}`}
        >
          <div className="p-4 rounded-full bg-gray-100 text-gray-600 mr-4">
            <FaCow size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('reproductive_ai.stat_total_cows', 'Total Cows')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{summaryStats.totalCows}</h3>
          </div>
        </div>

        <div 
          onClick={() => setFilterType('Pregnant')}
          className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Pregnant' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'}`}
        >
          <div className="p-4 rounded-full bg-green-100 text-green-600 mr-4">
            <FaCow size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('reproductive_ai.stat_pregnant', 'Pregnant')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{summaryStats.pregnant}</h3>
          </div>
        </div>

        <div 
          onClick={() => setFilterType('Possible Heat')}
          className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Possible Heat' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-100'}`}
        >
          <div className="p-4 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <FaFire size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('reproductive_ai.stat_possible_heat', 'Possible Heat')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{summaryStats.possibleHeat}</h3>
          </div>
        </div>

        <div 
          onClick={() => setFilterType('Breeding Attention')}
          className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Breeding Attention' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-100'}`}
        >
          <div className="p-4 rounded-full bg-orange-100 text-orange-600 mr-4">
            <FaStethoscope size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('reproductive_ai.stat_breeding_attn', 'Breeding/AI Attn')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{summaryStats.breedingAttention}</h3>
          </div>
        </div>

        <div 
          onClick={() => setFilterType('Pregnancy Confirmation Pending')}
          className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Pregnancy Confirmation Pending' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'}`}
        >
          <div className="p-4 rounded-full bg-blue-100 text-blue-600 mr-4">
            <FaBabyCarriage size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('reproductive_ai.stat_preg_check_due', 'Preg Check Due')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{summaryStats.pregnancyCheckDue}</h3>
          </div>
        </div>

        <div 
          onClick={() => setFilterType('Not Pregnant')}
          className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Not Pregnant' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-100'}`}
        >
          <div className="p-4 rounded-full bg-red-100 text-red-600 mr-4">
            <FaExclamationTriangle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('reproductive_ai.stat_not_pregnant', 'Not Pregnant')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{summaryStats.notPregnant}</h3>
          </div>
        </div>

        <div 
          onClick={() => setFilterType('Repeated Conception Failure')}
          className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md flex items-center ${filterType === 'Repeated Conception Failure' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-100'}`}
        >
          <div className="p-4 rounded-full bg-purple-100 text-purple-600 mr-4">
            <FaExclamationTriangle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('reproductive_ai.stat_conception_fail', 'Conception Fail')}</p>
            <h3 className="text-2xl font-bold text-gray-800">{summaryStats.repeatedFailure}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {filterType !== 'All' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center">
                <h2 className="text-xl font-bold text-gray-800">{filterType} List</h2>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="p-4 font-semibold">{t('reproductive_ai.cow_id', 'Cow ID')}</th>
                    <th className="p-4 font-semibold">{t('reproductive_ai.table_status', 'Status')}</th>
                    <th className="p-4 font-semibold">{t('reproductive_ai.action', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cowInsights.filter(c => c.status === filterType).length === 0 ? (
                    <tr><td colSpan="3" className="p-6 text-center text-gray-500">No cows found in this category.</td></tr>
                  ) : (
                    cowInsights.filter(c => c.status === filterType).map(cowData => (
                      <tr key={cowData.cow._id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => openCowDetails(cowData)}>
                        <td className="p-4 font-bold text-gray-800">{cowData.cow.tagId}</td>
                        <td className="p-4"><span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{t(`reproductive_ai.status_${cowData.status.replace(/[^a-zA-Z]/g, '')}`, cowData.status)}</span></td>
                        <td className="p-4 text-sm text-gray-600 font-medium">{t(`reproductive_ai.action_${cowData.action.replace(/[^a-zA-Z]/g, '')}`, cowData.action)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              {/* 2. AI Heat Prediction */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaFire className="text-red-500 mr-2" /> {t('reproductive_ai.heat_prediction_title', 'AI Heat Prediction')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {possibleHeatCows.length === 0 ? (
                <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-100 text-gray-500 text-center">{t('reproductive_ai.no_heat', 'No cows currently predicted for heat.')}</div>
              ) : (
                possibleHeatCows.map(cowData => (
                  <div key={cowData.cow._id} className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden cursor-pointer hover:shadow-md transition" onClick={() => openCowDetails(cowData)}>
                    <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex justify-between items-center">
                      <span className="font-bold text-red-800">{t('reproductive_ai.cow', 'Cow')} {cowData.cow.tagId}</span>
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">🔥 {t('reproductive_ai.possible_heat_badge', 'Possible Heat')}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-end mb-4">
                        <div className="text-sm text-gray-500">{t('reproductive_ai.heat_prob', 'Heat Probability')}</div>
                        <div className="text-3xl font-bold text-red-600">{cowData.heatProbability}%</div>
                      </div>
                      <div className="text-sm bg-gray-50 p-3 rounded-lg text-gray-700">
                        <span className="font-semibold block mb-1">{t('reproductive_ai.recommendation', 'Recommendation:')}</span>
                        {t(`reproductive_ai.action_${cowData.action.replace(/[^a-zA-Z]/g, '')}`, cowData.action)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 5. Pregnancy Monitoring */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaStethoscope className="text-blue-500 mr-2" /> {t('reproductive_ai.preg_monitoring_title', 'Pregnancy Monitoring')}
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="p-4 font-semibold">{t('reproductive_ai.cow_id', 'Cow ID')}</th>
                    <th className="p-4 font-semibold">{t('reproductive_ai.last_ai_date', 'Last AI Date')}</th>
                    <th className="p-4 font-semibold">{t('reproductive_ai.table_status', 'Status')}</th>
                    <th className="p-4 font-semibold">{t('reproductive_ai.action', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pregnancyPendingCows.length === 0 ? (
                    <tr><td colSpan="4" className="p-6 text-center text-gray-500">{t('reproductive_ai.no_preg_checks', 'No pregnancy checks pending.')}</td></tr>
                  ) : (
                    pregnancyPendingCows.map(cowData => (
                      <tr key={cowData.cow._id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => openCowDetails(cowData)}>
                        <td className="p-4 font-bold text-gray-800">{cowData.cow.tagId}</td>
                        <td className="p-4 text-gray-600">{cowData.latestRecord?.eventDate ? new Date(cowData.latestRecord.eventDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-4"><span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">🟠 {t('reproductive_ai.confirmation_pending', 'Confirmation Pending')}</span></td>
                        <td className="p-4 text-sm text-blue-600 font-medium">{t(`reproductive_ai.action_${cowData.action.replace(/[^a-zA-Z]/g, '')}`, cowData.action)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Repeated Conception Failure */}
          {followUpCows.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaExclamationTriangle className="text-purple-500 mr-2" /> {t('reproductive_ai.high_priority_title', 'High Priority Alerts')}
              </h2>
              <div className="space-y-4">
                {followUpCows.map(cowData => (
                  <div key={cowData.cow._id} className="bg-white rounded-xl shadow-sm border border-purple-200 flex items-center p-4 cursor-pointer hover:shadow-md" onClick={() => openCowDetails(cowData)}>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex justify-center items-center mr-4 text-purple-600 flex-shrink-0">
                      <FaExclamationTriangle size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{t('reproductive_ai.cow', 'Cow')} {cowData.cow.tagId} - 🔴 {t('reproductive_ai.repeated_conception_failure', 'Repeated Conception Failure')}</h3>
                      <p className="text-sm text-gray-600 mt-1">{t('reproductive_ai.ai_attempts_msg', '{{attempts}} unsuccessful AI attempts.', { attempts: cowData.aiAttempts })}</p>
                      <p className="text-sm text-purple-700 font-medium mt-1">{t(`reproductive_ai.action_${cowData.action.replace(/[^a-zA-Z]/g, '')}`, cowData.action)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
          )}

        </div>

        {/* Right Column: Calendar & Status Board */}
        <div className="space-y-8">
          
          {/* 9. Reproductive Calendar */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FaCalendarAlt className="text-indigo-500 mr-2" /> {t('reproductive_ai.calendar_title', 'Reproductive Calendar')}
            </h2>
            {/* Using the Calendar component built earlier, wrapping events for it */}
            <LivestockCalendar alerts={{
              medical: calendarEvents.filter(e => e.type === 'pregnancy_check' || e.type === 'calving').map(e => ({ expectedDeliveryDate: e.date, livestock: { tagId: e.cowTag }, type: e.type })),
              heatChecks: calendarEvents.filter(e => e.type === 'heat').map(e => ({ nextHeatPredictionDate: e.date, livestock: { tagId: e.cowTag } }))
            }} />
          </div>
          
          {/* 8. Cow Status Overview (Visual Status Board) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FaChartBar className="text-gray-400 mr-2" /> {t('reproductive_ai.status_board_title', 'Reproductive Status')}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-gray-600 flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> {t('reproductive_ai.stat_pregnant', 'Pregnant')}</span><span className="font-bold">{summaryStats.pregnant}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600 flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span> {t('reproductive_ai.stat_possible_heat', 'Possible Heat')}</span><span className="font-bold">{summaryStats.possibleHeat}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600 flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> {t('reproductive_ai.stat_breeding_eval', 'Breeding Evaluation')}</span><span className="font-bold">{summaryStats.breedingAttention}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600 flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span> {t('reproductive_ai.stat_preg_pending', 'Pregnancy Pending')}</span><span className="font-bold">{summaryStats.pregnancyCheckDue}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600 flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> {t('reproductive_ai.stat_not_pregnant', 'Not Pregnant')}</span><span className="font-bold">{summaryStats.notPregnant}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600 flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span> {t('reproductive_ai.stat_conception_fail', 'Conception Failure')}</span><span className="font-bold">{summaryStats.repeatedFailure}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-600 flex items-center"><span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span> {t('reproductive_ai.stat_insufficient_data', 'Insufficient Data')}</span><span className="font-bold">{summaryStats.insufficientData}</span></div>
            </div>
            
            {/* Simple CSS Bar Chart representation */}
            <div className="mt-6 w-full h-4 rounded-full flex overflow-hidden">
              {summaryStats.totalCows > 0 && (
                <>
                  <div style={{ width: `${(summaryStats.pregnant/summaryStats.totalCows)*100}%` }} className="bg-green-500 h-full" title={t('reproductive_ai.stat_pregnant', 'Pregnant')}></div>
                  <div style={{ width: `${(summaryStats.possibleHeat/summaryStats.totalCows)*100}%` }} className="bg-yellow-400 h-full" title={t('reproductive_ai.stat_possible_heat', 'Possible Heat')}></div>
                  <div style={{ width: `${(summaryStats.pregnancyCheckDue/summaryStats.totalCows)*100}%` }} className="bg-orange-500 h-full" title={t('reproductive_ai.stat_preg_pending', 'Pending')}></div>
                  <div style={{ width: `${(summaryStats.notPregnant/summaryStats.totalCows)*100}%` }} className="bg-red-500 h-full" title={t('reproductive_ai.stat_not_pregnant', 'Not Pregnant')}></div>
                  <div style={{ width: `${(summaryStats.repeatedFailure/summaryStats.totalCows)*100}%` }} className="bg-purple-500 h-full" title={t('reproductive_ai.stat_conception_fail', 'Failure')}></div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 11. Individual Cow Dashboard (Modal) */}
      {showCowModal && selectedCow && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-0 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-800 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <FaCow className="mr-3 text-gray-400"/> {t('reproductive_ai.cow', 'Cow')} {selectedCow.cow.tagId}
                </h2>
                <div className="text-gray-300 text-sm mt-1">{t('reproductive_ai.modal_ai_status', 'Current AI Status:')} {t(`reproductive_ai.status_${selectedCow.status.replace(/[^a-zA-Z]/g, '')}`, selectedCow.status)}</div>
              </div>
              <button onClick={() => setShowCowModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              
              {selectedCow.status === 'Insufficient Data' ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⚪</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{t('reproductive_ai.stat_insufficient_data', 'Insufficient Data')}</h3>
                  <p className="text-gray-500">{t('reproductive_ai.modal_prediction_unavailable', 'AI prediction unavailable.')}</p>
                  <p className="text-sm text-gray-400 mt-2">{t('reproductive_ai.modal_reason_insufficient', 'Reason: More reproductive records are required for reliable prediction.')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* AI Prediction Box */}
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-blue-900">{t('reproductive_ai.modal_ai_prediction', 'AI Prediction')}</h3>
                      {selectedCow.heatProbability > 0 && (
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">{t('reproductive_ai.heat_prob', 'Heat Probability')}: {selectedCow.heatProbability}%</div>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm"><span className="font-semibold">{t('reproductive_ai.recommendation', 'Recommended Action:')}</span> {t(`reproductive_ai.action_${selectedCow.action.replace(/[^a-zA-Z]/g, '')}`, selectedCow.action)}</p>
                  </div>

                  {/* Reproductive History Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-100 p-4 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">{t('reproductive_ai.modal_last_heat', 'Last Heat')}</div>
                      <div className="font-bold text-gray-800">{selectedCow.lastHeat ? new Date(selectedCow.lastHeat).toLocaleDateString() : t('reproductive_ai.modal_unknown', 'Unknown')}</div>
                    </div>
                    <div className="border border-gray-100 p-4 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">{t('reproductive_ai.modal_ai_attempts', 'AI Attempts (Consecutive)')}</div>
                      <div className="font-bold text-gray-800">{selectedCow.aiAttempts}</div>
                    </div>
                  </div>

                  {/* Timeline Concept */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{t('reproductive_ai.modal_timeline', 'Reproductive Timeline')}</h3>
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
                      
                      {selectedCow.latestRecord && (
                        <div className="relative pl-6">
                          <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                          <div className="font-bold text-gray-800">{t(`reproductive_ai.event_${selectedCow.latestRecord.eventType.replace(/[^a-zA-Z]/g, '')}`, selectedCow.latestRecord.eventType)}</div>
                          <div className="text-xs text-gray-500">{new Date(selectedCow.latestRecord.eventDate).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-600 mt-1">{t('reproductive_ai.modal_outcome', 'Outcome:')} {t(`reproductive_ai.outcome_${selectedCow.latestRecord.outcome.replace(/[^a-zA-Z]/g, '')}`, selectedCow.latestRecord.outcome)}</div>
                        </div>
                      )}
                      
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"></div>
                        <div className="font-bold text-gray-800">{t('reproductive_ai.modal_current_assessment', 'Current AI Assessment')}</div>
                        <div className="text-sm text-gray-600 mt-1">{t(`reproductive_ai.status_${selectedCow.status.replace(/[^a-zA-Z]/g, '')}`, selectedCow.status)}</div>
                      </div>
                      
                      <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                        <div className="font-bold text-gray-800">{t('reproductive_ai.modal_next_step', 'Next Recommended Step')}</div>
                        <div className="text-sm text-gray-600 mt-1">{t(`reproductive_ai.action_${selectedCow.action.replace(/[^a-zA-Z]/g, '')}`, selectedCow.action)}</div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReproductiveDashboard;
