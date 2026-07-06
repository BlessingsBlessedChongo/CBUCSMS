import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { useCategories, useCreateStock, useStocks, useUpdateStockQuantity } from '../hooks';
import type { Stock, StockStatus } from '../types';
import { Boxes, Plus, Search, PencilSquare } from 'react-bootstrap-icons';
import { EmptyState, TableSkeleton } from '../components/ui/LoadingState';
import { toast } from 'sonner';

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
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

const emptyStockForm = {
  name: '',
  description: '',
  category: '',
  original_quantity: 0,
  current_quantity: 0,
  min_threshold: 10,
  location: '',
  cost_per_item: '',
};

export default function Stock() {
  const { user } = useAuth();
  const { data: stocks = [], isLoading: stocksLoading, isError } = useStocks();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateStock();
  const updateQuantityMutation = useUpdateStockQuantity();

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [newStock, setNewStock] = useState(emptyStockForm);
  const [editQuantity, setEditQuantity] = useState({ quantity: 0, reason: '' });

  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const canEdit = ['ADMIN', 'MANAGER', 'STOREKEEPER'].includes(user?.role || '');

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch =
        debouncedSearch === '' ||
        stock.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || stock.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stocks, debouncedSearch, statusFilter]);

  const handleCreateStock = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newStock.name || !newStock.category) {
      toast.error('Name and category are required');
      return;
    }

    createMutation.mutate(
      {
        ...newStock,
        category: Number(newStock.category),
        original_quantity: Number(newStock.original_quantity),
        current_quantity: Number(newStock.current_quantity),
        min_threshold: Number(newStock.min_threshold),
      },
      {
        onSuccess: () => {
          setShowAdd(false);
          setNewStock(emptyStockForm);
        },
      },
    );
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

    updateQuantityMutation.mutate(
      {
        id: selectedStock.id,
        payload: {
          quantity: editQuantity.quantity,
          reason: editQuantity.reason || 'Manual adjustment',
        },
      },
      {
        onSuccess: () => {
          setShowEdit(false);
          setSelectedStock(null);
        },
      },
    );
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1 fw-bold">Inventory Management</h1>
            <p className="text-muted small mb-0">Manage stock items, quantities, and locations</p>
          </div>
          {canEdit && (
            <button className="btn btn-cbu text-white" onClick={() => setShowAdd(true)}>
              <Plus size={18} className="me-2" />
              Add Stock
            </button>
          )}
        </div>

        {isError && (
          <div className="alert alert-danger" role="alert">
            Failed to load inventory data. Please try again.
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-lg-6">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-white border-end-0">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="search"
                className="form-control border-start-0"
                placeholder="Search by item name..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search stock items"
              />
            </div>
          </div>
          <div className="col-lg-3">
            <select
              className="form-select form-select-lg"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {stocksLoading ? (
              <TableSkeleton rows={6} columns={canEdit ? 7 : 6} />
            ) : filteredStocks.length > 0 ? (
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-semibold">Item Name</th>
                    <th className="text-muted small fw-semibold">Category</th>
                    <th className="text-muted small fw-semibold">Current Qty</th>
                    <th className="text-muted small fw-semibold">Threshold</th>
                    <th className="text-muted small fw-semibold">Location</th>
                    <th className="text-muted small fw-semibold">Status</th>
                    {canEdit && <th className="text-muted small fw-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => {
                    const status = getStatusBadge(stock.status);
                    return (
                      <tr key={stock.id}>
                        <td className="small fw-medium">{stock.name}</td>
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
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleOpenEdit(stock)}
                              aria-label={`Edit ${stock.name}`}
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
              <EmptyState
                icon={<Boxes size={32} />}
                title="No stock items found"
                description={
                  searchTerm || statusFilter !== 'ALL'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Inventory items will appear here once added.'
                }
                action={
                  canEdit ? (
                    <button className="btn btn-sm btn-cbu text-white mt-2" onClick={() => setShowAdd(true)}>
                      Add First Item
                    </button>
                  ) : undefined
                }
              />
            )}
          </div>
        </div>

        <div
          className={`modal ${showAdd ? 'd-block' : ''}`}
          style={{ display: showAdd ? 'block' : 'none' }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-semibold">Add Stock Item</h5>
                <button type="button" className="btn-close" onClick={() => setShowAdd(false)} />
              </div>
              <form onSubmit={handleCreateStock}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label small fw-semibold">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="form-control"
                      value={newStock.name}
                      onChange={(event) => setNewStock({ ...newStock, name: event.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label small fw-semibold">
                      Category *
                    </label>
                    <select
                      id="category"
                      className="form-select"
                      value={newStock.category}
                      onChange={(event) => setNewStock({ ...newStock, category: event.target.value })}
                      required
                    >
                      <option value="">Select category...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label htmlFor="currentQty" className="form-label small fw-semibold">
                        Current Qty
                      </label>
                      <input
                        type="number"
                        id="currentQty"
                        className="form-control"
                        min={0}
                        value={newStock.current_quantity}
                        onChange={(event) =>
                          setNewStock({ ...newStock, current_quantity: Number(event.target.value) })
                        }
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="minThreshold" className="form-label small fw-semibold">
                        Min Threshold
                      </label>
                      <input
                        type="number"
                        id="minThreshold"
                        className="form-control"
                        min={0}
                        value={newStock.min_threshold}
                        onChange={(event) =>
                          setNewStock({ ...newStock, min_threshold: Number(event.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="mb-3 mt-3">
                    <label htmlFor="location" className="form-label small fw-semibold">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      className="form-control"
                      value={newStock.location}
                      onChange={(event) => setNewStock({ ...newStock, location: event.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAdd(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cbu text-white" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div
          className={`modal ${showEdit ? 'd-block' : ''}`}
          style={{ display: showEdit ? 'block' : 'none' }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-semibold">Update Stock Quantity</h5>
                <button type="button" className="btn-close" onClick={() => setShowEdit(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Item: <strong>{selectedStock?.name}</strong>
                </p>
                <div className="mb-3">
                  <label htmlFor="editQty" className="form-label small fw-semibold">
                    New Quantity
                  </label>
                  <input
                    type="number"
                    id="editQty"
                    className="form-control"
                    min={0}
                    value={editQuantity.quantity}
                    onChange={(event) =>
                      setEditQuantity({ ...editQuantity, quantity: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="reason" className="form-label small fw-semibold">
                    Reason (optional)
                  </label>
                  <textarea
                    id="reason"
                    className="form-control"
                    rows={3}
                    value={editQuantity.reason}
                    onChange={(event) =>
                      setEditQuantity({ ...editQuantity, reason: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEdit(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-cbu text-white"
                  onClick={handleUpdateQuantity}
                  disabled={updateQuantityMutation.isPending}
                >
                  {updateQuantityMutation.isPending ? 'Updating...' : 'Update Quantity'}
                </button>
              </div>
            </div>
          </div>
        </div>

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
