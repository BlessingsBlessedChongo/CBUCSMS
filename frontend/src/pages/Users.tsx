import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { UserRole } from '../types';
import { Plus, Pencil, Trash2, People } from 'react-bootstrap-icons';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
}

export default function Users() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'DEPARTMENT' as UserRole });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users/');
      return res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (newUser: any) => api.post('/users/', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAddModal(false);
      setFormData({ username: '', email: '', password: '', role: 'DEPARTMENT' });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedUser: any) =>
      api.patch(`/users/${updatedUser.id}/`, { role: updatedUser.role, is_active: updatedUser.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/users/${userId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete user');
    },
  });

  const handleAddUser = () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Username, email, and password are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditUser = () => {
    if (selectedUser) {
      updateMutation.mutate(selectedUser);
    }
  };

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'danger',
    MANAGER: 'primary',
    PROCUREMENT: 'warning',
    CFO: 'info',
    STOREKEEPER: 'success',
    DEPARTMENT: 'secondary',
  };

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1 fw-700">User Management</h1>
            <p className="text-muted small mb-0">Manage system users and roles</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="me-2" /> Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {isLoading ? (
              <div className="p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : users.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-600">Username</th>
                    <th className="text-muted small fw-600">Email</th>
                    <th className="text-muted small fw-600">Role</th>
                    <th className="text-muted small fw-600">Department</th>
                    <th className="text-muted small fw-600">Status</th>
                    <th className="text-muted small fw-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="small fw-600">{user.username}</td>
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
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            if (confirm('Delete this user? This cannot be undone.')) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5 text-center">
                <People size={32} className="text-muted mb-3" />
                <p className="text-muted">No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0">
                <div className="modal-header border-0 bg-light">
                  <h5 className="modal-title fw-600">Add New User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-600">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-600">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-600">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-600">Role</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="PROCUREMENT">Procurement</option>
                      <option value="CFO">CFO</option>
                      <option value="STOREKEEPER">Storekeeper</option>
                      <option value="DEPARTMENT">Department</option>
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
                    className="btn btn-primary"
                    onClick={handleAddUser}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0">
                <div className="modal-header border-0 bg-light">
                  <h5 className="modal-title fw-600">Edit User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <p className="small text-muted mb-3">User: <strong>{selectedUser.username}</strong></p>
                  <div className="mb-3">
                    <label className="form-label small fw-600">Role</label>
                    <select
                      className="form-select"
                      value={selectedUser.role}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          role: e.target.value as UserRole,
                        })
                      }
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="PROCUREMENT">Procurement</option>
                      <option value="CFO">CFO</option>
                      <option value="STOREKEEPER">Storekeeper</option>
                      <option value="DEPARTMENT">Department</option>
                    </select>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activeToggle"
                      checked={selectedUser.is_active}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          is_active: e.target.checked,
                        })
                      }
                    />
                    <label className="form-check-label small fw-600" htmlFor="activeToggle">
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
                    className="btn btn-primary"
                    onClick={handleEditUser}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Backdrops */}
        {(showAddModal || showEditModal) && (
          <div
            className="modal-backdrop fade show"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
