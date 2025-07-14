import React, { useState, useEffect } from 'react';
import { getDailyStock, setDailyStock, updateDailyStock, getStockHistory, getOrders } from '../../services/firebaseService';

const STOCK_ITEMS = [
  { key: 'birds', label: 'Birds', hasWeight: true },
  { key: 'eggs', label: 'Eggs', hasWeight: false },
  { key: 'bEggs', label: 'B.Eggs', hasWeight: false },
  { key: 'goats', label: 'Goats', hasWeight: true },
];

function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

const Analytics = () => {
  const [todayStock, setTodayStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    birds: '', eggs: '', bEggs: '', goats: '',
    birdsWastage: '', eggsWastage: '', bEggsWastage: '', goatsWastage: '',
    birdsWeight: '', goatsWeight: '',
    birdsSale: '', eggsSale: '', bEggsSale: '', goatsSale: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const todayStr = getTodayStr();
  const [salesEditMode, setSalesEditMode] = useState(false);
  const [salesSubmitting, setSalesSubmitting] = useState(false);
  const [salesForm, setSalesForm] = useState({
    birdsSale: '', eggsSale: '', bEggsSale: '', goatsSale: ''
  });
  const [aggregateStock, setAggregateStock] = useState(null);
  const [aggregateSales, setAggregateSales] = useState(null);
  const [aggregateAvailable, setAggregateAvailable] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  // Fetch aggregate stock and sales
  useEffect(() => {
    const fetchAggregates = async () => {
      const stockHistoryData = await getStockHistory(365);
      setStockHistory(stockHistoryData);
      const ordersData = await getOrders();
      setAllOrders(ordersData);
    };
    fetchAggregates();
  }, []);

  // Calculate sales and available for all time or selected date
  useEffect(() => {
    if (!stockHistory.length) return;
    // Use all docs up to and including the selected date
    let targetDate = selectedDate;
    // If no date selected or not found, use all time
    let filteredStockDocs = stockHistory;
    if (targetDate) {
      filteredStockDocs = stockHistory.filter(doc => doc.date <= targetDate);
    }
    // Cumulative stock in (after wastage)
    const totalStockIn = { birds: 0, eggs: 0, bEggs: 0, goats: 0 };
    filteredStockDocs.forEach(doc => {
      // Birds
      if (doc.birds) {
        const open = Number(doc.birds.open) || 0;
        const weight = Number(doc.birds.weight) || 0;
        const wastage = Number(doc.birds.wastage) || 0;
        totalStockIn.birds += (open * weight) - (open * wastage);
      }
      // Eggs
      if (doc.eggs) {
        const open = Number(doc.eggs.open) || 0;
        const wastage = Number(doc.eggs.wastage) || 0;
        totalStockIn.eggs += open - wastage;
      }
      // B.Eggs
      if (doc.bEggs) {
        const open = Number(doc.bEggs.open) || 0;
        const wastage = Number(doc.bEggs.wastage) || 0;
        totalStockIn.bEggs += open - wastage;
      }
      // Goats
      if (doc.goats) {
        const open = Number(doc.goats.open) || 0;
        const weight = Number(doc.goats.weight) || 0;
        const wastage = Number(doc.goats.wastage) || 0;
        totalStockIn.goats += (open * weight) - (open * wastage);
      }
    });
    // Aggregate sales up to and including the selected date
    const totalSold = { birds: 0, eggs: 0, bEggs: 0, goats: 0 };
    allOrders.forEach(order => {
      // Only include orders up to the selected date
      const orderDate = order.createdAt instanceof Date ? order.createdAt : (order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt));
      if (!targetDate || (orderDate && orderDate.toISOString().slice(0, 10) <= targetDate)) {
        (order.items || order.products || []).forEach(item => {
          const name = item.name?.toLowerCase() || '';
          const category = (item.category || '').toLowerCase();
          if (category === 'birds' || name.includes('bird') || name.includes('chicken')) {
            totalSold.birds += item.weight ? Number(item.weight) : (Number(item.qty) || 0);
          } else if ((category === 'eggs' || (name.includes('egg') && !name.includes('b.egg') && !name.includes('b egg') && !name.includes('begg'))) ) {
            totalSold.eggs += Number(item.qty) || 0;
          } else if (category === 'beggs' || name.includes('b.egg') || name.includes('b egg') || name.includes('begg')) {
            totalSold.bEggs += Number(item.qty) || 0;
          } else if (category === 'goats' || name.includes('goat') || name.includes('mutton')) {
            totalSold.goats += item.weight ? Number(item.weight) : (Number(item.qty) || 0);
          }
        });
      }
    });
    // Calculate available
    const available = {
      birds: Math.max(0, totalStockIn.birds - totalSold.birds),
      eggs: Math.max(0, totalStockIn.eggs - totalSold.eggs),
      bEggs: Math.max(0, totalStockIn.bEggs - totalSold.bEggs),
      goats: Math.max(0, totalStockIn.goats - totalSold.goats),
    };
    setAggregateSales(totalSold);
    setAggregateAvailable(available);
  }, [stockHistory, allOrders, selectedDate]);

  // Fetch stock for selected date
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const selectedStock = await getDailyStock(selectedDate);
      setTodayStock(selectedStock);
      if (selectedStock) {
        setForm({
          birds: selectedStock.birds?.open ?? '',
          eggs: selectedStock.eggs?.open ?? '',
          bEggs: selectedStock.bEggs?.open ?? '',
          goats: selectedStock.goats?.open ?? '',
          birdsWastage: selectedStock.birds?.wastage ?? '',
          eggsWastage: selectedStock.eggs?.wastage ?? '',
          bEggsWastage: selectedStock.bEggs?.wastage ?? '',
          goatsWastage: selectedStock.goats?.wastage ?? '',
          birdsWeight: selectedStock.birds?.weight ?? '',
          goatsWeight: selectedStock.goats?.weight ?? '',
          birdsSale: selectedStock.birds?.sale ?? '',
          eggsSale: selectedStock.eggs?.sale ?? '',
          bEggsSale: selectedStock.bEggs?.sale ?? '',
          goatsSale: selectedStock.goats?.sale ?? ''
        });
        setSalesForm({
          birdsSale: selectedStock?.birds?.sale ?? '',
          eggsSale: selectedStock?.eggs?.sale ?? '',
          bEggsSale: selectedStock?.bEggs?.sale ?? '',
          goatsSale: selectedStock?.goats?.sale ?? ''
        });
      } else {
        setForm({ 
          birds: '', eggs: '', bEggs: '', goats: '',
          birdsWastage: '', eggsWastage: '', bEggsWastage: '', goatsWastage: '',
          birdsWeight: '', goatsWeight: '',
          birdsSale: '', eggsSale: '', bEggsSale: '', goatsSale: ''
        });
        setSalesForm({ birdsSale: '', eggsSale: '', bEggsSale: '', goatsSale: '' });
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedDate]);

  // Calculate sales and closing for a day
  const calcSold = (item) => {
    if (!item) return 0;
    return (Number(item.open) || 0) - (Number(item.close) || 0) - (Number(item.wastage) || 0);
  };

  // Calculate total stock after wastage removal (for eggs, bEggs)
  const calcTotalStock = (item) => {
    if (!item) return 0;
    const open = Number(item.open) || 0;
    const wastage = Number(item.wastage) || 0;
    return Math.max(0, open - wastage);
  };

  // Calculate total stock in kgs for weight-based items (birds, goats)
  // Formula: (In * Avg Weight per unit) - (In * Wastage per unit in kgs)
  const calcTotalStockKgs = (item) => {
    if (!item) return 0;
    const open = Number(item.open) || 0;
    const weight = Number(item.weight) || 0;
    const wastage = Number(item.wastage) || 0;
    return Math.max(0, (open * weight) - (open * wastage));
  };

  // Calculate available stock after sales and wastage
  const calcAvailableStock = (item, formVals) => {
    if (!item) return 0;
    const open = Number(formVals[item.key]) || 0;
    const wastage = Number(formVals[`${item.key}Wastage`]) || 0;
    const sale = Number(formVals[`${item.key}Sale`]) || 0;
    if (item.hasWeight) {
      const weight = Number(formVals[`${item.key}Weight`]) || 0;
      return Math.max(0, (open * weight) - (open * wastage) - sale);
    } else {
      return Math.max(0, open - wastage - sale);
    }
  };

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit today's stock
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let stockData = {};
    STOCK_ITEMS.forEach(item => {
      let open = form[item.key] !== '' ? Number(form[item.key]) : 0;
      let wastage = form[`${item.key}Wastage`] !== '' ? Number(form[`${item.key}Wastage`]) : 0;
      let weight = item.hasWeight && form[`${item.key}Weight`] !== '' ? Number(form[`${item.key}Weight`]) : 0;
      let sale = form[`${item.key}Sale`] !== '' ? Number(form[`${item.key}Sale`]) : 0;
      stockData[item.key] = { 
        open, 
        sold: sale, 
        close: open, // can be updated if needed
        wastage,
        ...(item.hasWeight && { weight }),
        sale
      };
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
      birdsWastage: today.birds?.wastage ?? '',
      eggsWastage: today.eggs?.wastage ?? '',
      bEggsWastage: today.bEggs?.wastage ?? '',
      goatsWastage: today.goats?.wastage ?? '',
      birdsWeight: today.birds?.weight ?? '',
      goatsWeight: today.goats?.weight ?? '',
      birdsSale: today.birds?.sale ?? '',
      eggsSale: today.eggs?.sale ?? '',
      bEggsSale: today.bEggs?.sale ?? '',
      goatsSale: today.goats?.sale ?? ''
    });
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
      let wastage = form[`${item.key}Wastage`] !== '' ? Number(form[`${item.key}Wastage`]) : 0;
      let weight = item.hasWeight && form[`${item.key}Weight`] !== '' ? Number(form[`${item.key}Weight`]) : 0;
      let sale = form[`${item.key}Sale`] !== '' ? Number(form[`${item.key}Sale`]) : 0;
      stockData[item.key] = {
        open,
        sold: sale,
        close: todayStock[item.key]?.close ?? open,
        wastage,
        ...(item.hasWeight && { weight }),
        sale
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
      birdsWastage: today.birds?.wastage ?? '',
      eggsWastage: today.eggs?.wastage ?? '',
      bEggsWastage: today.bEggs?.wastage ?? '',
      goatsWastage: today.goats?.wastage ?? '',
      birdsWeight: today.birds?.weight ?? '',
      goatsWeight: today.goats?.weight ?? '',
      birdsSale: today.birds?.sale ?? '',
      eggsSale: today.eggs?.sale ?? '',
      bEggsSale: today.bEggs?.sale ?? '',
      goatsSale: today.goats?.sale ?? ''
    });
  };

  // Handle sales form input
  const handleSalesChange = (e) => {
    setSalesForm({ ...salesForm, [e.target.name]: e.target.value });
  };
  const handleSalesSave = async (e) => {
    e.preventDefault();
    setSalesSubmitting(true);
    // Only update sales fields for the selected date
    let salesUpdate = {};
    STOCK_ITEMS.forEach(item => {
      salesUpdate[item.key] = {
        ...(todayStock?.[item.key] || {}),
        sale: salesForm[`${item.key}Sale`] !== '' ? Number(salesForm[`${item.key}Sale`]) : 0
      };
    });
    await updateDailyStock(selectedDate, { date: selectedDate, ...salesUpdate });
    setSalesEditMode(false);
    setSalesSubmitting(false);
    // Refetch
    const today = await getDailyStock(selectedDate);
    setTodayStock(today);
    setForm({
      birds: today.birds?.open ?? '',
      eggs: today.eggs?.open ?? '',
      bEggs: today.bEggs?.open ?? '',
      goats: today.goats?.open ?? '',
      birdsWastage: today.birds?.wastage ?? '',
      eggsWastage: today.eggs?.wastage ?? '',
      bEggsWastage: today.bEggs?.wastage ?? '',
      goatsWastage: today.goats?.wastage ?? '',
      birdsWeight: today.birds?.weight ?? '',
      goatsWeight: today.goats?.weight ?? '',
      birdsSale: today.birds?.sale ?? '',
      eggsSale: today.eggs?.sale ?? '',
      bEggsSale: today.bEggs?.sale ?? '',
      goatsSale: today.goats?.sale ?? ''
    });
    setSalesForm({
      birdsSale: today.birds?.sale ?? '',
      eggsSale: today.eggs?.sale ?? '',
      bEggsSale: today.bEggs?.sale ?? '',
      goatsSale: today.goats?.sale ?? ''
    });
  };
  const handleSalesCancel = () => {
    setSalesEditMode(false);
    setSalesForm({
      birdsSale: todayStock?.birds?.sale ?? '',
      eggsSale: todayStock?.eggs?.sale ?? '',
      bEggsSale: todayStock?.bEggs?.sale ?? '',
      goatsSale: todayStock?.goats?.sale ?? ''
    });
  };

  // Editing is allowed for any date

  return (
    <div className="max-w-6xl mx-auto py-8">
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
            {todayStock && !editMode && (
              <button onClick={() => setEditMode(true)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
            )}
      </div>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (!todayStock && !editMode) ? (
            <div className="text-gray-500">No stock entry for this date. You can add a new entry.</div>
          ) : (!todayStock || editMode) ? (
            <form onSubmit={editMode ? handleSaveEdit : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STOCK_ITEMS.map(item => (
                  <div key={item.key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1">{item.label} (In)</label>
                    <input
                      type="number"
                      name={item.key}
                      value={form[item.key]}
                      onChange={handleChange}
                      min={0}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <label className="text-sm font-medium text-gray-600 mb-1 mt-2">{item.label} (Wastage{item.hasWeight ? ' per unit in kgs' : ' in number'})</label>
                    <input
                      type="number"
                      name={`${item.key}Wastage`}
                      value={form[`${item.key}Wastage`]}
                      onChange={handleChange}
                      min={0}
                      step={item.hasWeight ? 0.1 : 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {item.hasWeight && (
                      <>
                        <label className="text-sm font-medium text-gray-600 mb-1 mt-2">{item.label} (Avg Weight per unit in kgs)</label>
                        <input
                          type="number"
                          name={`${item.key}Weight`}
                          value={form[`${item.key}Weight`]}
                          onChange={handleChange}
                          min={0}
                          step={0.1}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
              {/* Total Stock Display */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STOCK_ITEMS.map(item => (
                  <div key={`${item.key}Total`} className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600 mb-1">
                      {item.label} (Total Stock{item.hasWeight ? ' in kgs' : ' in number'})
                    </span>
                    <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      {item.hasWeight 
                        ? `${calcTotalStockKgs({ 
                            open: form[item.key] || 0, 
                            wastage: form[`${item.key}Wastage`] || 0, 
                            weight: form[`${item.key}Weight`] || 0 
                          }).toFixed(1)} kgs`
                        : `${calcTotalStock({ 
                            open: form[item.key] || 0, 
                            wastage: form[`${item.key}Wastage`] || 0 
                          })} units`
                      }
                    </span>
                  </div>
                ))}
                  </div>
              <div className="flex items-center gap-3 mt-4">
                {editMode && (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                    disabled={submitting}
                  >
                    {editMode ? 'Save' : 'Submit'}
                  </button>
                )}
                {editMode && (
                  <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                )}
              </div>
            </form>
          ) : (
          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STOCK_ITEMS.map(item => (
                  <div key={item.key} className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600 mb-1">{item.label} (In)</span>
                    <span className="text-lg font-bold text-gray-900">{todayStock[item.key]?.open ?? 0}</span>
                    <span className="text-sm font-medium text-gray-600 mb-1 mt-2">{item.label} (Wastage{item.hasWeight ? ' per unit in kgs' : ' in number'})</span>
                    <span className="text-lg font-bold text-gray-900">{todayStock[item.key]?.wastage ?? 0}</span>
                    {item.hasWeight && (
                      <>
                        <span className="text-sm font-medium text-gray-600 mb-1 mt-2">{item.label} (Avg Weight per unit in kgs)</span>
                        <span className="text-lg font-bold text-gray-900">{todayStock[item.key]?.weight ?? 0}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {/* Total Stock Display */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STOCK_ITEMS.map(item => (
                  <div key={`${item.key}Total`} className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600 mb-1">
                      {item.label} (Total Stock{item.hasWeight ? ' in kgs' : ' in number'})
                    </span>
                    <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      {item.hasWeight 
                        ? `${calcTotalStockKgs(todayStock[item.key]).toFixed(1)} kgs`
                        : `${calcTotalStock(todayStock[item.key])} units`
                      }
                    </span>
                  </div>
                ))}
              </div>
          </div>
          )}
        </div>
      </div>
      {/* Sales Section - now aggregate */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Sales {selectedDate ? `(as of ${selectedDate})` : '(All Time)'}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STOCK_ITEMS.map(item => (
            <div key={item.key} className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                {item.label} Sale ({item.hasWeight ? 'kgs' : 'units'})
              </label>
              <span className="text-lg font-bold text-gray-900">{aggregateSales ? (aggregateSales[item.key] || 0) : 0}</span>
              <span className="text-xs text-gray-500 mt-1">Available: <span className="font-semibold text-blue-700">{aggregateAvailable ? (aggregateAvailable[item.key] || 0).toFixed(item.hasWeight ? 1 : 0) : 0} {item.hasWeight ? 'kgs' : 'units'}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 