import React, { useCallback, useEffect, useState } from 'react';
import FormModal from '../../components/FormModal';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import '../../styles/ManagementPages.css';
import { getSites, createSite, updateSite, deleteSite, assignShiftsToSite } from '../../api/siteApi';
import { getLocations } from '../../api/locationApi';
import { getShifts, createShift } from '../../api/shiftApi';
import { useAuthContext } from '../../contexts/AuthContext';

const SitesPage = ({ onNotify }) => {
  const { locationId } = useAuthContext();

  // Sites state
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteModalMode, setSiteModalMode] = useState('create');
  const [siteForm, setSiteForm] = useState({
    id: null,
    site_name: '',
    latitude: '',
    longitude: '',
    distance_meters: '',
    shift_ids: [],
    location_id: '',
  });
  const [siteSubmitting, setSiteSubmitting] = useState(false);
  const [siteErrors, setSiteErrors] = useState({});

  // Locations and Shifts state
  const [locations, setLocations] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Bulk Site Shift Assignment state
  const [showBulkSiteShiftModal, setShowBulkSiteShiftModal] = useState(false);
  const [selectedSiteForShifts, setSelectedSiteForShifts] = useState(null);
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [bulkSiteShiftSubmitting, setBulkSiteShiftSubmitting] = useState(false);

  // Shift Creation Modal state
  const [showShiftCreationModal, setShowShiftCreationModal] = useState(false);
  const [shiftCreationForm, setShiftCreationForm] = useState({
    shift_name: '',
    start_time: '',
    end_time: '',
    grace_timing: 30,
  });
  const [shiftCreationErrors, setShiftCreationErrors] = useState({});
  const [shiftCreationSubmitting, setShiftCreationSubmitting] = useState(false);

  const loadSites = useCallback(async () => {
    setSitesLoading(true);
    try {
      const params = locationId ? { location: locationId } : {};
      const res = await getSites(params);
      if (Array.isArray(res.data)) {
        const filteredSites = locationId
          ? res.data.filter((site) => String(site.location) === String(locationId))
          : res.data;
        setSites(filteredSites);
      }
    } catch (error) {
      onNotify?.('error', 'Sites', 'Failed to load sites', undefined, { durationMs: 4000 });
    } finally {
      setSitesLoading(false);
    }
  }, [locationId, onNotify]);

  const loadLocations = useCallback(async () => {
    try {
      const params = locationId ? { id: locationId, include_deleted: false } : { include_deleted: false };
      const res = await getLocations(params);
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Locations', 'Failed to load locations', undefined, { durationMs: 4000 });
    }
  }, [locationId, onNotify]);

  // const loadShifts = useCallback(async (filterLocationId = locationId) => {
  const loadShifts = useCallback(async (filterLocationId = locationId) => {
    try {
      // const params = filterLocationId ? { location_id: filterLocationId } : {};
      const params = filterLocationId ? { location_id: filterLocationId } : {};
      const res = await getShifts(params);
      if (Array.isArray(res.data)) {
        setShifts(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Shifts', 'Failed to load shifts', undefined, { durationMs: 4000 });
    }
  }, [locationId, onNotify]);

  useEffect(() => {
    loadSites();
    loadLocations();
    loadShifts();
  }, [loadSites, loadLocations, loadShifts]);

  // Site handlers
  const openCreateSiteModal = () => {
    setSiteForm({
      id: null,
      site_name: '',
      latitude: '',
      longitude: '',
      distance_meters: '',
      shift_ids: [],
      location_id: locationId || '',
    });
    setSiteErrors({});
    setSiteModalMode('create');
    setShowSiteModal(true);
    if (locationId) {
      loadShifts(locationId);
    }
  };

  const handleLocationChange = (newLocationId) => {
    setSiteForm((prev) => ({ ...prev, location_id: newLocationId }));
    if (newLocationId) {
      loadShifts(newLocationId);
    }
  };

  const openEditSiteModal = (site) => {
    setSiteForm({
      id: site.id,
      site_name: site.site_name || '',
      latitude: site.latitude || '',
      longitude: site.longitude || '',
      distance_meters: site.distance_meters || '',
      location_id: site.location || '',
      shift_ids: site.shift_ids || [],
    });
    setSiteErrors({});
    setSiteModalMode('edit');
    setShowSiteModal(true);
    if (site.location) {
      loadShifts(site.location);
    }
  };

  const validateSite = () => {
    const next = {};
    if (!siteForm.location_id) next.location_id = 'Location is required';
    if (!siteForm.site_name.trim()) next.site_name = 'Site name is required';
    if (!siteForm.latitude) next.latitude = 'Latitude is required';
    if (!siteForm.longitude) next.longitude = 'Longitude is required';
    if (!siteForm.distance_meters) next.distance_meters = 'Radius is required';
    setSiteErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSiteSubmit = async () => {
    if (!validateSite()) return;

    setSiteSubmitting(true);
    try {
      const payload = {
        site_name: siteForm.site_name.trim(),
        latitude: parseFloat(siteForm.latitude),
        longitude: parseFloat(siteForm.longitude),
        distance_meters: parseFloat(siteForm.distance_meters),
        location: siteForm.location_id,
        shift_ids: siteForm.shift_ids || [],
      };

      if (siteModalMode === 'create') {
        await createSite(payload);
        onNotify?.('success', 'Site Created', 'Site has been created.');
      } else {
        await updateSite(siteForm.id, payload);
        onNotify?.('success', 'Site Updated', 'Site has been updated.');
      }
      setShowSiteModal(false);
      loadSites();
    } catch (error) {
      onNotify?.('error', 'Save Failed', 'Unable to save site.', undefined, { durationMs: 5000 });
    } finally {
      setSiteSubmitting(false);
    }
  };

  const handleSiteDelete = async (site) => {
    if (!window.confirm(`Delete site "${site.site_name}"?`)) {
      return;
    }
    try {
      await deleteSite(site.id);
      onNotify?.('success', 'Site Deleted', 'Site has been deleted.');
      loadSites();
    } catch (error) {
      onNotify?.('error', 'Delete Failed', 'Unable to delete site.', undefined, { durationMs: 5000 });
    }
  };

  // Bulk Site Shift Assignment handlers
  const openBulkSiteShiftModal = (site) => {
    setSelectedSiteForShifts(site);
    setSelectedShiftIds(site.shifts ? site.shifts.map((s) => s.id) : site.shift_ids || []);
    setShowBulkSiteShiftModal(true);
  };

  const handleShiftToggleForSite = (shiftId) => {
    setSelectedShiftIds((prev) =>
      prev.includes(shiftId) ? prev.filter((id) => id !== shiftId) : [...prev, shiftId]
    );
  };

  const handleBulkSiteShiftSubmit = async () => {
    if (!selectedSiteForShifts) return;

    setBulkSiteShiftSubmitting(true);
    try {
      await assignShiftsToSite(selectedSiteForShifts.id, { shift_ids: selectedShiftIds });

      onNotify?.('success', 'Shifts Assigned', `${selectedShiftIds.length} shift(s) assigned to "${selectedSiteForShifts.site_name}".`);
      setShowBulkSiteShiftModal(false);
      loadSites();
    } catch (error) {
      onNotify?.('error', 'Bulk Assignment Failed', 'Unable to assign shifts to site.', undefined, { durationMs: 5000 });
    } finally {
      setBulkSiteShiftSubmitting(false);
    }
  };

  // Shift Creation handlers
  const validateShiftCreation = () => {
    const next = {};
    if (!shiftCreationForm.shift_name.trim()) next.shift_name = 'Shift name is required';
    if (!shiftCreationForm.start_time) next.start_time = 'Start time is required';
    if (!shiftCreationForm.end_time) next.end_time = 'End time is required';
    setShiftCreationErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleShiftCreationSubmit = async () => {
    if (!validateShiftCreation()) return;

    setShiftCreationSubmitting(true);
    try {
      const selectedLocationId = siteForm.location_id || locationId || null;
      const payload = {
        shift_name: shiftCreationForm.shift_name.trim(),
        start_time: shiftCreationForm.start_time,
        end_time: shiftCreationForm.end_time,
        grace_timing: shiftCreationForm.grace_timing || 30,
        location_id: selectedLocationId,
      };

      await createShift(payload);
      onNotify?.('success', 'Shift Created', 'Shift has been created successfully.');
      setShiftCreationForm({ shift_name: '', start_time: '', end_time: '', grace_timing: 30 });
      setShiftCreationErrors({});
      setShowShiftCreationModal(false);
      loadShifts(selectedLocationId);
    } catch (error) {
      onNotify?.('error', 'Save Failed', 'Unable to create shift.', undefined, { durationMs: 5000 });
    } finally {
      setShiftCreationSubmitting(false);
    }
  };

  const shiftCreationFields = [
    {
      name: 'location_name',
      type: 'text',
      label: 'Location',
      placeholder: 'Location',
      disabled: true,
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
  ];

  const siteTableColumns = [
    { key: 'site_name', label: 'Site Name' },
    { key: 'location_name', label: 'Location Name' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'distance_meters', label: 'Radius (m)' },
  ];

  const siteTableActions = [
    { label: 'Edit', className: 'edit', onClick: openEditSiteModal },
    { label: 'Delete', className: 'delete', onClick: handleSiteDelete },
  ];

  return (
    <div className="management-page">
      <div className="management-card">
        <div className="management-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Sites</h3>
          <div className="management-actions">
            <button type="button" onClick={openCreateSiteModal}>
              + Create site
            </button>
          </div>
        </div>
        <div className="management-card-scroll">
          {sitesLoading ? (
            <div className="management-empty">Loading sites…</div>
          ) : sites.length === 0 ? (
            <div className="management-empty">No sites found.</div>
          ) : (
            <DataTable
              columns={siteTableColumns}
              data={sites}
              isLoading={sitesLoading}
              emptyMessage="No sites found."
              actions={siteTableActions}
              rowKey="id"
            />
          )}
        </div>
      </div>

      {/* Site Modal */}
      {showSiteModal && (
        <Modal
          title={siteModalMode === 'create' ? 'Create site' : 'Edit site'}
          onClose={() => setShowSiteModal(false)}
          actions={
            <>
              <button type="button" className="secondary" onClick={() => setShowSiteModal(false)}>
                Cancel
              </button>
              <button type="submit" form="site-form" disabled={siteSubmitting}>
                {siteSubmitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="site-form" className="management-form" onSubmit={handleSiteSubmit}>
            <label>
              Location
              <select
                name="location_id"
                value={siteForm.location_id}
                onChange={(e) => handleLocationChange(e.target.value)}
                disabled={locationId !== null && locationId !== undefined}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              {siteErrors.location_id && <div className="form-error">{siteErrors.location_id}</div>}
            </label>
            <label>
              Site Name
              <input
                name="site_name"
                value={siteForm.site_name}
                onChange={(e) => setSiteForm((prev) => ({ ...prev, site_name: e.target.value }))}
                placeholder="e.g., Office Main Branch"
              />
              {siteErrors.site_name && <div className="form-error">{siteErrors.site_name}</div>}
            </label>
            
            <label>
              Latitude
              <input
                name="latitude"
                type="number"
                step="0.000001"
                value={siteForm.latitude}
                onChange={(e) => setSiteForm((prev) => ({ ...prev, latitude: e.target.value }))}
                placeholder="e.g., 28.6139"
              />
              {siteErrors.latitude && <div className="form-error">{siteErrors.latitude}</div>}
            </label>
            <label>
              Longitude
              <input
                name="longitude"
                type="number"
                step="0.000001"
                value={siteForm.longitude}
                onChange={(e) => setSiteForm((prev) => ({ ...prev, longitude: e.target.value }))}
                placeholder="e.g., 77.2090"
              />
              {siteErrors.longitude && <div className="form-error">{siteErrors.longitude}</div>}
            </label>
            <label>
              Radius (meters)
              <input
                name="distance_meters"
                type="number"
                value={siteForm.distance_meters}
                onChange={(e) => setSiteForm((prev) => ({ ...prev, distance_meters: e.target.value }))}
                placeholder="e.g., 100"
              />
              {siteErrors.distance_meters && <div className="form-error">{siteErrors.distance_meters}</div>}
            </label>
            <label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span>Assign Shifts</span>
                <button
                  type="button"
                  onClick={() => setShowShiftCreationModal(true)}
                  style={{
                    backgroundColor: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                  title="Create a new shift"
                >
                  +
                </button>
              </div>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                {shifts && shifts.length > 0 ? (
                  <div className="checkbox-group">
                    {shifts.map((shift) => (
                      <label key={shift.id} style={{ display: 'block', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={siteForm.shift_ids.includes(shift.id)}
                          onChange={() =>
                            setSiteForm((prev) => ({
                              ...prev,
                              shift_ids: prev.shift_ids.includes(shift.id) ? prev.shift_ids.filter((id) => id !== shift.id) : [...prev.shift_ids, shift.id],
                            }))
                          }
                        />{' '}
                        {shift.shift_name} ({shift.start_time} - {shift.end_time})
                      </label>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>No shifts available</div>
                )}
              </div>
            </label>
          </form>
        </Modal>
      )}

      {/* Bulk Site Shift Assignment Modal */}
      {/* {showBulkSiteShiftModal && selectedSiteForShifts && (
        <Modal
          title={`Assign Shifts to "${selectedSiteForShifts.site_name}"`}
          onClose={() => setShowBulkSiteShiftModal(false)}
          actions={
            <>
              <button type="button" className="secondary" onClick={() => setShowBulkSiteShiftModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSiteShiftSubmit}
                disabled={bulkSiteShiftSubmitting}
              >
                {bulkSiteShiftSubmitting ? 'Assigning…' : `Assign ${selectedShiftIds.length} Shift(s)`}
              </button>
            </>
          }
        >
          <div className="management-form">
            <label style={{ marginBottom: '1rem' }}>
              Select Shifts (multiple)
            </label>
            <div style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {shifts && shifts.length > 0 ? (
                <div className="checkbox-group">
                  {shifts.map((shift) => (
                    <label key={shift.id} style={{ display: 'block', marginBottom: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedShiftIds.includes(shift.id)}
                        onChange={() => handleShiftToggleForSite(shift.id)}
                      />{' '}
                      <strong>{shift.shift_name}</strong> ({shift.start_time} - {shift.end_time})
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                  No shifts available
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Selected: {selectedShiftIds.length} shift(s)
            </div>
          </div>
        </Modal>
      )} */}

      {/* Shift Creation Modal - Using FormModal */}
      <FormModal
        isOpen={showShiftCreationModal}
        onClose={() => {
          setShowShiftCreationModal(false);
          setShiftCreationForm({ shift_name: '', start_time: '', end_time: '', grace_timing: 30 });
          setShiftCreationErrors({});
        }}
        mode="create"
        title="Create New Shift"
        formData={{
          ...shiftCreationForm,
          location_name: siteForm.location_id 
            ? locations.find(loc => loc.id === siteForm.location_id)?.name || 'Unknown Location'
            : 'Select a location first',
        }}
        onFormDataChange={(updatedForm) => {
          const { location_name, ...rest } = updatedForm;
          setShiftCreationForm(rest);
        }}

       
        errors={shiftCreationErrors}
        fields={shiftCreationFields}
        isSubmitting={shiftCreationSubmitting}
        onSubmit={handleShiftCreationSubmit}
      />
    </div>
  );
};

export default SitesPage;
