import React, { useState, useEffect } from 'react';
import { getDailyStock, setDailyStock, updateDailyStock, getStockHistory } from '../../services/firebaseService';

const STOCK_ITEMS = [
  { key: 'birds', label: 'Birds' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'bEggs', label: 'B.Eggs' },
  { key: 'goats', label: 'Goats' },
];

function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

const Analytics = () => {
  const [todayStock, setTodayStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ birds: '', eggs: '', bEggs: '', goats: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const todayStr = getTodayStr();

  // Fetch stock for selected date and history
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [selectedStock, hist] = await Promise.all([
        getDailyStock(selectedDate),
        getStockHistory(30),
      ]);
      setTodayStock(selectedStock);
      setHistory(hist.sort((a, b) => b.id.localeCompare(a.id)));
      if (selectedStock) {
        setForm({
          birds: selectedStock.birds?.open ?? '',
          eggs: selectedStock.eggs?.open ?? '',
          bEggs: selectedStock.bEggs?.open ?? '',
          goats: selectedStock.goats?.open ?? '',
        });
      } else {
        setForm({ birds: '', eggs: '', bEggs: '', goats: '' });
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedDate]);

  // Calculate sales and closing for a day
  const calcSold = (item) => {
    if (!item) return 0;
    return (Number(item.open) || 0) - (Number(item.close) || 0);
  };

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit today's stock
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // If yesterday exists, carry over closing as today's opening if field is empty
    let prevDay = history.find(h => h.id < selectedDate);
    let stockData = {};
    STOCK_ITEMS.forEach(item => {
      let open = form[item.key] !== '' ? Number(form[item.key]) : (prevDay?.[item.key]?.close ?? 0);
      stockData[item.key] = { open, sold: 0, close: open };
    });
    await setDailyStock(selectedDate, { date: selectedDate, ...stockData });
    setEditMode(false);
    setSubmitting(false);
    // Refetch
    const today = await getDailyStock(selectedDate);
    setTodayStock(today);
    setForm({
      birds: today.birds?.open ?? '',
      eggs: today.eggs?.open ?? '',
      bEggs: today.bEggs?.open ?? '',
      goats: today.goats?.open ?? '',
    });
    // Optionally refetch history
    const hist = await getStockHistory(30);
    setHistory(hist.sort((a, b) => b.id.localeCompare(a.id)));
  };

  // Edit today's stock
  const handleEdit = () => {
    setEditMode(true);
  };

  // Save edited stock
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let stockData = {};
    STOCK_ITEMS.forEach(item => {
      let open = form[item.key] !== '' ? Number(form[item.key]) : 0;
      // Keep sold/close as before if exists
      stockData[item.key] = {
        open,
        sold: todayStock[item.key]?.sold ?? 0,
        close: todayStock[item.key]?.close ?? open,
      };
    });
    await updateDailyStock(selectedDate, { date: selectedDate, ...stockData });
    setEditMode(false);
    setSubmitting(false);
    const today = await getDailyStock(selectedDate);
    setTodayStock(today);
    setForm({
      birds: today.birds?.open ?? '',
      eggs: today.eggs?.open ?? '',
      bEggs: today.bEggs?.open ?? '',
      goats: today.goats?.open ?? '',
    });
    const hist = await getStockHistory(30);
    setHistory(hist.sort((a, b) => b.id.localeCompare(a.id)));
  };

  // Only allow editing if selected date is today
  const canEdit = selectedDate === todayStr;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Daily Stock Management</h1>
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-700">Stock Entry</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setEditMode(false); }}
                max={todayStr}
                className="ml-2 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            {todayStock && !editMode && canEdit && (
              <button onClick={() => setEditMode(true)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
            )}
          </div>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (!todayStock || editMode) ? (
            <form onSubmit={editMode ? handleSaveEdit : handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {STOCK_ITEMS.map(item => (
                <div key={item.key} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600 mb-1">{item.label}</label>
                  <input
                    type="number"
                    name={item.key}
                    value={form[item.key]}
                    onChange={handleChange}
                    min={0}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!canEdit}
                  />
                </div>
              ))}
              <div className="md:col-span-4 flex items-center gap-3 mt-2">
                {canEdit && (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                    disabled={submitting}
                  >
                    {editMode ? 'Save' : 'Submit'}
                  </button>
                )}
                {editMode && canEdit && (
                  <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                )}
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {STOCK_ITEMS.map(item => (
                <div key={item.key} className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600 mb-1">{item.label}</span>
                  <span className="text-lg font-bold text-gray-900">{todayStock[item.key]?.open ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Stock History (Last 30 Days)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Date</th>
                {STOCK_ITEMS.map(item => (
                  <th key={item.key} className="px-3 py-2 text-center font-semibold text-gray-500">{item.label} (Open/Sold/Close)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(day => (
                <tr key={day.id} className="border-b last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-700">{day.date}</td>
                  {STOCK_ITEMS.map(item => (
                    <td key={item.key} className="px-3 py-2 text-center">
                      <span className="inline-block min-w-[80px]">
                        {day[item.key]?.open ?? 0} / {calcSold(day[item.key])} / {day[item.key]?.close ?? 0}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-400 mt-3">Closing stock is carried over as opening stock for the next day. Sold = Open - Close.</div>
      </div>
    </div>
  );
};

export default Analytics;