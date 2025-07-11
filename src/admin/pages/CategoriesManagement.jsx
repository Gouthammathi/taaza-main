import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch,
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
  const [expandedCategories, setExpandedCategories] = useState(new Set());
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

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowAddModal(true);
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(c => c.id !== categoryId));
    }
  };

  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    if (!activeCategory) return;
    let updatedSubcategories = [...(activeCategory.subcategories || [])];
    if (subcategoryEditIndex !== null) {
      updatedSubcategories[subcategoryEditIndex] = subcategoryForm;
    } else {
      updatedSubcategories.push(subcategoryForm);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600 mt-2">Manage product categories and subcategories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <MdAdd className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                >
                  <MdEdit className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                >
                  <MdDelete className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <span className="text-sm text-gray-500">{category.productCount} products</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-0.5">Whole Quantity: {category.wholeQuantity ?? 0} kg</span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">Key: {category.key}</p>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span>Subcategories ({category.subcategories.length})</span>
                  <button
                    onClick={() => openSubcategoryModal(category)}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                  >
                    + Add Subcategory
                </button>
                </div>
                <ul className="space-y-2">
                  {category.subcategories.map((sub, idx) => (
                    <li key={sub.key} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <span>{sub.name}</span>
                      <div>
                        <button onClick={() => openSubcategoryModal(category, sub, idx)} className="text-blue-600 px-2">Edit</button>
                        <button onClick={() => handleDeleteSubcategory(category, idx)} className="text-red-600 px-2">Delete</button>
                      </div>
                    </li>
                    ))}
                </ul>
              </div>
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
          className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors duration-200 min-h-[220px] h-full w-full p-8 cursor-pointer"
          style={{ minHeight: '220px' }}
        >
          <span className="text-5xl text-blue-500 mb-2"><MdAdd /></span>
          <span className="text-lg font-semibold text-blue-600">Add Category</span>
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({...formData, key: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., chicken"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Whole Quantity (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.wholeQuantity || 0}
                  onChange={e => setFormData({ ...formData, wholeQuantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter available quantity in kg"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
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
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {subcategoryEditIndex !== null ? 'Edit Subcategory' : 'Add Subcategory'}
            </h3>
            <form onSubmit={handleSubcategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Name</label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={e => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Key</label>
                <input
                  type="text"
                  value={subcategoryForm.key}
                  onChange={e => setSubcategoryForm({ ...subcategoryForm, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                <input
                  type="url"
                  value={subcategoryForm.image}
                  onChange={e => setSubcategoryForm({ ...subcategoryForm, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubcategoryModal(false);
                    setSubcategoryForm({ name: '', key: '', image: '', });
                    setSubcategoryEditIndex(null);
                    setActiveCategory(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {subcategoryEditIndex !== null ? 'Update' : 'Add'} Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement; 