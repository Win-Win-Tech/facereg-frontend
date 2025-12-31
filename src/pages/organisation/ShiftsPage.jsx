import React, { useCallback, useEffect, useState, useMemo } from 'react';
import FormModal from '../../components/FormModal';
import DataTable from '../../components/DataTable';
import '../../styles/ManagementPages.css';
import { getShifts, createShift, updateShift, deleteShift } from '../../api/shiftApi';
import { getLocations } from '../../api/locationApi';
import { useAuthContext } from '../../contexts/AuthContext';

const ShiftsPage = ({ onNotify }) => {
  const { locationId, role } = useAuthContext();
  const isSuperAdmin = role === 'superadmin';

  // Shifts state
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState('create');
  const [shiftForm, setShiftForm] = useState({
    id: null,
    shift_name: '',
    start_time: '',
    end_time: '',
    grace_timing: 30,
    location_id: '',
  });
  const [shiftSubmitting, setShiftSubmitting] = useState(false);
  const [shiftErrors, setShiftErrors] = useState({});

  // Location filter state
  const [locations, setLocations] = useState([]);
  // For admin users, initialize with their locationId to avoid calling API without location_id
  const [filterLocation, setFilterLocation] = useState(isSuperAdmin ? '' : (locationId || ''));

  const loadLocations = useCallback(async () => {
    if (isSuperAdmin) {
      try {
        const res = await getLocations({ include_deleted: false });
        if (Array.isArray(res.data)) {
          setLocations(res.data);
          // Don't auto-set filterLocation - let user choose "All Locations" or a specific location
        }
      } catch (error) {
        onNotify?.('error', 'Locations', 'Failed to load locations', undefined, { durationMs: 4000 });
      }
    } else {
      // For non-superadmin, load their location info and set it as filter
      if (locationId) {
        try {
          const res = await getLocations({ id: locationId, include_deleted: false });
          if (Array.isArray(res.data) && res.data.length > 0) {
            setLocations(res.data);
          }
          // Non-superadmin always filters by their location - ensure it's set
          if (filterLocation !== locationId) {
            setFilterLocation(locationId);
          }
        } catch (error) {
          onNotify?.('error', 'Locations', 'Failed to load location', undefined, { durationMs: 4000 });
        }
      }
    }
  }, [isSuperAdmin, locationId, filterLocation, onNotify]);

  const loadShifts = useCallback(async () => {
    setShiftsLoading(true);
    try {
      // For admin users, always include their location_id
      // For superadmin, only include location_id if filterLocation is set
      const params = {};
      if (!isSuperAdmin && locationId) {
        // Admin: always filter by their location
        params.location_id = locationId;
      } else if (isSuperAdmin && filterLocation) {
        // Superadmin: only filter if a location is selected
        params.location_id = filterLocation;
      }
      
      const res = await getShifts(params);
      if (Array.isArray(res.data)) {
        setShifts(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Shifts', 'Failed to load shifts', undefined, { durationMs: 4000 });
    } finally {
      setShiftsLoading(false);
    }
  }, [filterLocation, isSuperAdmin, locationId, onNotify]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    // Load shifts when filterLocation changes (including empty string for "All Locations")
    // For admin users, this will always include their locationId
    loadShifts();
  }, [filterLocation, loadShifts]);

  // Shift handlers
  const openCreateShiftModal = () => {
    setShiftForm({ 
      id: null, 
      shift_name: '', 
      start_time: '', 
      end_time: '', 
      grace_timing: 30,
      location_id: isSuperAdmin ? '' : (filterLocation || locationId || '')
    });
    setShiftErrors({});
    setShiftModalMode('create');
    setShowShiftModal(true);
  };

  const openEditShiftModal = (shift) => {
    // Extract location ID - could be in shift.location or shift.location_id
    const shiftLocationId = shift.location || shift.location_id || '';
    // Convert to string to ensure it matches select option values
    const locationIdValue = shiftLocationId ? String(shiftLocationId) : (isSuperAdmin ? '' : (filterLocation || locationId || ''));
    
    setShiftForm({
      id: shift.id,
      shift_name: shift.shift_name || '',
      start_time: shift.start_time || '',
      end_time: shift.end_time || '',
      grace_timing: shift.grace_timing || 30,
      location_id: locationIdValue,
    });
    setShiftErrors({});
    setShiftModalMode('edit');
    setShowShiftModal(true);
  };

  const validateShift = () => {
    const next = {};
    if (!shiftForm.shift_name.trim()) next.shift_name = 'Shift name is required';
    if (!shiftForm.start_time) next.start_time = 'Start time is required';
    if (!shiftForm.end_time) next.end_time = 'End time is required';
    if (!shiftForm.location_id) next.location_id = 'Location is required';
    setShiftErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleShiftSubmit = async () => {
    if (!validateShift()) return;

    setShiftSubmitting(true);
    try {
      const payload = {
        shift_name: shiftForm.shift_name.trim(),
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        grace_timing: shiftForm.grace_timing || 30,
        location: shiftForm.location_id,
      };

      if (shiftModalMode === 'create') {
        await createShift(payload);
        onNotify?.('success', 'Shift Created', 'Shift has been created.');
      } else {
        await updateShift(shiftForm.id, payload);
        onNotify?.('success', 'Shift Updated', 'Shift has been updated.');
      }
      setShowShiftModal(false);
      loadShifts();
    } catch (error) {
      onNotify?.('error', 'Save Failed', 'Unable to save shift.', undefined, { durationMs: 5000 });
    } finally {
      setShiftSubmitting(false);
    }
  };

  const handleShiftDelete = async (shift) => {
    if (!window.confirm(`Delete shift "${shift.shift_name}"?`)) {
      return;
    }
    try {
      await deleteShift(shift.id);
      onNotify?.('success', 'Shift Deleted', 'Shift has been deleted.');
      loadShifts();
    } catch (error) {
      onNotify?.('error', 'Delete Failed', 'Unable to delete shift.', undefined, { durationMs: 5000 });
    }
  };

  // Compute shift fields dynamically to ensure location options are current
  const shiftFields = useMemo(() => [
    {
      name: 'location_id',
      type: 'select',
      label: 'Location',
      placeholder: 'Select location',
      options: isSuperAdmin 
        ? locations.map(loc => ({ value: loc.id, label: loc.name }))
        : (locationId ? [{ value: locationId, label: locations.find(l => l.id === locationId)?.name || 'My Location' }] : []),
      disabled: !isSuperAdmin,
    },
    {
      name: 'shift_name',
      type: 'text',
      label: 'Shift Name',
      placeholder: 'e.g., Morning Shift',
    },
    {
      name: 'start_time',
      type: 'time',
      label: 'Start Time',
    },
    {
      name: 'end_time',
      type: 'time',
      label: 'End Time',
    },
    {
      name: 'grace_timing',
      type: 'number',
      label: 'Grace Time (minutes)',
      placeholder: '30',
    },
  ], [isSuperAdmin, locations, locationId]);

  const shiftTableColumns = [
    { key: 'shift_name', label: 'Shift Name' },
    { key: 'location_name', label: 'Location' },
    { key: 'start_time', label: 'Start Time' },
    { key: 'end_time', label: 'End Time' },
  ];

  const shiftTableActions = [
    { label: 'Edit', className: 'edit', onClick: openEditShiftModal },
    { label: 'Delete', className: 'delete', onClick: handleShiftDelete },
  ];

  return (
    <div className="management-page">
      <div className="management-card">
        <div className="management-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Shifts</h3>
            {isSuperAdmin ? (
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            ) : (
              <div style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#f3f4f6',
                fontSize: '0.9rem',
                color: '#6b7280',
              }}>
                {locations.find(l => l.id === filterLocation)?.name || 'My Location'}
              </div>
            )}
          </div>
          <div className="management-actions">
            <button type="button" onClick={openCreateShiftModal}>
              + Create shift
            </button>
          </div>
        </div>
        <div className="management-card-scroll">
          {shiftsLoading ? (
            <div className="management-empty">Loading shifts…</div>
          ) : shifts.length === 0 ? (
            <div className="management-empty">No shifts found.</div>
          ) : (
            <DataTable
              columns={shiftTableColumns}
              data={shifts}
              isLoading={shiftsLoading}
              emptyMessage="No shifts found."
              actions={shiftTableActions}
              rowKey="id"
            />
          )}
        </div>
      </div>

      {/* Shift Modal */}
      <FormModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        mode={shiftModalMode}
        title={shiftModalMode === 'create' ? 'Create shift' : 'Edit shift'}
        formData={shiftForm}
        onFormDataChange={setShiftForm}
        errors={shiftErrors}
        fields={shiftFields}
        isSubmitting={shiftSubmitting}
        onSubmit={handleShiftSubmit}
      />
    </div>
  );
};

export default ShiftsPage;
