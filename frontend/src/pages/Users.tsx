import { useState } from 'react';
import Layout from '../components/Layout';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
  USER_ROLE_OPTIONS,
} from '../hooks';
import type { UserAccount, UserRole } from '../types';
import { Plus, Pencil, Trash2, People } from 'react-bootstrap-icons';
import { EmptyState, TableSkeleton } from '../components/ui/LoadingState';
import { toast } from 'sonner';

const roleColors: Record<UserRole, string> = {
  ADMIN: 'danger',
  MANAGER: 'primary',
  PROCUREMENT: 'warning',
  CFO: 'info',
  STOREKEEPER: 'success',
  DEPARTMENT: 'secondary',
};

const emptyForm = {
  username: '',
  email: '',
  password: '',
  role: 'DEPARTMENT' as UserRole,
};

export default function Users() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const { data: users = [], isLoading, isError } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleAddUser = () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Username, email, and password are required');
      return;
    }
    createMutation.mutate(formData, {
      onSuccess: () => {
        setShowAddModal(false);
        setFormData(emptyForm);
      },
    });
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    updateMutation.mutate(
      {
        id: selectedUser.id,
        payload: { role: selectedUser.role, is_active: selectedUser.is_active },
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setSelectedUser(null);
        },
      },
    );
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Delete this user? This cannot be undone.')) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1 fw-bold">User Management</h1>
            <p className="text-muted small mb-0">Manage system users and roles</p>
          </div>
          <button
            type="button"
            className="btn btn-cbu text-white"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} className="me-2" /> Add User
          </button>
        </div>

        {isError && (
          <div className="alert alert-danger" role="alert">
            Failed to load users. Please try again.
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {isLoading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : users.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-semibold">Username</th>
                    <th className="text-muted small fw-semibold">Email</th>
                    <th className="text-muted small fw-semibold">Role</th>
                    <th className="text-muted small fw-semibold">Department</th>
                    <th className="text-muted small fw-semibold">Status</th>
                    <th className="text-muted small fw-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="small fw-semibold">{user.username}</td>
                      <td className="small text-muted">{user.email}</td>
                      <td className="small">
                        <span className={`badge bg-${roleColors[user.role]}`}>{user.role}</span>
                      </td>
                      <td className="small text-muted">{user.department || '—'}</td>
                      <td className="small">
                        <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="small">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          aria-label={`Edit ${user.username}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteMutation.isPending}
                          aria-label={`Delete ${user.username}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                icon={<People size={32} />}
                title="No users found"
                action={
                  <button
                    type="button"
                    className="btn btn-sm btn-cbu text-white mt-2"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add First User
                  </button>
                }
              />
            )}
          </div>
        </div>

        {showAddModal && (
          <>
            <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0">
                  <div className="modal-header border-0 bg-light">
                    <h5 className="modal-title fw-semibold">Add New User</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowAddModal(false)}
                      aria-label="Close"
                    />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label small fw-semibold">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        className="form-control"
                        value={formData.username}
                        onChange={(event) =>
                          setFormData({ ...formData, username: event.target.value })
                        }
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label small fw-semibold">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(event) =>
                          setFormData({ ...formData, email: event.target.value })
                        }
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label small fw-semibold">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(event) =>
                          setFormData({ ...formData, password: event.target.value })
                        }
                        placeholder="Enter password"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="role" className="form-label small fw-semibold">
                        Role
                      </label>
                      <select
                        id="role"
                        className="form-select"
                        value={formData.role}
                        onChange={(event) =>
                          setFormData({ ...formData, role: event.target.value as UserRole })
                        }
                      >
                        {USER_ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-cbu text-white"
                      onClick={handleAddUser}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" onClick={() => setShowAddModal(false)} />
          </>
        )}

        {showEditModal && selectedUser && (
          <>
            <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0">
                  <div className="modal-header border-0 bg-light">
                    <h5 className="modal-title fw-semibold">Edit User</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowEditModal(false)}
                      aria-label="Close"
                    />
                  </div>
                  <div className="modal-body">
                    <p className="small text-muted mb-3">
                      User: <strong>{selectedUser.username}</strong>
                    </p>
                    <div className="mb-3">
                      <label htmlFor="editRole" className="form-label small fw-semibold">
                        Role
                      </label>
                      <select
                        id="editRole"
                        className="form-select"
                        value={selectedUser.role}
                        onChange={(event) =>
                          setSelectedUser({
                            ...selectedUser,
                            role: event.target.value as UserRole,
                          })
                        }
                      >
                        {USER_ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="activeToggle"
                        checked={selectedUser.is_active}
                        onChange={(event) =>
                          setSelectedUser({
                            ...selectedUser,
                            is_active: event.target.checked,
                          })
                        }
                      />
                      <label className="form-check-label small fw-semibold" htmlFor="activeToggle">
                        Active
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-cbu text-white"
                      onClick={handleEditUser}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" onClick={() => setShowEditModal(false)} />
          </>
        )}
      </div>
    </Layout>
  );
}
