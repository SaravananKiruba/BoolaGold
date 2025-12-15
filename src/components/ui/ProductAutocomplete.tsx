'use client';

import { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  metalType: string;
  purity: string;
  netWeight: number;
  barcode?: string;
  supplier?: { name: string };
  _count?: { stockItems: number };
}

interface ProductAutocompleteProps {
  value: string;
  onChange: (productId: string, product: Product | null) => void;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function ProductAutocomplete({
  value,
  onChange,
  disabled = false,
  placeholder = 'Search by name, code, or barcode...',
  style = {}
}: ProductAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all products once on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products.slice(0, 50)); // Show first 50 when no search
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.metalType.toLowerCase().includes(term) ||
        product.purity.toLowerCase().includes(term) ||
        (product.barcode && product.barcode.toLowerCase().includes(term)) ||
        (product.supplier && product.supplier.name.toLowerCase().includes(term))
      ).slice(0, 50); // Limit to 50 results
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Update selected product when value changes from parent
  useEffect(() => {
    if (value && products.length > 0) {
      const product = products.find(p => p.id === value);
      if (product) {
        setSelectedProduct(product);
        setSearchTerm('');
      }
    } else {
      setSelectedProduct(null);
      setSearchTerm('');
    }
  }, [value, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?isActive=true&pageSize=1000');
      const result = await response.json();
      
      if (result.success && result.data) {
        setProducts(result.data);
        setFilteredProducts(result.data.slice(0, 50));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setShowDropdown(false);
    onChange(product.id, product);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    onChange('', null);
    inputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', ...style }}>
      {/* Display selected product or search input */}
      {selectedProduct ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: '#f8f9fa'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedProduct.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              {selectedProduct.metalType} {selectedProduct.purity} • {selectedProduct.netWeight}g
              {selectedProduct._count && selectedProduct._count.stockItems > 0 && (
                <span style={{ marginLeft: '8px', color: '#00b894' }}>
                  ✓ {selectedProduct._count.stockItems} in stock
                </span>
              )}
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              style={{
                marginLeft: '10px',
                padding: '4px 8px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled || loading}
          placeholder={loading ? 'Loading products...' : placeholder}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            background: disabled || loading ? '#f5f5f5' : 'white'
          }}
        />
      )}

      {/* Dropdown with filtered products */}
      {showDropdown && !selectedProduct && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '300px',
          overflowY: 'auto',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          {loading ? (
            <div style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
              {searchTerm ? `No products found for "${searchTerm}"` : 'No products available'}
            </div>
          ) : (
            <>
              <div style={{ 
                padding: '8px 12px', 
                background: '#f8f9fa', 
                borderBottom: '1px solid #ddd',
                fontSize: '12px',
                color: '#666',
                fontWeight: 500
              }}>
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </div>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span>📊 {product.metalType} {product.purity}</span>
                    <span>⚖️ {product.netWeight}g</span>
                    {product.barcode && <span>🏷️ {product.barcode}</span>}
                    {product.supplier && <span>📦 {product.supplier.name}</span>}
                    {product._count && product._count.stockItems > 0 && (
                      <span style={{ color: '#00b894', fontWeight: 500 }}>
                        ✓ {product._count.stockItems} in stock
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
