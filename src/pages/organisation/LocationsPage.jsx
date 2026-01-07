import React, { useCallback, useEffect, useState } from 'react';
import FormModal from '../../components/FormModal';
import DataTable from '../../components/DataTable';
import '../../styles/ManagementPages.css';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../../api/locationApi';
import { useAuthContext } from '../../contexts/AuthContext';

const LocationsPage = ({ onNotify }) => {
  const { locationId } = useAuthContext();

  // Locations state
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalMode, setLocationModalMode] = useState('create');
  const [locationForm, setLocationForm] = useState({ id: null, name: '' });
  const [locationSubmitting, setLocationSubmitting] = useState(false);
  const [locationErrors, setLocationErrors] = useState({});

  const loadLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      // If user has a location_id, show only that location; otherwise show all (super admin)
      const params = locationId ? { id: locationId, include_deleted: false } : { include_deleted: false };
      const res = await getLocations(params);
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Locations', 'Failed to load locations', undefined, { durationMs: 4000 });
    } finally {
      setLocationsLoading(false);
    }
  }, [locationId, onNotify]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Location handlers
  const openCreateLocationModal = () => {
    setLocationForm({ id: null, name: '' });
    setLocationErrors({});
    setLocationModalMode('create');
    setShowLocationModal(true);
  };

  const openEditLocationModal = (loc) => {
    setLocationForm({ id: loc.id, name: loc.name || '' });
    setLocationErrors({});
    setLocationModalMode('edit');
    setShowLocationModal(true);
  };

  const validateLocation = () => {
    const next = {};
    if (!locationForm.name.trim()) {
      next.name = 'Name is required';
    }
    setLocationErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLocationSubmit = async () => {
    if (!validateLocation()) return;

    setLocationSubmitting(true);
    try {
      if (locationModalMode === 'create') {
        await createLocation({ name: locationForm.name.trim() });
        onNotify?.('success', 'Location Created', 'Location has been created.');
      } else {
        await updateLocation(locationForm.id, { name: locationForm.name.trim() });
        onNotify?.('success', 'Location Updated', 'Location has been updated.');
      }
      setShowLocationModal(false);
      loadLocations();
    } catch (error) {
      onNotify?.('error', 'Save Failed', 'Unable to save location.', undefined, { durationMs: 5000 });
    } finally {
      setLocationSubmitting(false);
    }
  };

  const handleLocationDelete = async (loc) => {
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

  const locationFields = [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      placeholder: 'Office name',
    },
  ];

  const locationTableColumns = [
    { key: 'name', label: 'Name' },
    // {
    //   key: 'created_at',
    //   label: 'Created',
    //   render: (value) => (value ? new Date(value).toLocaleString() : '—'),
    // },
    // {
    //   key: 'updated_at',
    //   label: 'Updated',
    //   render: (value) => (value ? new Date(value).toLocaleString() : '—'),
    // },
  ];

  const locationTableActions = [
    {
      label: 'Edit',
      className: 'edit',
      onClick: openEditLocationModal,
    },
    {
      label: 'Delete',
      className: 'delete',
      onClick: handleLocationDelete,
    },
  ];

  return (
    <div className="management-page">
      <div className="management-card">
        <div className="management-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Locations</h3>
          <div className="management-actions">
            <button type="button" onClick={openCreateLocationModal}>
              + Create location
            </button>
          </div>
        </div>
        <div className="management-card-scroll">
          <DataTable
            columns={locationTableColumns}
            data={locations}
            isLoading={locationsLoading}
            emptyMessage="No locations found."
            actions={locationTableActions}
            rowKey="id"
          />
        </div>
      </div>

      {/* Location Modal */}
      <FormModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        mode={locationModalMode}
        title={locationModalMode === 'create' ? 'Create location' : 'Edit location'}
        formData={locationForm}
        onFormDataChange={setLocationForm}
        errors={locationErrors}
        fields={locationFields}
        isSubmitting={locationSubmitting}
        onSubmit={handleLocationSubmit}
      />
    </div>
  );
};

export default LocationsPage;
