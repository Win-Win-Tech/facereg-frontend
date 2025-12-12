import React, { useCallback, useEffect, useState, useRef } from 'react';
import Modal from '../components/Modal';
import './ManagementPages.css';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../api/locationApi';
import { getSites, createSite, updateSite, deleteSite } from '../api/siteApi';
import { getShifts, createShift, updateShift, deleteShift } from '../api/shiftApi';
import { getAssignments, createAssignment, bulkCreateAssignments } from '../api/assignmentApi';
import { getEmployees } from '../api/employeeApi';

const OrganisationPage = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState('locations');
  
  // Locations state
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalMode, setLocationModalMode] = useState('create');
  const [locationForm, setLocationForm] = useState({ id: null, name: '' });
  const [locationSubmitting, setLocationSubmitting] = useState(false);
  const [locationErrors, setLocationErrors] = useState({});

  // Sites state
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteModalMode, setSiteModalMode] = useState('create');
  const [siteForm, setSiteForm] = useState({ id: null, site_name: '', latitude: '', longitude: '', distance_meters: '', location_id: '' });
  const [siteSubmitting, setSiteSubmitting] = useState(false);
  const [siteErrors, setSiteErrors] = useState({});

  // Shifts state
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState('create');
  const [shiftForm, setShiftForm] = useState({ id: null, shift_name: '', start_time: '', end_time: '' });
  const [shiftSubmitting, setShiftSubmitting] = useState(false);
  const [shiftErrors, setShiftErrors] = useState({});

  // Bulk Assignment state
  const [employees, setEmployees] = useState([]);
  const [assignmentEmployees, setAssignmentEmployees] = useState([]);
  const [assignmentShifts, setAssignmentShifts] = useState([]);
  const [assignmentLocations, setAssignmentLocations] = useState([]);
  const [bulkAssignForm, setBulkAssignForm] = useState({
    employee_ids: [],
    shift_id: '',
    location_id: '',
    site_ids: [],
  });
  const [bulkAssignSubmitting, setBulkAssignSubmitting] = useState(false);
  const [bulkAssignErrors, setBulkAssignErrors] = useState({});

  const loadLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const res = await getLocations({ include_deleted: false });
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Locations', 'Failed to load locations', undefined, { durationMs: 4000 });
    } finally {
      setLocationsLoading(false);
    }
  }, [onNotify]);

  const loadSites = useCallback(async () => {
    setSitesLoading(true);
    try {
      const res = await getSites();
      if (Array.isArray(res.data)) {
        setSites(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Sites', 'Failed to load sites', undefined, { durationMs: 4000 });
    } finally {
      setSitesLoading(false);
    }
  }, [onNotify]);

  const loadShifts = useCallback(async () => {
    setShiftsLoading(true);
    try {
      const res = await getShifts();
      if (Array.isArray(res.data)) {
        setShifts(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Shifts', 'Failed to load shifts', undefined, { durationMs: 4000 });
    } finally {
      setShiftsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadLocations();
    loadSites();
    loadShifts();
  }, [loadLocations, loadSites, loadShifts]);

  // Fetch employees for selected location in bulk assignment
  useEffect(() => {
    if (bulkAssignForm.location_id) {
      getEmployees({ location_id: bulkAssignForm.location_id })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setEmployees(res.data);
          } else {
            setEmployees([]);
          }
        })
        .catch(() => setEmployees([]));
    } else {
      setEmployees([]);
    }
  }, [bulkAssignForm.location_id]);

  // Filter sites for selected location in bulk assignment
  useEffect(() => {
    if (bulkAssignForm.location_id) {
      const filteredSites = sites.filter((site) => String(site.location) === String(bulkAssignForm.location_id));
      setAssignmentLocations(filteredSites);
    } else {
      setAssignmentLocations([]);
    }
  }, [bulkAssignForm.location_id, sites]);

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

  const handleLocationSubmit = async (event) => {
    event.preventDefault();
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

  // Site handlers
  const openCreateSiteModal = () => {
    setSiteForm({ id: null, site_name: '', latitude: '', longitude: '', distance_meters: '', location_id: '' });
    setSiteErrors({});
    setSiteModalMode('create');
    setShowSiteModal(true);
  };

  const openEditSiteModal = (site) => {
    setSiteForm({
      id: site.id,
      site_name: site.site_name || '',
      latitude: site.latitude || '',
      longitude: site.longitude || '',
      distance_meters: site.distance_meters || '',
      location_id: site.location || '',
    });
    setSiteErrors({});
    setSiteModalMode('edit');
    setShowSiteModal(true);
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

  const handleSiteSubmit = async (event) => {
    event.preventDefault();
    if (!validateSite()) return;

    setSiteSubmitting(true);
    try {
      const payload = {
        site_name: siteForm.site_name.trim(),
        latitude: parseFloat(siteForm.latitude),
        longitude: parseFloat(siteForm.longitude),
        distance_meters: parseFloat(siteForm.distance_meters),
        location: siteForm.location_id,
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

  // Shift handlers
  const openCreateShiftModal = () => {
    setShiftForm({ id: null, shift_name: '', start_time: '', end_time: '' });
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

  const handleShiftSubmit = async (event) => {
    event.preventDefault();
    if (!validateShift()) return;

    setShiftSubmitting(true);
    try {
      const payload = {
        shift_name: shiftForm.shift_name.trim(),
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
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

  // Bulk Assignment handlers
  const validateBulkAssignment = () => {
    const next = {};
    if (bulkAssignForm.employee_ids.length === 0) next.employee_ids = 'Select at least one employee';
    if (!bulkAssignForm.shift_id) next.shift_id = 'Select a shift';
    if (!bulkAssignForm.location_id) next.location_id = 'Select a location';
    setBulkAssignErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleBulkAssignSubmit = async (event) => {
    event.preventDefault();
    if (!validateBulkAssignment()) return;

    setBulkAssignSubmitting(true);
    try {
      await bulkCreateAssignments({
        employee_ids: bulkAssignForm.employee_ids,
        shift_id: bulkAssignForm.shift_id,
        location_id: bulkAssignForm.location_id,
        site_ids: bulkAssignForm.site_ids,
      });
      
      onNotify?.('success', 'Assignments Created', `${bulkAssignForm.employee_ids.length} assignments created successfully.`);
      
      setBulkAssignForm({
        employee_ids: [],
        shift_id: '',
        location_id: '',
        site_ids: [],
      });
    } catch (error) {
      onNotify?.('error', 'Bulk Assignment Failed', 'Unable to create assignments.', undefined, { durationMs: 5000 });
    } finally {
      setBulkAssignSubmitting(false);
    }
  };

  const handleEmployeeToggle = (employeeId) => {
    setBulkAssignForm((prev) => ({
      ...prev,
      employee_ids: prev.employee_ids.includes(employeeId)
        ? prev.employee_ids.filter((id) => id !== employeeId)
        : [...prev.employee_ids, employeeId],
    }));
  };

  const handleSelectAllEmployees = () => {
    if (employees.length === 0) return;
    const allSelected = employees.every((emp) => bulkAssignForm.employee_ids.includes(emp.id));
    setBulkAssignForm((prev) => ({
      ...prev,
      employee_ids: allSelected ? [] : employees.map((e) => e.id),
    }));
  };

  useEffect(() => {
    setBulkAssignForm((prev) => {
      if (!Array.isArray(prev.employee_ids) || prev.employee_ids.length === 0) return prev;
      const available = new Set(employees.map((e) => e.id));
      const filtered = prev.employee_ids.filter((id) => available.has(id));
      if (filtered.length === prev.employee_ids.length) return prev;
      return { ...prev, employee_ids: filtered };
    });
  }, [employees]);

  const selectedCount = bulkAssignForm.employee_ids.length;
  const totalEmployees = employees.length;
  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedCount > 0 && selectedCount < totalEmployees;
    }
  }, [selectedCount, totalEmployees]);

  const handleSiteToggle = (siteId) => {
    setBulkAssignForm((prev) => ({
      ...prev,
      site_ids: prev.site_ids.includes(siteId)
        ? prev.site_ids.filter((id) => id !== siteId)
        : [...prev.site_ids, siteId],
    }));
  };

  return (
    <div className="management-page">
      <div className="management-header">
        <h2 className="management-title">Organisation Setup</h2>
      </div>

      <div className="tab-container">
        <div className="tab-navigation">
          <button
            type="button"
            className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Locations
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'sites' ? 'active' : ''}`}
            onClick={() => setActiveTab('sites')}
          >
            Sites
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'shifts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shifts')}
          >
            Shifts
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'bulk-assignment' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk-assignment')}
          >
            Bulk Assignment
          </button>
        </div>

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="tab-content">
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
                {locationsLoading ? (
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
                              <button type="button" className="edit" onClick={() => openEditLocationModal(loc)}>
                                Edit
                              </button>
                              <button type="button" className="delete" onClick={() => handleLocationDelete(loc)}>
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
          </div>
        )}

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div className="tab-content">
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
                  <div className="management-table-wrapper limited mobile-auto">
                    <table className="management-table">
                      <thead>
                        <tr>
                          <th>Site Name</th>
                          <th>Location</th>
                          <th>Latitude</th>
                          <th>Longitude</th>
                          <th>Radius (m)</th>
                          {/* <th>Created</th> */}
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sites.map((site) => (
                          <tr key={site.id}>
                            <td data-label="Site Name">{site.site_name}</td>
                            <td data-label="Location Name">{site.location_name}</td>
                            <td data-label="Latitude">{site.latitude}</td>
                            <td data-label="Longitude">{site.longitude}</td>
                            <td data-label="Radius (m)">{site.distance_meters}</td>
                            {/* <td data-label="Created">{site.created_at ? new Date(site.created_at).toLocaleString() : '—'}</td> */}
                            <td data-label="Actions" className="actions">
                              <button type="button" className="edit" onClick={() => openEditSiteModal(site)}>
                                Edit
                              </button>
                              <button type="button" className="delete" onClick={() => handleSiteDelete(site)}>
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
          </div>
        )}

        {/* Shifts Tab */}
        {activeTab === 'shifts' && (
          <div className="tab-content">
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
                  <div className="management-table-wrapper limited mobile-auto">
                    <table className="management-table">
                      <thead>
                        <tr>
                          <th>Shift Name</th>
                          <th>Start Time</th>
                          <th>End Time</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.map((shift) => (
                          <tr key={shift.id}>
                            <td data-label="Shift Name">{shift.shift_name}</td>
                            <td data-label="Start Time">{shift.start_time}</td>
                            <td data-label="End Time">{shift.end_time}</td>
                            <td data-label="Actions" className="actions">
                              <button type="button" className="edit" onClick={() => openEditShiftModal(shift)}>
                                Edit
                              </button>
                              <button type="button" className="delete" onClick={() => handleShiftDelete(shift)}>
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
          </div>
        )}

        {/* Bulk Assignment Tab */}
        {activeTab === 'bulk-assignment' && (
          <div className="tab-content">
            <div className="management-card">
              <div className="management-card-scroll">
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Bulk Assignment</h3>
                <form className="management-form" onSubmit={handleBulkAssignSubmit}>
                <div className="management-form-two-column">
                  {/* Row 1: Location and Site Selection */}
                  <div className="management-form-group">
                    <label>
                      Location
                      <select
                        value={bulkAssignForm.location_id}
                        onChange={(e) => setBulkAssignForm((prev) => ({ ...prev, location_id: e.target.value }))}
                      >
                        <option value="">Select location</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      {bulkAssignErrors.location_id && <div className="form-error">{bulkAssignErrors.location_id}</div>}
                    </label>
                  </div>

                  <div className="management-form-group">
                     <label>
                      Shift
                      <select
                        value={bulkAssignForm.shift_id}
                        onChange={(e) => setBulkAssignForm((prev) => ({ ...prev, shift_id: e.target.value }))}
                      >
                        <option value="">Select shift</option>
                        {shifts.map((shift) => (
                          <option key={shift.id} value={shift.id}>
                            {shift.shift_name} ({shift.start_time} - {shift.end_time})
                          </option>
                        ))}
                      </select>
                      {bulkAssignErrors.shift_id && <div className="form-error">{bulkAssignErrors.shift_id}</div>}
                    </label>
                   
                  </div>

                  {/* Row 2: Shift and Employee Selection */}
                  <div className="management-form-group">
                    <label style={{ marginBottom: '0.5rem' }}>
                      Select Sites (optional)
                    </label>
                    <div style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                      {bulkAssignForm.location_id ? (
                        assignmentLocations.length > 0 ? (
                          <div className="checkbox-group">
                            {assignmentLocations.map((site) => (
                              <label key={site.id} style={{ display: 'block', marginBottom: '0.5rem' }}>
                                <input
                                  type="checkbox"
                                  checked={bulkAssignForm.site_ids.includes(site.id)}
                                  onChange={() => handleSiteToggle(site.id)}
                                />{' '}
                                {site.site_name}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                            No sites available for this location
                          </div>
                        )
                      ) : (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                          Select a location first to view sites
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="management-form-group">
                    <label style={{ marginBottom: '0.5rem' }}>
                      Select Employees
                    </label>
                    <div style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                      {bulkAssignForm.location_id ? (
                        employees.length > 0 ? (
                          <div className="checkbox-group">
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>
                              <input
                                ref={selectAllRef}
                                type="checkbox"
                                checked={employees.length > 0 && employees.every((emp) => bulkAssignForm.employee_ids.includes(emp.id))}
                                onChange={handleSelectAllEmployees}
                              />{' '}
                              Select all
                              {totalEmployees > 0 && (
                                <span style={{ marginLeft: '0.5rem', fontWeight: 500, color: '#6b7280', fontSize: '0.9rem' }}>
                                  {selectedCount} of {totalEmployees} selected
                                </span>
                              )}
                            </label>
                            {employees.map((emp) => (
                              <label key={emp.id} style={{ display: 'block', marginBottom: '0.5rem' }}>
                                <input
                                  type="checkbox"
                                  checked={bulkAssignForm.employee_ids.includes(emp.id)}
                                  onChange={() => handleEmployeeToggle(emp.id)}
                                />{' '}
                                {emp.name}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                            No employees found for this location
                          </div>
                        )
                      ) : (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                          Select a location to view employees
                        </div>
                      )}
                    </div>
                    {bulkAssignErrors.employee_ids && <div className="form-error">{bulkAssignErrors.employee_ids}</div>}
                  </div>
                </div>

                <div className="management-actions">

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button type="reset" className="secondary">
                    Clear
                  </button>
                  <button type="submit" disabled={bulkAssignSubmitting}>
                    {bulkAssignSubmitting ? 'Assigning…' : 'Assign to Selected Employees'}
                  </button>
                </div>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <Modal
          title={locationModalMode === 'create' ? 'Create location' : 'Edit location'}
          onClose={() => setShowLocationModal(false)}
          actions={
            <>
              <button type="button" className="secondary" onClick={() => setShowLocationModal(false)}>
                Cancel
              </button>
              <button type="submit" form="location-form" disabled={locationSubmitting}>
                {locationSubmitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="location-form" className="management-form" onSubmit={handleLocationSubmit}>
            <label>
              Name
              <input
                name="name"
                value={locationForm.name}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Office name"
              />
              {locationErrors.name && <div className="form-error">{locationErrors.name}</div>}
            </label>
          </form>
        </Modal>
      )}

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
                onChange={(e) => setSiteForm((prev) => ({ ...prev, location_id: e.target.value }))}
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
          </form>
        </Modal>
      )}

      {/* Shift Modal */}
      {showShiftModal && (
        <Modal
          title={shiftModalMode === 'create' ? 'Create shift' : 'Edit shift'}
          onClose={() => setShowShiftModal(false)}
          actions={
            <>
              <button type="button" className="secondary" onClick={() => setShowShiftModal(false)}>
                Cancel
              </button>
              <button type="submit" form="shift-form" disabled={shiftSubmitting}>
                {shiftSubmitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="shift-form" className="management-form" onSubmit={handleShiftSubmit}>
            <label>
              Shift Name
              <input
                name="shift_name"
                value={shiftForm.shift_name}
                onChange={(e) => setShiftForm((prev) => ({ ...prev, shift_name: e.target.value }))}
                placeholder="e.g., Morning Shift"
              />
              {shiftErrors.shift_name && <div className="form-error">{shiftErrors.shift_name}</div>}
            </label>
            <label>
              Start Time
              <input
                name="start_time"
                type="time"
                value={shiftForm.start_time}
                onChange={(e) => setShiftForm((prev) => ({ ...prev, start_time: e.target.value }))}
              />
              {shiftErrors.start_time && <div className="form-error">{shiftErrors.start_time}</div>}
            </label>
            <label>
              End Time
              <input
                name="end_time"
                type="time"
                value={shiftForm.end_time}
                onChange={(e) => setShiftForm((prev) => ({ ...prev, end_time: e.target.value }))}
              />
              {shiftErrors.end_time && <div className="form-error">{shiftErrors.end_time}</div>}
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OrganisationPage;
