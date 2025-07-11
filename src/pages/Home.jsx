import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/HeroBanner';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import BottomNavBar from '../components/BottomNavBar';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { getProducts, getCategories } from '../services/firebaseService';

const Home = ({ onNavigateToCart, onNavigateToCategory, onNavigate, activeTab, cartCount, query, setQuery, onProductClick, onAdminClick }) => {
  const { addToCart, getTotalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Priority order for categories
  const categoryPriority = ['chicken', 'mutton', 'eggs', 'masala'];

  function getCategoryPriority(cat) {
    const key = (cat.key || '').toLowerCase();
    const name = (cat.name || '').toLowerCase();
    for (let i = 0; i < categoryPriority.length; i++) {
      if (key.includes(categoryPriority[i]) || name.includes(categoryPriority[i])) return i;
    }
    return categoryPriority.length;
  }

  const sortedCategories = [...categories].sort((a, b) => getCategoryPriority(a) - getCategoryPriority(b));

  const bestsellers = products.filter(product => product.bestSeller).sort((a, b) => {
    const catA = categories.find(cat => cat.key === a.category);
    const catB = categories.find(cat => cat.key === b.category);
    return getCategoryPriority(catA || {}) - getCategoryPriority(catB || {});
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header
        activeTab={activeTab}
        onNavigate={onNavigate}
        cartCount={cartCount}
        query={query}
        setQuery={setQuery}
        onAdminClick={onAdminClick}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Desktop Category Navigation */}
        {/* Removed category navigation buttons */}

        {/* Bestsellers Section */}
        <section className="mb-8">
          <SectionHeading 
            title="Bestsellers" 
            subtitle="Most popular items with great discounts"
            showViewAll={true}
          />
          {/* Mobile: Horizontal scroll carousel */}
          <div className="md:hidden -mx-4 px-1 overflow-x-auto">
            <div className="flex space-x-4 pb-2">
              {bestsellers.map((product) => (
                <div key={product.id} className="min-w-[220px] max-w-[70vw] flex-shrink-0">
                  <ProductCard
                    product={product}
                    onAddToCart={addToCart}
                    onCardClick={onProductClick}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            {bestsellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onCardClick={onProductClick}
              />
            ))}
          </div>
        </section>

        {/* Shop by Categories Section */}
        <section className="mb-10">
          <SectionHeading
            title="Shop by categories"
            subtitle="Freshest meats and much more!"
          />
          <div className="grid grid-cols-4 gap-4">
            {sortedCategories.map((cat) => (
              <button key={cat.id} className="flex flex-col items-center focus:outline-none" onClick={() => onNavigateToCategory && onNavigateToCategory(cat.key)}>
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 mb-1">
                  <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                </div>
                <span className="text-xs text-gray-700 text-center font-medium leading-tight">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Products by Category */}
        <section>
          <SectionHeading 
            title="All Products"
            subtitle={`${products.length} items available`}
          />
          <div className="space-y-12">
            {/* Group products by dynamic categories */}
            {sortedCategories.map((cat) => {
              const catProducts = products.filter(p => p.category === cat.key);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id} className="">
                  {/* Category Header */}
                  <div className="flex items-center mb-4 gap-4">
                    {cat.image && (
                      <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
                    )}
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">{cat.name}</h3>
                  </div>
                  {/* Mobile: Horizontal scroll carousel */}
                  <div className="md:hidden -mx-4 px-1 overflow-x-auto">
                    <div className="flex space-x-4 pb-2">
                      {catProducts.map((product) => (
                        <div key={product.id} className="min-w-[220px] max-w-[70vw] flex-shrink-0">
                          <ProductCard
                            product={product}
                            onAddToCart={addToCart}
                            onCardClick={onProductClick}
                          />
                        </div>
                      ))}
                      {/* View More Card (Mobile only) */}
                      <button
                        className="min-w-[220px] max-w-[70vw] flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors p-6 text-red-700 font-semibold text-base shadow-sm"
                        onClick={() => onNavigateToCategory && onNavigateToCategory(cat.key)}
                        aria-label={`View more ${cat.name}`}
                      >
                        View More
                      </button>
                    </div>
                  </div>
                  {/* Desktop: Grid */}
                  <div className="hidden md:grid md:grid-cols-4 gap-4">
                    {catProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        onCardClick={onProductClick}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavBar
        activeCategory={null}
        onCategoryChange={() => {}}
        cartItemCount={getTotalItems()}
        onCartClick={onNavigateToCart}
      />
    </div>
  );
};

export default Home; 