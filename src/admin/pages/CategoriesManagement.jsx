import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch,
  MdMoreVert,
  MdExpandMore,
  MdExpandLess
} from 'react-icons/md';
import { addCategory, getCategories, updateCategory } from '../../services/firebaseService';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [actionMenu, setActionMenu] = useState({ open: false, categoryId: null, anchor: null });
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    image: '',
    subcategories: [],
    wholeQuantity: 0
  });
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', key: '', image: '' });
  const [subcategoryEditIndex, setSubcategoryEditIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [subActionMenu, setSubActionMenu] = useState({ open: false, categoryId: null, subIndex: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, category: null });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await addCategory({ ...formData, productCount: 0 });
      }
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error saving category:', error);
    }
    setShowAddModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      key: '',
      image: '',
      subcategories: [],
      wholeQuantity: 0
    });
  };

  // Update handleEdit to close details modal and open edit modal
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowAddModal(true);
    setDetailsModal({ open: false, category: null }); // Close details modal
    setActionMenu({ open: false, categoryId: null, anchor: null });
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(c => c.id !== categoryId));
    }
    setActionMenu({ open: false, categoryId: null, anchor: null });
  };

  const toggleExpanded = (categoryId) => {
    setExpandedCategoryId(prev => (prev === categoryId ? null : categoryId));
  };

  // Subcategory handlers
  const openSubcategoryModal = (category, sub = null, idx = null) => {
    setActiveCategory(category);
    if (sub) {
      setSubcategoryForm(sub);
      setSubcategoryEditIndex(idx);
    } else {
      setSubcategoryForm({ name: '', key: '', image: '' });
      setSubcategoryEditIndex(null);
    }
    setShowSubcategoryModal(true);
    setDetailsModal({ open: false, category: null }); // Close details modal
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    if (!activeCategory) return;
    let updatedSubcategories = [...(activeCategory.subcategories || [])];
    let sub = { ...subcategoryForm };
    if (!sub.key || sub.key.trim() === '') {
      sub.key = sub.name.toLowerCase().replace(/\s+/g, '-');
    }
    if (subcategoryEditIndex !== null) {
      updatedSubcategories[subcategoryEditIndex] = sub;
    } else {
      updatedSubcategories.push(sub);
    }
    try {
      await updateCategory(activeCategory.id, { ...activeCategory, subcategories: updatedSubcategories });
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error saving subcategory:', error);
    }
    setShowSubcategoryModal(false);
    setSubcategoryForm({ name: '', key: '', image: '' });
    setSubcategoryEditIndex(null);
    setActiveCategory(null);
  };

  const handleDeleteSubcategory = async (category, idx) => {
    const updatedSubcategories = [...(category.subcategories || [])];
    updatedSubcategories.splice(idx, 1);
    try {
      await updateCategory(category.id, { ...category, subcategories: updatedSubcategories });
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error deleting subcategory:', error);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm"
        >
          <MdAdd className="w-5 h-5 mr-1" /> Add
        </button>
      </div>
      {/* Search */}
      <div className="bg-white rounded border border-gray-200 p-2 flex items-center">
        <MdSearch className="text-gray-400 w-5 h-5 ml-2 mr-2" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-sm px-2 py-1"
        />
      </div>
      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col relative group shadow-sm hover:shadow-md transition-shadow cursor-pointer min-h-[180px]"
            onClick={e => {
              if (e.target.closest('.cat-kebab')) return;
              setDetailsModal({ open: true, category });
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-14 h-14 object-cover rounded-full border border-gray-200 bg-gray-50 shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">{category.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-yellow-50 text-yellow-700 rounded-full px-2 py-0.5 font-medium">Qty: {category.wholeQuantity ?? 0} kg</span>
                    <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-medium">{category.subcategories.length} subcategories</span>
                  </div>
                </div>
              </div>
              <button
                className="cat-kebab p-2 rounded-full hover:bg-gray-100 ml-2"
                onClick={e => {
                  e.stopPropagation();
                  setActionMenu({ open: actionMenu.categoryId !== category.id || !actionMenu.open, categoryId: category.id, anchor: e.currentTarget });
                }}
                aria-label="Actions"
              >
                <MdMoreVert className="w-6 h-6 text-gray-400" />
              </button>
              {actionMenu.open && actionMenu.categoryId === category.id && (
                <div className="absolute right-5 top-16 z-10 bg-white border border-gray-200 rounded-xl shadow-lg w-36">
                  <button onClick={() => handleEdit(category)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Edit</button>
                  <button onClick={() => handleDelete(category.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Delete</button>
                </div>
              )}
            </div>
            {/* Subcategory images row */}
            <div className="flex items-center gap-2 mt-4">
              {category.subcategories.slice(0, 3).map((sub, idx) => (
                sub.image ? (
                  <img
                    key={sub.key}
                    src={sub.image}
                    alt={sub.name}
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover bg-gray-100 shadow-sm"
                    title={sub.name}
                  />
                ) : (
                  <div
                    key={sub.key}
                    className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-400 shadow-sm"
                    title={sub.name}
                  >
                    {sub.name.charAt(0)}
                  </div>
                )
              ))}
              {category.subcategories.length > 3 && (
                <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">+{category.subcategories.length - 3}</span>
              )}
            </div>
          </div>
        ))}
        {/* Add Category Card */}
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingCategory(null);
            setFormData({ name: '', key: '', image: '', subcategories: [], wholeQuantity: 0 });
          }}
          className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl min-h-[180px] h-full w-full p-8 cursor-pointer transition-all"
        >
          <span className="text-4xl text-blue-500 mb-2"><MdAdd /></span>
          <span className="text-lg font-semibold text-blue-600">Add Category</span>
        </button>
      </div>
      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm relative shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            {/* Image Preview */}
            <div className="flex flex-col items-center mb-4">
              {formData.image ? (
                <img
                  src={formData.image}
                  alt={formData.name || 'Category'}
                  className="w-20 h-20 object-cover rounded-full border-2 border-blue-200 shadow mb-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-3xl text-gray-400 shadow mb-2">
                  {(formData.name || 'C').charAt(0)}
                </div>
              )}
              <span className="text-xs text-gray-400">Image Preview</span>
            </div>
            <form onSubmit={async (e) => {
              await handleSubmit(e);
              setShowAddModal(false);
              if (editingCategory) setDetailsModal({ open: true, category: editingCategory });
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({...formData, key: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., chicken"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Paste image URL or base64 string"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Whole Quantity (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.wholeQuantity || 0}
                  onChange={e => setFormData({ ...formData, wholeQuantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Available quantity in kg"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                    setFormData({
                      name: '',
                      key: '',
                      image: '',
                      subcategories: [],
                      wholeQuantity: 0
                    });
                    if (editingCategory) setDetailsModal({ open: true, category: editingCategory });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm relative shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              {subcategoryEditIndex !== null ? 'Edit Subcategory' : 'Add Subcategory'}
            </h3>
            {/* Image Preview */}
            <div className="flex flex-col items-center mb-4">
              {subcategoryForm.image ? (
                <img
                  src={subcategoryForm.image}
                  alt={subcategoryForm.name || 'Subcategory'}
                  className="w-20 h-20 object-cover rounded-full border-2 border-blue-200 shadow mb-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-3xl text-gray-400 shadow mb-2">
                  {(subcategoryForm.name || 'S').charAt(0)}
                </div>
              )}
              <span className="text-xs text-gray-400">Image Preview</span>
            </div>
            <form onSubmit={async (e) => {
              await handleSubcategorySubmit(e);
              setShowSubcategoryModal(false);
              setDetailsModal({ open: true, category: activeCategory }); // Reopen details modal
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={e => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Image URL (optional)</label>
                <input
                  type="url"
                  value={subcategoryForm.image}
                  onChange={e => setSubcategoryForm({ ...subcategoryForm, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Paste image URL or base64 string"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubcategoryModal(false);
                    setSubcategoryForm({ name: '', key: '', image: '', });
                    setSubcategoryEditIndex(null);
                    setDetailsModal({ open: true, category: activeCategory }); // Reopen details modal
                    setActiveCategory(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  {subcategoryEditIndex !== null ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {detailsModal.open && detailsModal.category && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg relative shadow-2xl">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setDetailsModal({ open: false, category: null })}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex flex-col items-center mb-6">
              <img src={detailsModal.category.image} alt={detailsModal.category.name} className="w-20 h-20 object-cover rounded-full border-2 border-blue-200 shadow mb-2" />
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{detailsModal.category.name}</h2>
              <div className="text-xs text-gray-500 mb-1">Key: {detailsModal.category.key}</div>
              <div className="text-xs bg-yellow-50 text-yellow-700 rounded-full px-3 py-0.5 font-medium mb-2">Qty: {detailsModal.category.wholeQuantity ?? 0} kg</div>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-base font-medium text-gray-700">Subcategories</span>
              <button
                onClick={() => openSubcategoryModal(detailsModal.category)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                + Add
              </button>
            </div>
            <ul className="space-y-2 mb-6">
              {detailsModal.category.subcategories.map((sub, idx) => (
                <li key={sub.key} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2 relative">
                  <div className="flex items-center gap-2">
                    {sub.image ? (
                      <img
                        src={sub.image}
                        alt={sub.name}
                        className="w-8 h-8 rounded-full border border-gray-200 object-cover bg-gray-100 shadow-sm"
                        title={sub.name}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-400 shadow-sm"
                        title={sub.name}
                      >
                        {sub.name.charAt(0)}
                      </div>
                    )}
                    <span>{sub.name}</span>
                  </div>
                  <button
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setSubActionMenu({ open: !(subActionMenu.open && subActionMenu.categoryId === detailsModal.category.id && subActionMenu.subIndex === idx), categoryId: detailsModal.category.id, subIndex: idx })}
                    aria-label="Subcategory actions"
                  >
                    <MdMoreVert className="w-5 h-5 text-gray-400" />
                  </button>
                  {subActionMenu.open && subActionMenu.categoryId === detailsModal.category.id && subActionMenu.subIndex === idx && (
                    <div className="absolute right-2 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-28">
                      <button onClick={() => { openSubcategoryModal(detailsModal.category, sub, idx); setSubActionMenu({ open: false, categoryId: null, subIndex: null }); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50">Edit</button>
                      <button onClick={() => { handleDeleteSubcategory(detailsModal.category, idx); setSubActionMenu({ open: false, categoryId: null, subIndex: null }); }} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-50">Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleEdit(detailsModal.category)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Edit Category
              </button>
              <button
                onClick={() => handleDelete(detailsModal.category.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement; 