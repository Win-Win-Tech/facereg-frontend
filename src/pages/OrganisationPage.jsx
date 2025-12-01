import React, { useCallback, useEffect, useState } from 'react';
import Modal from '../components/Modal';
import './ManagementPages.css';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../api/locationApi';

const OrganisationPage = ({ onNotify }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm] = useState({ id: null, name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLocations({ include_deleted: false });
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Locations', 'Failed to load locations', undefined, { durationMs: 4000 });
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const openCreateModal = () => {
    setForm({ id: null, name: '' });
    setErrors({});
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (loc) => {
    setForm({ id: loc.id, name: loc.name || '' });
    setErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = 'Name is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createLocation({ name: form.name.trim() });
        onNotify?.('success', 'Location Created', 'Location has been created.');
      } else {
        await updateLocation(form.id, { name: form.name.trim() });
        onNotify?.('success', 'Location Updated', 'Location has been updated.');
      }
      setShowModal(false);
      loadLocations();
    } catch (error) {
      onNotify?.('error', 'Save Failed', 'Unable to save location.', undefined, { durationMs: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (loc) => {
    if (!window.confirm(`Delete location "${loc.name}"?`)) {
      return;
    }
    try {
      await deleteLocation(loc.id);
      onNotify?.('success', 'Location Deleted', 'Location has been deleted.');
      loadLocations();
    } catch (error) {
      onNotify?.('error', 'Delete Failed', 'Unable to delete location.', undefined, { durationMs: 5000 });
    }
  };

  return (
    <div className="management-page">
      <div className="management-header">
        <h2 className="management-title">Organisation</h2>
        <div className="management-actions">
          <button type="button" onClick={openCreateModal}>
            + Create location
          </button>
        </div>
      </div>

      <div className="management-card">
        <div className="management-card-scroll">
        {loading ? (
          <div className="management-empty">Loading locations…</div>
        ) : locations.length === 0 ? (
          <div className="management-empty">No locations found.</div>
        ) : (
          <div className="management-table-wrapper limited mobile-auto">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id}>
                    <td data-label="Name">{loc.name}</td>
                    <td data-label="Created">{loc.created_at ? new Date(loc.created_at).toLocaleString() : '—'}</td>
                    <td data-label="Updated">{loc.updated_at ? new Date(loc.updated_at).toLocaleString() : '—'}</td>
                    <td data-label="Actions" className="actions">
                      <button type="button" className="edit" onClick={() => openEditModal(loc)}>
                        Edit
                      </button>
                      <button type="button" className="delete" onClick={() => handleDelete(loc)}>
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
          title={modalMode === 'create' ? 'Create location' : 'Edit location'}
          onClose={() => setShowModal(false)}
          actions={
            <>
              <button type="button" className="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" form="location-form" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="location-form" className="management-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Office name"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OrganisationPage;
