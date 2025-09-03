'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Package,
  Calculator,
  Upload,
  Download,
  FileText,
  Trash2,
  Eye,
  Edit,
  Copy
} from 'lucide-react'

interface BulkOrderItem {
  id: string
  designId?: string
  productId: string
  quantity: number
  size: string
  color: string
  pricePerUnit: number
  design?: {
    id: string
    title: string
    imageUrl?: string
  }
  product?: {
    id: string
    name: string
    imageUrl?: string
    colors: string[]
    sizes: string[]
  }
}

interface BulkOrderBuilderProps {
  teamId?: string
  onOrderCreate?: (order: any) => void
  initialItems?: BulkOrderItem[]
}

export default function BulkOrderBuilder({ 
  teamId, 
  onOrderCreate,
  initialItems = [] 
}: BulkOrderBuilderProps) {
  const [items, setItems] = useState<BulkOrderItem[]>(initialItems)
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [splitShipping, setSplitShipping] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [teamId])

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams()
      if (teamId) params.append('teamId', teamId)

      const response = await fetch(`/api/orders/bulk?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const addItem = (templateItem?: any) => {
    const newItem: BulkOrderItem = {
      id: Date.now().toString(),
      designId: templateItem?.designId || '',
      productId: templateItem?.productId || '',
      quantity: templateItem?.suggestedQuantity || 10,
      size: 'M',
      color: 'white',
      pricePerUnit: 0,
      design: templateItem?.design,
      product: templateItem?.product,
    }

    setItems(prev => [...prev, newItem])
  }

  const updateItem = (itemId: string, updates: Partial<BulkOrderItem>) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ))
  }

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const duplicateItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      const duplicatedItem = {
        ...item,
        id: Date.now().toString(),
      }
      setItems(prev => [...prev, duplicatedItem])
    }
  }

  const calculateTotals = () => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
    const uniqueDesigns = new Set(items.map(item => item.designId).filter(Boolean)).size
    
    return { totalItems, totalAmount, uniqueDesigns }
  }

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      setError('Please add at least one item to your bulk order')
      return
    }

    const invalidItems = items.filter(item => !item.productId || item.quantity <= 0)
    if (invalidItems.length > 0) {
      setError('Please complete all item details before submitting')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const orderData = {
        items: items.map(item => ({
          designId: item.designId || undefined,
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        teamId: teamId || undefined,
        orderNotes: orderNotes.trim() || undefined,
        splitShipping,
      }

      const response = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create bulk order')
      }

      onOrderCreate?.(data.order)
      
      // Reset form
      setItems([])
      setOrderNotes('')
      setSplitShipping(false)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Design ID', 'Product ID', 'Quantity', 'Size', 'Color', 'Price Per Unit']
    const rows = items.map(item => [
      item.designId || '',
      item.productId,
      item.quantity.toString(),
      item.size,
      item.color,
      item.pricePerUnit.toString(),
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bulk-order-${Date.now()}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Order Builder</h2>
          <p className="text-gray-600">Create large orders with volume discounts and team benefits</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {templates.length > 0 && (
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="btn-ghost flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Templates</span>
            </button>
          )}
          
          {items.length > 0 && (
            <button
              onClick={exportToCSV}
              className="btn-ghost flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          )}
          
          <button
            onClick={() => addItem()}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Templates */}
      {showTemplates && templates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Templates</h3>
          <p className="text-sm text-gray-600 mb-4">
            Based on your previous orders and popular combinations
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={`${template.productId}-${template.designId}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {template.product?.imageUrl ? (
                    <img
                      src={template.product.imageUrl}
                      alt={template.product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.product?.name}</h4>
                    {template.design && (
                      <p className="text-sm text-gray-600">{template.design.title}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>Suggested: {template.suggestedQuantity} items</span>
                  <span>Ordered {template.orderCount}x</span>
                </div>
                
                <button
                  onClick={() => addItem(template)}
                  className="btn-primary btn-sm w-full"
                >
                  Add to Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{items.length} line items</span>
              <span>{totals.totalItems} total items</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add items to start building your bulk order
              </p>
              <button
                onClick={() => addItem()}
                className="mt-4 btn-primary flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Item</span>
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Product/Design Image */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.design?.imageUrl || item.product?.imageUrl ? (
                        <img
                          src={item.design?.imageUrl || item.product?.imageUrl}
                          alt="Product"
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Design Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Design
                          </label>
                          <select
                            value={item.designId || ''}
                            onChange={(e) => updateItem(item.id, { designId: e.target.value || undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">Select design...</option>
                            {/* You'd populate this with available designs */}
                          </select>
                        </div>

                        {/* Product Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product *
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(item.id, { productId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            required
                          >
                            <option value="">Select product...</option>
                            {/* You'd populate this with available products */}
                          </select>
                        </div>

                        {/* Size Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Size
                          </label>
                          <select
                            value={item.size}
                            onChange={(e) => updateItem(item.id, { size: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="2XL">2XL</option>
                          </select>
                        </div>

                        {/* Color Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Color
                          </label>
                          <select
                            value={item.color}
                            onChange={(e) => updateItem(item.id, { color: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="white">White</option>
                            <option value="black">Black</option>
                            <option value="navy">Navy</option>
                            <option value="gray">Gray</option>
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                          </select>
                        </div>
                      </div>

                      {/* Quantity and Pricing */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              />
                              <button
                                onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price per unit
                            </label>
                            <p className="text-lg font-semibold text-gray-900">
                              ${item.pricePerUnit.toFixed(2)}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Line total
                            </label>
                            <p className="text-lg font-semibold text-gray-900">
                              ${(item.quantity * item.pricePerUnit).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Item Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => duplicateItem(item.id)}
                            className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            title="Duplicate item"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-400 hover:text-red-600"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totals.totalItems}</p>
                <p className="text-sm text-gray-600">Total Items</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totals.uniqueDesigns}</p>
                <p className="text-sm text-gray-600">Unique Designs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">${totals.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>
            </div>

            {/* Order Options */}
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  id="orderNotes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special instructions, delivery requirements, etc."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="splitShipping"
                  checked={splitShipping}
                  onChange={(e) => setSplitShipping(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="splitShipping" className="text-sm text-gray-700">
                  Split shipping (different delivery addresses for different items)
                </label>
              </div>
            </div>

            {/* Submit Order */}
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setItems([])}
                className="btn-ghost"
                disabled={isLoading}
              >
                Clear All
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={isLoading || items.length === 0}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                <span>
                  {isLoading ? 'Creating Order...' : `Create Bulk Order ($${totals.totalAmount.toFixed(2)})`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}