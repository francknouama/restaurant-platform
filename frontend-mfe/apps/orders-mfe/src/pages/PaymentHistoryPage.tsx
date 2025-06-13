import React, { useState, useEffect } from 'react';
import { Card, Button, Input, StatusBadge } from '@restaurant/shared-ui';
import { 
  Search, 
  Calendar, 
  Download, 
  Eye,
  CreditCard,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw
} from 'lucide-react';

interface Payment {
  id: string;
  transactionId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'DIGITAL_WALLET';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  processedAt: string;
  refundAmount?: number;
  refundReason?: string;
  gateway?: string;
  fees: number;
}

const PaymentHistoryPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [isLoading, setIsLoading] = useState(true);

  // Mock payment data
  useEffect(() => {
    setTimeout(() => {
      const mockPayments: Payment[] = [
        {
          id: '1',
          transactionId: 'TXN-12345',
          orderId: '1',
          orderNumber: 'ORD-098',
          customerName: 'John Doe',
          amount: 45.99,
          method: 'CREDIT_CARD',
          status: 'COMPLETED',
          processedAt: '2024-01-15T10:32:00Z',
          gateway: 'Stripe',
          fees: 1.38
        },
        {
          id: '2',
          transactionId: 'TXN-12344',
          orderId: '2',
          orderNumber: 'ORD-097',
          customerName: 'Jane Smith',
          amount: 32.50,
          method: 'DIGITAL_WALLET',
          status: 'COMPLETED',
          processedAt: '2024-01-15T10:15:00Z',
          gateway: 'PayPal',
          fees: 0.98
        },
        {
          id: '3',
          transactionId: 'TXN-12343',
          orderId: '3',
          orderNumber: 'ORD-096',
          customerName: 'Bob Wilson',
          amount: 67.25,
          method: 'CREDIT_CARD',
          status: 'FAILED',
          processedAt: '2024-01-15T09:45:00Z',
          gateway: 'Stripe',
          fees: 0
        },
        {
          id: '4',
          transactionId: 'TXN-12342',
          orderId: '4',
          orderNumber: 'ORD-095',
          customerName: 'Alice Johnson',
          amount: 89.75,
          method: 'DEBIT_CARD',
          status: 'COMPLETED',
          processedAt: '2024-01-15T09:20:00Z',
          gateway: 'Square',
          fees: 2.24
        },
        {
          id: '5',
          transactionId: 'TXN-12341',
          orderId: '5',
          orderNumber: 'ORD-094',
          customerName: 'Carol Davis',
          amount: 31.50,
          method: 'CASH',
          status: 'COMPLETED',
          processedAt: '2024-01-15T08:55:00Z',
          fees: 0
        },
        {
          id: '6',
          transactionId: 'TXN-12340',
          orderId: '6',
          orderNumber: 'ORD-093',
          customerName: 'David Brown',
          amount: 25.00,
          method: 'CREDIT_CARD',
          status: 'REFUNDED',
          processedAt: '2024-01-15T08:30:00Z',
          refundAmount: 25.00,
          refundReason: 'Customer request',
          gateway: 'Stripe',
          fees: 0.75
        },
        {
          id: '7',
          transactionId: 'TXN-12339',
          orderId: '7',
          orderNumber: 'ORD-092',
          customerName: 'Eve Wilson',
          amount: 54.25,
          method: 'DIGITAL_WALLET',
          status: 'PROCESSING',
          processedAt: '2024-01-15T08:10:00Z',
          gateway: 'PayPal',
          fees: 1.63
        }
      ];
      setPayments(mockPayments);
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    
    // Date filtering logic would go here
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate statistics
  const stats = {
    totalPayments: filteredPayments.length,
    totalAmount: filteredPayments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0),
    totalFees: filteredPayments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.fees, 0),
    successRate: filteredPayments.length > 0 
      ? (filteredPayments.filter(p => p.status === 'COMPLETED').length / filteredPayments.length) * 100
      : 0,
    refundedAmount: filteredPayments
      .filter(p => p.status === 'REFUNDED')
      .reduce((sum, p) => sum + (p.refundAmount || 0), 0),
    failedPayments: filteredPayments.filter(p => p.status === 'FAILED').length
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'PROCESSING': return 'blue';
      case 'PENDING': return 'amber';
      case 'FAILED': return 'red';
      case 'REFUNDED': return 'gray';
      default: return 'gray';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="w-4 h-4" />;
      case 'CASH':
        return <DollarSign className="w-4 h-4" />;
      case 'DIGITAL_WALLET':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getMethodDisplay = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD': return 'Credit Card';
      case 'DEBIT_CARD': return 'Debit Card';
      case 'DIGITAL_WALLET': return 'Digital Wallet';
      case 'CASH': return 'Cash';
      default: return method;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Payment History</h1>
          <p className="mt-2 text-neutral-600">Transaction management and payment records</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Payments</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.totalPayments}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Amount</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Success Rate</p>
              <p className="text-2xl font-bold text-neutral-900">
                {Math.round(stats.successRate)}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Processing Fees</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(stats.totalFees)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Refunded</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(stats.refundedAmount)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search by transaction ID, order, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="DIGITAL_WALLET">Digital Wallet</option>
            <option value="CASH">Cash</option>
          </select>
          
          <Button variant="outline" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </Button>
        </div>
      </Card>

      {/* Payments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Transaction</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Order</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Method</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Fees</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Processed</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="text-neutral-500">
                      {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                        ? 'No payments found matching your filters.'
                        : 'No payment history available.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-sm">{payment.transactionId}</div>
                        {payment.gateway && (
                          <div className="text-xs text-neutral-500">{payment.gateway}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{payment.orderNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-neutral-900">{payment.customerName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(payment.method)}
                        <span className="text-sm">{getMethodDisplay(payment.method)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        {payment.refundAmount && (
                          <div className="text-xs text-red-600">
                            Refunded: {formatCurrency(payment.refundAmount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-neutral-600">
                        {payment.fees > 0 ? formatCurrency(payment.fees) : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge 
                        status={payment.status.toLowerCase()} 
                        color={getStatusColor(payment.status)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-neutral-600">
                        {formatDateTime(payment.processedAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PaymentHistoryPage;