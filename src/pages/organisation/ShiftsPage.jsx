import React, { useCallback, useEffect, useState } from 'react';
import FormModal from '../../components/FormModal';
import DataTable from '../../components/DataTable';
import '../../styles/ManagementPages.css';
import { getShifts, createShift, updateShift, deleteShift } from '../../api/shiftApi';
import { useAuthContext } from '../../contexts/AuthContext';

const ShiftsPage = ({ onNotify }) => {
  const { locationId } = useAuthContext();

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
  });
  const [shiftSubmitting, setShiftSubmitting] = useState(false);
  const [shiftErrors, setShiftErrors] = useState({});

  const loadShifts = useCallback(async () => {
    setShiftsLoading(true);
    try {
      // If the user is scoped to a location, load only shifts that
      // are actually used by sites in that location. Otherwise load all.
      const params = locationId ? { location_id: locationId } : {};
      const res = await getShifts(params);
      if (Array.isArray(res.data)) {
        setShifts(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Shifts', 'Failed to load shifts', undefined, { durationMs: 4000 });
    } finally {
      setShiftsLoading(false);
    }
  }, [locationId, onNotify]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // Shift handlers
  const openCreateShiftModal = () => {
    setShiftForm({ id: null, shift_name: '', start_time: '', end_time: '', grace_timing: 30 });
    setShiftErrors({});
    setShiftModalMode('create');
    setShowShiftModal(true);
  };

  const openEditShiftModal = (shift) => {
    setShiftForm({
      id: shift.id,
      shift_name: shift.shift_name || '',
      start_time: shift.start_time || '',
      end_time: shift.end_time || '',
      grace_timing: shift.grace_timing || 30,
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

  const shiftFields = [
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
  ];

  const shiftTableColumns = [
    { key: 'shift_name', label: 'Shift Name' },
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
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Shifts</h3>
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
