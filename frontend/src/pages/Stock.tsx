import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { Stock, Category, StockStatus } from '../types';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PencilSquare,
  Trash,
} from 'react-bootstrap-icons';
import { toast } from 'sonner';

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const getStatusBadge = (status: StockStatus): { label: string; className: string } => {
  const statusMap: Record<StockStatus, { label: string; className: string }> = {
    AVAILABLE: { label: 'Available', className: 'badge bg-success' },
    LOW_STOCK: { label: 'Low Stock', className: 'badge bg-warning text-dark' },
    OUT_OF_STOCK: { label: 'Out of Stock', className: 'badge bg-danger' },
    DAMAGED: { label: 'Damaged', className: 'badge bg-secondary' },
  };
  return statusMap[status] || { label: status, className: 'badge bg-light text-dark' };
};

export default function Stock() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [newStock, setNewStock] = useState({
    name: '',
    description: '',
    category: '',
    original_quantity: 0,
    current_quantity: 0,
    min_threshold: 10,
    location: '',
    cost_per_item: '',
  });

  const [editQuantity, setEditQuantity] = useState({ quantity: 0, reason: '' });

  const canEdit = ['ADMIN', 'MANAGER', 'STOREKEEPER'].includes(user?.role || '');

  const { data: stocks = [], isLoading: stocksLoading } = useQuery<Stock[]>({
    queryKey: ['stocks'],
    queryFn: async () => {
      const res = await api.get('/stocks/');
      return res.data || [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories/');
      return res.data || [];
    },
  });

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch = debouncedSearch === '' || stock.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || stock.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stocks, debouncedSearch, statusFilter]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/stocks/', payload),
    onSuccess: () => {
      setShowAdd(false);
      setNewStock({ name: '', description: '', category: '', original_quantity: 0, current_quantity: 0, min_threshold: 10, location: '', cost_per_item: '' });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Stock item created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create stock');
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity, reason }: any) => api.post(`/stocks/${id}/update_quantity/`, { quantity, reason }),
    onSuccess: () => {
      setShowEdit(false);
      setSelectedStock(null);
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Stock quantity updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update stock');
    },
  });

  const handleCreateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.name || !newStock.category) {
      toast.error('Name and category are required');
      return;
    }
    createMutation.mutate({
      ...newStock,
      category: Number(newStock.category),
      original_quantity: Number(newStock.original_quantity),
      current_quantity: Number(newStock.current_quantity),
      min_threshold: Number(newStock.min_threshold),
    });
  };

  const handleOpenEdit = (stock: Stock) => {
    setSelectedStock(stock);
    setEditQuantity({ quantity: stock.current_quantity, reason: '' });
    setShowEdit(true);
  };

  const handleUpdateQuantity = () => {
    if (!selectedStock) return;
    if (editQuantity.quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }
    updateQuantityMutation.mutate({ id: selectedStock.id, quantity: editQuantity.quantity, reason: editQuantity.reason || 'Manual adjustment' });
  };

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1 fw-700">Inventory Management</h1>
            <p className="text-muted small mb-0">Manage stock items, quantities, and locations</p>
          </div>
          {canEdit && (
            <button className="btn btn-cbu" onClick={() => setShowAdd(true)}>
              <Plus size={18} className="me-2" />
              Add Stock
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="row g-3 mb-4">
          <div className="col-lg-6">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light border-light">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-light"
                placeholder="Search by item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-3">
            <select
              className="form-select form-select-lg border-light bg-light"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>
        </div>

        {/* Stocks Table */}
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {stocksLoading ? (
              <div className="p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredStocks.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-600">Item Name</th>
                    <th className="text-muted small fw-600">Category</th>
                    <th className="text-muted small fw-600">Current Qty</th>
                    <th className="text-muted small fw-600">Threshold</th>
                    <th className="text-muted small fw-600">Location</th>
                    <th className="text-muted small fw-600">Status</th>
                    {canEdit && <th className="text-muted small fw-600">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => {
                    const status = getStatusBadge(stock.status as StockStatus);
                    return (
                      <tr key={stock.id}>
                        <td className="small fw-500">{stock.name}</td>
                        <td className="small text-muted">{stock.category_name || '—'}</td>
                        <td className="small">
                          <strong>{stock.current_quantity}</strong>
                        </td>
                        <td className="small text-muted">{stock.min_threshold}</td>
                        <td className="small text-muted">{stock.location || '—'}</td>
                        <td>
                          <span className={status.className}>{status.label}</span>
                        </td>
                        {canEdit && (
                          <td className="small">
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleOpenEdit(stock)}
                            >
                              <PencilSquare size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-5 text-center">
                <Boxes size={32} className="text-muted mb-3" />
                <p className="text-muted">No stock items found</p>
                {canEdit && (
                  <button className="btn btn-sm btn-cbu mt-2" onClick={() => setShowAdd(true)}>
                    Add First Item
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Stock Modal */}
        <div
          className={`modal ${showAdd ? 'd-block' : ''}`}
          style={{ display: showAdd ? 'block' : 'none' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-600">Add Stock Item</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAdd(false)}
                />
              </div>
              <form onSubmit={handleCreateStock}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label small fw-600">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="form-control"
                      value={newStock.name}
                      onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label small fw-600">
                      Category *
                    </label>
                    <select
                      id="category"
                      className="form-select"
                      value={newStock.category}
                      onChange={(e) => setNewStock({ ...newStock, category: e.target.value })}
                      required
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label htmlFor="currentQty" className="form-label small fw-600">
                        Current Qty
                      </label>
                      <input
                        type="number"
                        id="currentQty"
                        className="form-control"
                        value={newStock.current_quantity}
                        onChange={(e) => setNewStock({ ...newStock, current_quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="minThreshold" className="form-label small fw-600">
                        Min Threshold
                      </label>
                      <input
                        type="number"
                        id="minThreshold"
                        className="form-control"
                        value={newStock.min_threshold}
                        onChange={(e) => setNewStock({ ...newStock, min_threshold: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="location" className="form-label small fw-600">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      className="form-control"
                      value={newStock.location}
                      onChange={(e) => setNewStock({ ...newStock, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cbu" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Creating...
                      </>
                    ) : (
                      'Create Item'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Edit Quantity Modal */}
        <div
          className={`modal ${showEdit ? 'd-block' : ''}`}
          style={{ display: showEdit ? 'block' : 'none' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-600">Update Stock Quantity</h5>
                <button type="button" className="btn-close" onClick={() => setShowEdit(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Item: <strong>{selectedStock?.name}</strong>
                </p>
                <div className="mb-3">
                  <label htmlFor="editQty" className="form-label small fw-600">
                    New Quantity
                  </label>
                  <input
                    type="number"
                    id="editQty"
                    className="form-control"
                    value={editQuantity.quantity}
                    onChange={(e) => setEditQuantity({ ...editQuantity, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="reason" className="form-label small fw-600">
                    Reason (optional)
                  </label>
                  <textarea
                    id="reason"
                    className="form-control"
                    rows={3}
                    value={editQuantity.reason}
                    onChange={(e) => setEditQuantity({ ...editQuantity, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEdit(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-cbu"
                  onClick={handleUpdateQuantity}
                  disabled={updateQuantityMutation.isPending}
                >
                  {updateQuantityMutation.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Updating...
                    </>
                  ) : (
                    'Update Quantity'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Backdrops */}
        {(showAdd || showEdit) && (
          <div
            className="modal-backdrop fade show"
            onClick={() => {
              setShowAdd(false);
              setShowEdit(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

  const filteredStocks = stocks.filter((s) =>
    s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
    (statusFilter === 'ALL' || s.status === statusFilter)
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div className="d-flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stock</h1>
            <p className="text-muted">Inventory overview and thresholds</p>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Search stock..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-2" /> New
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min Threshold</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredStocks.map((stock) => (
                      <TableRow key={stock.id} className="group">
                        <TableCell>#{stock.id}</TableCell>
                        <TableCell className="font-medium">{stock.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <span className="text-lg font-semibold">{stock.current_quantity}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-gray-500">{stock.min_threshold}</TableCell>
                        <TableCell className="text-gray-500">{stock.location || '—'}</TableCell>
                        <TableCell>{getStatusBadge(stock.status)}</TableCell>
                        <TableCell className="text-right">
                          {canEdit && (
                            <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(stock)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Quantity Dialog */}
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Quantity</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedStock && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Item</p>
                    <p className="font-medium">{selectedStock.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm">New Quantity</label>
                    <Input type="number" value={editQuantity.quantity} onChange={(e: any) => setEditQuantity({ ...editQuantity, quantity: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm">Reason</label>
                    <Input value={editQuantity.reason} onChange={(e: any) => setEditQuantity({ ...editQuantity, reason: e.target.value })} />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
              <Button onClick={handleUpdateQuantity} disabled={updateQuantityMutation.isLoading}>Update Quantity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
  