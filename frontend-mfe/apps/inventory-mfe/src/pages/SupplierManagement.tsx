import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website?: string;
  taxId?: string;
  paymentTerms: string;
  leadTime: number; // in days
  minimumOrder: number;
  deliveryDays: string[];
  categories: string[];
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
  createdAt: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  onTimeDeliveryRate: number;
  qualityRating: number;
}

interface SupplierItem {
  id: string;
  supplierId: string;
  itemName: string;
  supplierSku: string;
  unitCost: number;
  unit: string;
  minimumOrderQty: number;
  lastOrderDate?: string;
  isPreferred: boolean;
}

const SupplierManagement: React.FC = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams<{ supplierId: string }>();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'orders' | 'performance'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Supplier['status']>('all');
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    paymentTerms: 'Net 30',
    leadTime: 7,
    minimumOrder: 0,
    deliveryDays: [] as string[],
    categories: [] as string[]
  });

  useEffect(() => {
    // Generate mock suppliers
    const mockSuppliers: Supplier[] = [
      {
        id: 'sup_1',
        name: 'Premium Foods Co.',
        contactPerson: 'John Smith',
        email: 'john@premiumfoods.com',
        phone: '(555) 123-4567',
        address: '123 Industrial Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        website: 'www.premiumfoods.com',
        taxId: '12-3456789',
        paymentTerms: 'Net 30',
        leadTime: 5,
        minimumOrder: 500,
        deliveryDays: ['Monday', 'Wednesday', 'Friday'],
        categories: ['Meat', 'Seafood'],
        rating: 4.8,
        status: 'active',
        notes: 'Excellent quality, reliable delivery. Primary meat supplier.',
        createdAt: '2023-01-15T00:00:00Z',
        lastOrderDate: '2024-01-18T00:00:00Z',
        totalOrders: 156,
        totalSpent: 125000,
        onTimeDeliveryRate: 96,
        qualityRating: 4.9
      },
      {
        id: 'sup_2',
        name: 'Fresh Market Supply',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@freshmarket.com',
        phone: '(555) 234-5678',
        address: '456 Farm Road',
        city: 'Fresno',
        state: 'CA',
        zipCode: '93650',
        website: 'www.freshmarketsupply.com',
        paymentTerms: 'Net 15',
        leadTime: 3,
        minimumOrder: 200,
        deliveryDays: ['Tuesday', 'Thursday', 'Saturday'],
        categories: ['Vegetables', 'Dairy'],
        rating: 4.6,
        status: 'active',
        notes: 'Great for fresh produce. Local supplier with quick delivery.',
        createdAt: '2023-02-20T00:00:00Z',
        lastOrderDate: '2024-01-19T00:00:00Z',
        totalOrders: 89,
        totalSpent: 45000,
        onTimeDeliveryRate: 92,
        qualityRating: 4.7
      },
      {
        id: 'sup_3',
        name: 'Ocean Harvest',
        contactPerson: 'Mike Chen',
        email: 'mike@oceanharvest.com',
        phone: '(555) 345-6789',
        address: '789 Harbor Way',
        city: 'San Diego',
        state: 'CA',
        zipCode: '92101',
        paymentTerms: 'Net 30',
        leadTime: 2,
        minimumOrder: 300,
        deliveryDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        categories: ['Seafood'],
        rating: 4.9,
        status: 'active',
        notes: 'Premium seafood supplier. Daily fresh deliveries available.',
        createdAt: '2023-03-10T00:00:00Z',
        lastOrderDate: '2024-01-20T00:00:00Z',
        totalOrders: 234,
        totalSpent: 89000,
        onTimeDeliveryRate: 98,
        qualityRating: 4.9
      },
      {
        id: 'sup_4',
        name: 'Specialty Imports',
        contactPerson: 'Emily Davis',
        email: 'emily@specialtyimports.com',
        phone: '(555) 456-7890',
        address: '321 Trade Center',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        website: 'www.specialtyimports.com',
        paymentTerms: 'Net 45',
        leadTime: 14,
        minimumOrder: 1000,
        deliveryDays: ['Wednesday'],
        categories: ['Condiments', 'Spices', 'Beverages'],
        rating: 4.4,
        status: 'active',
        notes: 'Specialty and imported items. Longer lead times but unique products.',
        createdAt: '2023-04-05T00:00:00Z',
        lastOrderDate: '2024-01-15T00:00:00Z',
        totalOrders: 67,
        totalSpent: 34000,
        onTimeDeliveryRate: 88,
        qualityRating: 4.5
      },
      {
        id: 'sup_5',
        name: 'Local Dairy Co.',
        contactPerson: 'Robert Wilson',
        email: 'robert@localdairy.com',
        phone: '(555) 567-8901',
        address: '654 Pasture Lane',
        city: 'Modesto',
        state: 'CA',
        zipCode: '95350',
        paymentTerms: 'Net 15',
        leadTime: 1,
        minimumOrder: 100,
        deliveryDays: ['Monday', 'Wednesday', 'Friday'],
        categories: ['Dairy'],
        rating: 4.7,
        status: 'pending',
        notes: 'New supplier evaluation in progress. Organic dairy products.',
        createdAt: '2024-01-10T00:00:00Z',
        totalOrders: 0,
        totalSpent: 0,
        onTimeDeliveryRate: 0,
        qualityRating: 0
      }
    ];
    setSuppliers(mockSuppliers);

    // Generate mock supplier items
    const mockItems: SupplierItem[] = [
      {
        id: 'si_1',
        supplierId: 'sup_1',
        itemName: 'Premium Beef Tenderloin',
        supplierSku: 'PF-BT-001',
        unitCost: 28.50,
        unit: 'lbs',
        minimumOrderQty: 5,
        lastOrderDate: '2024-01-18T00:00:00Z',
        isPreferred: true
      },
      {
        id: 'si_2',
        supplierId: 'sup_1',
        itemName: 'Wagyu Beef Ribeye',
        supplierSku: 'PF-WR-002',
        unitCost: 45.00,
        unit: 'lbs',
        minimumOrderQty: 3,
        lastOrderDate: '2024-01-15T00:00:00Z',
        isPreferred: true
      },
      {
        id: 'si_3',
        supplierId: 'sup_2',
        itemName: 'Organic Baby Spinach',
        supplierSku: 'FM-OS-100',
        unitCost: 3.25,
        unit: 'lbs',
        minimumOrderQty: 10,
        lastOrderDate: '2024-01-19T00:00:00Z',
        isPreferred: true
      }
    ];
    setSupplierItems(mockItems);

    // Handle supplier detail view
    if (supplierId) {
      const supplier = mockSuppliers.find(s => s.id === supplierId);
      if (supplier) {
        setSelectedSupplier(supplier);
        setShowSupplierDetails(true);
      }
    }
  }, [supplierId]);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Supplier['status']): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getRatingStars = (rating: number): string => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    return stars.padEnd(5, '☆');
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name.trim() || !newSupplier.email.trim()) return;
    
    const supplier: Supplier = {
      id: `sup_${Date.now()}`,
      ...newSupplier,
      rating: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      onTimeDeliveryRate: 0,
      qualityRating: 0
    };
    
    setSuppliers(prev => [...prev, supplier]);
    setNewSupplier({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      website: '',
      paymentTerms: 'Net 30',
      leadTime: 7,
      minimumOrder: 0,
      deliveryDays: [],
      categories: []
    });
    setShowAddModal(false);
  };

  const handleSupplierClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierDetails(true);
    navigate(`/suppliers/${supplier.id}`);
  };

  const handleToggleSupplierStatus = (supplierId: string) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === supplierId
        ? { ...supplier, status: supplier.status === 'active' ? 'inactive' : 'active' as Supplier['status'] }
        : supplier
    ));
  };

  const categories = ['Meat', 'Seafood', 'Vegetables', 'Dairy', 'Grains', 'Condiments', 'Beverages', 'Spices'];
  const paymentTermsOptions = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', 'Prepaid'];
  const deliveryDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Supplier Management</h1>
          <p className="text-neutral-600">
            {filteredSuppliers.length} suppliers • {suppliers.filter(s => s.status === 'active').length} active
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Add Supplier
          </Button>
          
          <Button
            onClick={() => navigate('/purchase-orders')}
            variant="outline"
          >
            Purchase Orders
          </Button>
        </div>
      </div>

      {/* Supplier Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-blue-600">{suppliers.length}</div>
          <div className="metric-label">Total Suppliers</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-green-600">
            {suppliers.filter(s => s.status === 'active').length}
          </div>
          <div className="metric-label">Active Suppliers</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-amber-600">
            {suppliers.filter(s => s.status === 'pending').length}
          </div>
          <div className="metric-label">Pending Review</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-purple-600">
            ${Math.round(suppliers.reduce((sum, s) => sum + s.totalSpent, 0) / 1000)}K
          </div>
          <div className="metric-label">Total Spent</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers by name, contact, or email..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredSuppliers.map(supplier => (
                <tr 
                  key={supplier.id} 
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => handleSupplierClick(supplier)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-neutral-900">{supplier.name}</div>
                      <div className="text-sm text-neutral-500">
                        {supplier.city}, {supplier.state}
                      </div>
                      <div className="text-sm text-amber-600">
                        {getRatingStars(supplier.rating)} ({supplier.rating.toFixed(1)})
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        {supplier.contactPerson}
                      </div>
                      <div className="text-sm text-neutral-500">{supplier.email}</div>
                      <div className="text-sm text-neutral-500">{supplier.phone}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.slice(0, 3).map(category => (
                        <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {category}
                        </span>
                      ))}
                      {supplier.categories.length > 3 && (
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                          +{supplier.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-neutral-900">
                        {supplier.onTimeDeliveryRate}% on-time
                      </div>
                      <div className="text-neutral-500">
                        Lead time: {supplier.leadTime}d
                      </div>
                      <div className="text-neutral-500">
                        Min order: ${supplier.minimumOrder}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-neutral-900">
                        {supplier.totalOrders} orders
                      </div>
                      <div className="text-neutral-500">
                        ${supplier.totalSpent.toLocaleString()} total
                      </div>
                      <div className="text-neutral-500">
                        {supplier.lastOrderDate 
                          ? `Last: ${new Date(supplier.lastOrderDate).toLocaleDateString()}`
                          : 'No orders yet'
                        }
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}>
                      {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/purchase-orders/new?supplier=${supplier.id}`);
                        }}
                        size="sm"
                      >
                        Order
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSupplierClick(supplier);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-neutral-400 text-lg mb-2">No suppliers found</div>
            <div className="text-neutral-500 text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter settings'
                : 'Start by adding your first supplier'
              }
            </div>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Add First Supplier
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Supplier Details Modal */}
      {showSupplierDetails && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">{selectedSupplier.name}</h2>
                  <p className="text-neutral-600">{selectedSupplier.contactPerson}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSupplier.status)}`}>
                    {selectedSupplier.status.charAt(0).toUpperCase() + selectedSupplier.status.slice(1)}
                  </span>
                  <Button
                    onClick={() => {
                      setShowSupplierDetails(false);
                      setSelectedSupplier(null);
                      navigate('/suppliers');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="mt-4">
                <nav className="flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: '📋' },
                    { id: 'items', label: 'Items', icon: '📦' },
                    { id: 'orders', label: 'Orders', icon: '🛒' },
                    { id: 'performance', label: 'Performance', icon: '📊' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <span className="mr-1">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-3">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Contact:</strong> {selectedSupplier.contactPerson}</div>
                        <div><strong>Email:</strong> {selectedSupplier.email}</div>
                        <div><strong>Phone:</strong> {selectedSupplier.phone}</div>
                        <div><strong>Address:</strong> {selectedSupplier.address}</div>
                        <div><strong>City:</strong> {selectedSupplier.city}, {selectedSupplier.state} {selectedSupplier.zipCode}</div>
                        {selectedSupplier.website && (
                          <div><strong>Website:</strong> 
                            <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                              {selectedSupplier.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-3">Business Terms</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Payment Terms:</strong> {selectedSupplier.paymentTerms}</div>
                        <div><strong>Lead Time:</strong> {selectedSupplier.leadTime} days</div>
                        <div><strong>Minimum Order:</strong> ${selectedSupplier.minimumOrder}</div>
                        <div><strong>Delivery Days:</strong> {selectedSupplier.deliveryDays.join(', ')}</div>
                        {selectedSupplier.taxId && (
                          <div><strong>Tax ID:</strong> {selectedSupplier.taxId}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-3">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedSupplier.categories.map(category => (
                          <span key={category} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-3">Performance Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Overall Rating</span>
                          <span className="text-amber-600">
                            {getRatingStars(selectedSupplier.rating)} ({selectedSupplier.rating.toFixed(1)})
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">On-Time Delivery</span>
                          <span className="font-medium">{selectedSupplier.onTimeDeliveryRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Quality Rating</span>
                          <span className="text-amber-600">
                            {getRatingStars(selectedSupplier.qualityRating)} ({selectedSupplier.qualityRating.toFixed(1)})
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Total Orders</span>
                          <span className="font-medium">{selectedSupplier.totalOrders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Total Spent</span>
                          <span className="font-medium">${selectedSupplier.totalSpent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedSupplier.notes && (
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-3">Notes</h3>
                        <p className="text-sm text-neutral-600">{selectedSupplier.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'items' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-neutral-900">Supplier Items</h3>
                    <Button size="sm">
                      + Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {supplierItems
                      .filter(item => item.supplierId === selectedSupplier.id)
                      .map(item => (
                        <div key={item.id} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-neutral-900">{item.itemName}</div>
                              <div className="text-sm text-neutral-500">
                                SKU: {item.supplierSku} • Min Order: {item.minimumOrderQty} {item.unit}
                              </div>
                              <div className="text-sm text-neutral-600">
                                ${item.unitCost.toFixed(2)} per {item.unit}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {item.isPreferred && (
                                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                                  Preferred
                                </span>
                              )}
                              <Button size="sm" variant="outline">
                                Order
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                    
                    {supplierItems.filter(item => item.supplierId === selectedSupplier.id).length === 0 && (
                      <div className="text-center py-8 text-neutral-500">
                        <div className="text-lg mb-2">📦</div>
                        <div>No items configured for this supplier</div>
                        <Button size="sm" className="mt-2">
                          Add First Item
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'orders' && (
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-4">Order History</h3>
                  <div className="text-center py-8 text-neutral-500">
                    <div className="text-lg mb-2">🛒</div>
                    <div>Order history coming soon...</div>
                  </div>
                </div>
              )}
              
              {activeTab === 'performance' && (
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-4">Performance Metrics</h3>
                  <div className="text-center py-8 text-neutral-500">
                    <div className="text-lg mb-2">📊</div>
                    <div>Performance analytics coming soon...</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    onClick={() => navigate(`/purchase-orders/new?supplier=${selectedSupplier.id}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Purchase Order
                  </Button>
                  <Button
                    onClick={() => handleToggleSupplierStatus(selectedSupplier.id)}
                    variant="outline"
                  >
                    {selectedSupplier.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
                
                <div className="text-sm text-neutral-500">
                  Supplier since {new Date(selectedSupplier.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Supplier</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contact person name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="supplier@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Street address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={newSupplier.city}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={newSupplier.state}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="State"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={newSupplier.paymentTerms}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {paymentTermsOptions.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  value={newSupplier.leadTime}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, leadTime: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="7"
                  min="0"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Categories
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newSupplier.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSupplier(prev => ({ ...prev, categories: [...prev.categories, category] }));
                          } else {
                            setNewSupplier(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded mr-2"
                      />
                      <span className="text-sm text-neutral-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setNewSupplier({
                    name: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    website: '',
                    paymentTerms: 'Net 30',
                    leadTime: 7,
                    minimumOrder: 0,
                    deliveryDays: [],
                    categories: []
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSupplier}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!newSupplier.name.trim() || !newSupplier.email.trim()}
              >
                Add Supplier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;