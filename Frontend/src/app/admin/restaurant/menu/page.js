'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api, { API_BASE_URL } from '../../../../lib/api';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Tag,
  DollarSign,
  Image as ImageIcon,
  Flame,
  Star,
  Search,
} from 'lucide-react';

export default function RestaurantMenuPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // Category Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: 0 });
  const [editingCategory, setEditingCategory] = useState(null);

  // Menu Item Modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    tags: '',
    inStock: true,
  });
  const [itemAddons, setItemAddons] = useState([]); // [{name, price}]
  const [itemVariants, setItemVariants] = useState([]); // [{size, price}]
  const [itemImageFile, setItemImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const restaurantId = user?.restaurantId?._id || user?.restaurantId;

  const fetchData = async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError('');
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get(`/categories?restaurantId=${restaurantId}`),
        api.get(`/menu-items?restaurantId=${restaurantId}`),
      ]);
      setCategories(catRes.data?.data || []);
      setMenuItems(itemRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  // Real-time Stock Toggle (PATCH /api/menu-items/:id/stock)
  const handleToggleStock = async (itemId) => {
    try {
      const res = await api.patch(`/menu-items/${itemId}/stock`);
      const newStock = res.data?.data?.inStock;
      setMenuItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, inStock: newStock } : item))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle stock status');
    }
  };

  // Category Operations
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, categoryForm);
        setSuccess('Category updated successfully');
      } else {
        await api.post('/categories', { ...categoryForm, restaurantId });
        setSuccess('Category created successfully');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', sortOrder: 0 });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${catId}`);
      setSuccess('Category deleted');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // Menu Item Operations
  const openAddItemModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      categoryId: categories[0]?._id || '',
      tags: '',
      inStock: true,
    });
    setItemAddons([]);
    setItemVariants([]);
    setItemImageFile(null);
    setImagePreview('');
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId?._id || item.categoryId,
      tags: (item.tags || []).join(', '),
      inStock: item.inStock,
    });
    setItemAddons(item.addons || []);
    setItemVariants(item.sizeVariants || []);
    setItemImageFile(null);
    setImagePreview(item.image ? (item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`) : '');
    setShowItemModal(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', itemForm.name);
      formData.append('description', itemForm.description);
      formData.append('price', itemForm.price);
      formData.append('categoryId', itemForm.categoryId);
      formData.append('inStock', itemForm.inStock);

      const parsedTags = itemForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      formData.append('tags', JSON.stringify(parsedTags));
      formData.append('addons', JSON.stringify(itemAddons));
      formData.append('sizeVariants', JSON.stringify(itemVariants));

      if (itemImageFile) {
        formData.append('image', itemImageFile);
      }

      if (editingItem) {
        await api.put(`/menu-items/${editingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Menu item updated successfully');
      } else {
        formData.append('restaurantId', restaurantId);
        await api.post('/menu-items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Menu item created successfully');
      }

      setShowItemModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/menu-items/${itemId}`);
      setSuccess('Menu item deleted');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete menu item');
    }
  };

  // Addon Helpers
  const addAddonRow = () => {
    setItemAddons([...itemAddons, { name: '', price: 0 }]);
  };
  const updateAddon = (index, field, val) => {
    const updated = [...itemAddons];
    updated[index][field] = field === 'price' ? parseFloat(val) || 0 : val;
    setItemAddons(updated);
  };
  const removeAddon = (index) => {
    setItemAddons(itemAddons.filter((_, i) => i !== index));
  };

  // Variant Helpers
  const addVariantRow = () => {
    setItemVariants([...itemVariants, { size: '', price: 0 }]);
  };
  const updateVariant = (index, field, val) => {
    const updated = [...itemVariants];
    updated[index][field] = field === 'price' ? parseFloat(val) || 0 : val;
    setItemVariants(updated);
  };
  const removeVariant = (index) => {
    setItemVariants(itemVariants.filter((_, i) => i !== index));
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCat =
      selectedCategory === 'ALL' ||
      (item.categoryId?._id || item.categoryId) === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Menu & Category Catalog</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your food items, add-on modifiers, size variants, and real-time In Stock availability
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', sortOrder: categories.length });
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Category</span>
          </button>

          <button
            onClick={openAddItemModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Category Tabs & Quick Management */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          <span>Categories ({categories.length})</span>
          <span className="text-[11px] font-normal normal-case text-slate-500">
            Click a category tab to filter menu
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Items ({menuItems.length})
          </button>

          {categories.map((cat) => {
            const count = menuItems.filter(
              (i) => (i.categoryId?._id || i.categoryId) === cat._id
            ).length;
            const isSelected = selectedCategory === cat._id;
            return (
              <div
                key={cat._id}
                className={`flex items-center gap-1 pl-3.5 pr-2 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <button onClick={() => setSelectedCategory(cat._id)}>
                  {cat.name} ({count})
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryForm({ name: cat.name, sortOrder: cat.sortOrder });
                    setShowCategoryModal(true);
                  }}
                  className="p-1 hover:text-white opacity-70 hover:opacity-100"
                  title="Edit category"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="p-1 hover:text-red-400 opacity-70 hover:opacity-100"
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu items by name or description..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Food Items Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading catalog items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80 flex flex-col items-center">
          <Layers className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Menu Items Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {categories.length === 0
              ? 'First create a category (e.g. Burgers, Pizza), then add your food items.'
              : 'Add your first food item to this category.'}
          </p>
          <button
            onClick={openAddItemModal}
            className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
          >
            Add Food Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const imageUrl = item.image
              ? item.image.startsWith('http')
                ? item.image
                : `${API_BASE_URL}${item.image}`
              : null;

            return (
              <div
                key={item._id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition space-y-4"
              >
                <div>
                  {/* Image / Thumbnail */}
                  {imageUrl ? (
                    <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-800 relative">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-xl bg-slate-950/60 border border-slate-800 mb-3 flex items-center justify-center text-slate-600 text-xs">
                      <span>No Image Uploaded</span>
                    </div>
                  )}

                  {/* Header: Title & Price */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base text-white">{item.name}</h4>
                      <p className="text-xs text-blue-400 font-medium mt-0.5">
                        {item.categoryId?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <span className="font-extrabold text-base text-emerald-400 font-mono">
                      ${item.price?.toFixed(2)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Tags */}
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Modifiers Count Summary */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{item.addons?.length || 0} Add-on modifiers</span>
                    <span>{item.sizeVariants?.length || 0} Size variants</span>
                  </div>
                </div>

                {/* Bottom Bar: Real-time In Stock Switch & Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  {/* Real-time In Stock Toggle */}
                  <div
                    onClick={() => handleToggleStock(item._id)}
                    className="flex items-center gap-2 cursor-pointer group"
                    title="Click to toggle real-time stock on storefront"
                  >
                    <div
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition ${
                        item.inStock ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </div>
                    <span
                      className={`text-xs font-bold transition ${
                        item.inStock ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditItemModal(item)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item._id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Category Modal                                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Gourmet Burgers"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Display Sort Order
                </label>
                <input
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Lower numbers appear first on the storefront menu category bar.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Menu Item Modal (with Multer Upload + Modifiers)                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-5">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Truffle Bacon Cheeseburger"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Base Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    placeholder="12.99"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Rich and savory ingredients, culinary notes..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dietary / Filter Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={itemForm.tags}
                  onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })}
                  placeholder="Spicy, Popular, Chef Special, Vegan"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              {/* Multer Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Food Item Image (Multer Upload)
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setItemImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                  />
                </div>
              </div>

              {/* Add-ons Modifiers Builder */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Optional Add-ons (e.g. Extra Cheese)
                  </span>
                  <button
                    type="button"
                    onClick={addAddonRow}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 text-blue-400 font-semibold hover:bg-slate-700"
                  >
                    + Add Add-on
                  </button>
                </div>

                {itemAddons.map((addon, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add-on Name (e.g. Extra Cheese)"
                      value={addon.name}
                      onChange={(e) => updateAddon(idx, 'name', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <div className="w-24 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2">
                      <span className="text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={addon.price}
                        onChange={(e) => updateAddon(idx, 'price', e.target.value)}
                        className="w-full py-1.5 pl-1 bg-transparent border-0 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAddon(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Size Variants Builder */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Size Variants (e.g. Small, Medium, Large)
                  </span>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 text-blue-400 font-semibold hover:bg-slate-700"
                  >
                    + Add Variant
                  </button>
                </div>

                {itemVariants.map((variant, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Size Name (e.g. Large / 12-inch)"
                      value={variant.size}
                      onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <div className="w-24 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2">
                      <span className="text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                        className="w-full py-1.5 pl-1 bg-transparent border-0 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
