import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal';
import './ManagementPages.css';
import { getUsers, createUser, updateUser, deleteUser } from '../api/userApi';
import { getLocations } from '../api/locationApi';

const initialForm = {
  id: null,
  name: '',
  email: '',
  role: 'admin',
  location_id: '',
  password: '',
};

const UsersPage = ({ onNotify, isSuperAdmin }) => {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const activeLocations = useMemo(
    () => locations.filter((loc) => !loc.is_deleted),
    [locations]
  );

  const locationName = useCallback(
    (id) => activeLocations.find((loc) => String(loc.id) === String(id))?.name || '—',
    [activeLocations]
  );

  const loadLocations = useCallback(async () => {
    try {
      const res = await getLocations({ include_deleted: false });
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Locations', 'Failed to load locations', undefined, { durationMs: 4000 });
    }
  }, [onNotify]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role: 'admin' };
      if (filterLocation) {
        params.location_id = filterLocation;
      }
      const res = await getUsers(params);
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      onNotify?.('error', 'Users', 'Failed to load users', undefined, { durationMs: 4000 });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filterLocation, onNotify]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadLocations();
    }
    loadUsers();
  }, [isSuperAdmin, loadLocations, loadUsers]);

  const openCreateModal = () => {
    setForm(initialForm);
    setErrors({});
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setForm({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'admin',
      location_id: user.location_id || '',
      password: '',
    });
    setErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = 'Name is required';
    }
    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Provide a valid email';
    }
    if (form.role === 'admin' && !form.location_id) {
      next.location_id = 'Location is required for admins';
    }
    if (modalMode === 'create' && !form.password.trim()) {
      next.password = 'Password is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        location_id: form.role === 'admin' ? form.location_id || null : null,
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (modalMode === 'create') {
        await createUser(payload);
        onNotify?.('success', 'User Created', 'User has been created successfully.');
      } else {
        await updateUser(form.id, payload);
        onNotify?.('success', 'User Updated', 'User has been updated successfully.');
      }
      setShowModal(false);
      setForm(initialForm);
      loadUsers();
    } catch (error) {
      const detail = error.response?.data?.detail || error.response?.data?.error;
      onNotify?.('error', 'Save Failed', detail || 'Unable to save user details.', undefined, {
        durationMs: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"?`)) {
      return;
    }
    try {
      await deleteUser(user.id);
      onNotify?.('success', 'User Deleted', 'User has been deleted successfully.');
      loadUsers();
    } catch (error) {
      onNotify?.('error', 'Delete Failed', 'Unable to delete user.', undefined, { durationMs: 5000 });
    }
  };

  return (
    <div className="management-page">
      <div className="management-header">
        <h2 className="management-title">Users</h2>
        <div className="management-actions">
          {isSuperAdmin && (
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="">All locations</option>
              {activeLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={openCreateModal}>
            + Create user
          </button>
        </div>
      </div>

      <div className="management-card">
        <div className="management-card-scroll">
        {loading ? (
          <div className="management-empty">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="management-empty">No users found.</div>
        ) : (
          <div className="management-table-wrapper limited mobile-auto">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Name">{user.name || '—'}</td>
                    <td data-label="Email">{user.email || '—'}</td>
                    <td data-label="Role">{user.role}</td>
                    <td data-label="Location">{user.role === 'admin' ? locationName(user.location_id) : '—'}</td>
                    <td data-label="Actions" className="actions">
                      <button type="button" className="edit" onClick={() => openEditModal(user)}>
                        Edit
                      </button>
                      <button type="button" className="delete" onClick={() => handleDelete(user)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {showModal && (
        <Modal
          title={modalMode === 'create' ? 'Create user' : 'Edit user'}
          onClose={() => setShowModal(false)}
          actions={
            <>
              <button type="button" className="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" form="user-form" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="user-form" className="management-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </label>
            <label>
              Role
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </label>
            {form.role === 'admin' && (
              <label>
                Location
                <select name="location_id" value={form.location_id} onChange={handleChange}>
                  <option value="">Select location</option>
                  {activeLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                {errors.location_id && <div className="form-error">{errors.location_id}</div>}
              </label>
            )}
            <label>
              Password{modalMode === 'edit' && ' (optional)'}
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={modalMode === 'edit' ? 'Leave blank to keep current password' : '********'}
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
