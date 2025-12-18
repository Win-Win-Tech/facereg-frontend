import React, { useCallback, useEffect, useState, useRef } from 'react';
import '../../styles/ManagementPages.css';
import { getEmployees } from '../../api/employeeApi';
import { bulkCreateAssignments } from '../../api/assignmentApi';
import { getLocations } from '../../api/locationApi';
import { getSites } from '../../api/siteApi';
import { getShifts } from '../../api/shiftApi';
import { useAuthContext } from '../../contexts/AuthContext';

const BulkAssignmentPage = ({ onNotify }) => {
  const { locationId } = useAuthContext();

  // Bulk Assignment state
  const [employees, setEmployees] = useState([]);
  const [assignmentEmployees, setAssignmentEmployees] = useState([]);
  const [assignmentShifts, setAssignmentShifts] = useState([]);
  const [assignmentLocations, setAssignmentLocations] = useState([]);
  const [bulkAssignForm, setBulkAssignForm] = useState({
    employee_ids: [],
    shift_id: '',
    location_id: locationId || '',
    site_ids: [],
    assignment_from_date: new Date().toISOString().split('T')[0],
    assignment_to_date: new Date().toISOString().split('T')[0],
  });
  const [bulkAssignSubmitting, setBulkAssignSubmitting] = useState(false);
  const [bulkAssignErrors, setBulkAssignErrors] = useState({});

  // Related data
  const [locations, setLocations] = useState([]);
  const [sites, setSites] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Load locations
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

  // Load sites
  const loadSites = useCallback(async () => {
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
    }
  }, [locationId, onNotify]);

  // Load shifts
  const loadShifts = useCallback(async () => {
    try {
      const params = locationId ? { location_id: locationId } : {};
      const res = await getShifts(params);
      if (Array.isArray(res.data)) {
        setShifts(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Shifts', 'Failed to load shifts', undefined, { durationMs: 4000 });
    }
  }, [locationId, onNotify]);

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

  // Bulk Assignment handlers
  const validateBulkAssignment = () => {
    const next = {};
    if (bulkAssignForm.employee_ids.length === 0) next.employee_ids = 'Select at least one employee';
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
        shift_id: bulkAssignForm.shift_id || null,
        location_id: bulkAssignForm.location_id,
        site_ids: bulkAssignForm.site_ids.length > 0 ? bulkAssignForm.site_ids : null,
        assignment_from_date: bulkAssignForm.assignment_from_date || null,
        assignment_to_date: bulkAssignForm.assignment_to_date || null,
      });

      onNotify?.('success', 'Assignments Created', `${bulkAssignForm.employee_ids.length} assignments created successfully from ${bulkAssignForm.assignment_from_date} to ${bulkAssignForm.assignment_to_date}.`);

      setBulkAssignForm({
        employee_ids: [],
        shift_id: '',
        location_id: '',
        site_ids: [],
        assignment_from_date: new Date().toISOString().split('T')[0],
        assignment_to_date: new Date().toISOString().split('T')[0],
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
      site_ids: prev.site_ids.includes(siteId) ? [] : [siteId],
      shift_id: '', // Reset shift selection when site changes
    }));
  };

  const availableBulkShifts = React.useMemo(() => {
    if (bulkAssignForm.site_ids.length > 0) {
      const selected = new Set(bulkAssignForm.site_ids);
      const shiftIds = new Set();
      sites.forEach((site) => {
        if (selected.has(site.id)) {
          if (Array.isArray(site.shifts) && site.shifts.length > 0) {
            site.shifts.forEach((s) => shiftIds.add(s.id));
          } else if (Array.isArray(site.shift_ids) && site.shift_ids.length > 0) {
            site.shift_ids.forEach((id) => shiftIds.add(id));
          }
        }
      });
      return shifts.filter((s) => shiftIds.has(s.id));
    }

    // If location selected (but no specific sites), gather shifts assigned to any site of that location
    if (bulkAssignForm.location_id) {
      const shiftIds = new Set();
      sites.forEach((site) => {
        if (String(site.location) === String(bulkAssignForm.location_id)) {
          if (Array.isArray(site.shifts) && site.shifts.length > 0) {
            site.shifts.forEach((s) => shiftIds.add(s.id));
          } else if (Array.isArray(site.shift_ids) && site.shift_ids.length > 0) {
            site.shift_ids.forEach((id) => shiftIds.add(id));
          }
        }
      });
      if (shiftIds.size > 0) return shifts.filter((s) => shiftIds.has(s.id));
    }

    // If nothing is selected yet, return all shifts
    return shifts;
  }, [bulkAssignForm.location_id, bulkAssignForm.site_ids, shifts, sites]);

  return (
    <div className="management-page">
      <div className="management-card">
        <div className="management-card-scroll">
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Bulk Assignment</h3>
          <form className="management-form" onSubmit={handleBulkAssignSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
              {/* Location */}
              <div className="management-form-group">
                <label>
                  Location
                  <select
                    value={bulkAssignForm.location_id}
                    onChange={(e) => setBulkAssignForm((prev) => ({ ...prev, location_id: e.target.value }))}
                    disabled={locationId !== null && locationId !== undefined}
                    style={{ marginTop: '1.2rem' }}
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

              {/* Sites */}
              <div className="management-form-group">
                <label style={{ marginBottom: '0.5rem' }}>
                  Select Site (optional)
                </label>
                <div style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {bulkAssignForm.location_id ? (
                    assignmentLocations.length > 0 ? (
                      <div className="checkbox-group">
                        {assignmentLocations.map((site) => (
                          <label key={site.id} style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
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
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '0.75rem', fontSize: '0.85rem' }}>
                        No sites available
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '0.75rem', fontSize: '0.85rem' }}>
                      Select location first
                    </div>
                  )}
                </div>
              </div>

              {/* Employees */}
              <div className="management-form-group">
                <label style={{ marginBottom: '0.5rem' }}>
                  Select Employees
                </label>
                <div style={{ border: '1px solid #d1d5db', borderRadius: '0.75rem', padding: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {bulkAssignForm.location_id ? (
                    employees.length > 0 ? (
                      <div className="checkbox-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                          <input
                            ref={selectAllRef}
                            type="checkbox"
                            checked={employees.length > 0 && employees.every((emp) => bulkAssignForm.employee_ids.includes(emp.id))}
                            onChange={handleSelectAllEmployees}
                          />{' '}
                          All
                        </label>
                        {employees.map((emp) => (
                          <label key={emp.id} style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
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
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '0.75rem', fontSize: '0.85rem' }}>
                        No employees found
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '0.75rem', fontSize: '0.85rem' }}>
                      Select location first
                    </div>
                  )}
                </div>
                {bulkAssignErrors.employee_ids && <div className="form-error">{bulkAssignErrors.employee_ids}</div>}
              </div>
            </div>

            {/* Row 2: Shift | From Date | To Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              {/* Shift */}
              <div className="management-form-group">
                <label>
                  Shift
                  <select
                    value={bulkAssignForm.shift_id}
                    onChange={(e) =>
                      setBulkAssignForm((prev) => ({ ...prev, shift_id: e.target.value }))
                    }
                  >
                    <option value="">Select shift</option>
                    {availableBulkShifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.shift_name} ({shift.start_time} - {shift.end_time})
                      </option>
                    ))}
                  </select>
                  {bulkAssignErrors.shift_id && (
                    <div className="form-error">{bulkAssignErrors.shift_id}</div>
                  )}
                </label>
              </div>

              {/* From Date */}
              <div className="management-form-group">
                <label>
                  From Date
                  <input
                    type="date"
                    value={bulkAssignForm.assignment_from_date}
                    onChange={(e) =>
                      setBulkAssignForm((prev) => ({ ...prev, assignment_from_date: e.target.value }))
                    }
                  />
                  <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block', fontSize: '0.8rem' }}>
                    Effective from this date
                  </small>
                </label>
              </div>

              {/* To Date */}
              <div className="management-form-group">
                <label>
                  To Date
                  <input
                    type="date"
                    value={bulkAssignForm.assignment_to_date}
                    onChange={(e) =>
                      setBulkAssignForm((prev) => ({ ...prev, assignment_to_date: e.target.value }))
                    }
                  />
                  <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block', fontSize: '0.8rem' }}>
                    Effective until this date
                  </small>
                </label>
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
  );
};

export default BulkAssignmentPage;
