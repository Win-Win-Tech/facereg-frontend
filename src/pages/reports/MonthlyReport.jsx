import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { getMonthlyAttendanceStatus, exportMonthlyAttendanceStatus} from '../../api/attendanceApi';
import { getEmployees } from '../../api/employeeApi';
import { getLocations } from '../../api/locationApi';
import useAuth from '../../hooks/useAuth';

const MonthlyReport = ({ onNotify }) => {
  const { role, locationId } = useAuth();
  const isSuperAdmin = role === 'superadmin';

  const getCurrentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [month, setMonth] = useState(getCurrentMonth);
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);
  const [monthlyExportLoading, setMonthlyExportLoading] = useState(false);

  const [employeeList, setEmployeeList] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [locations, setLocations] = useState([]);
  const [filterLocation, setFilterLocation] = useState(locationId || '');
  const [locationsLoaded, setLocationsLoaded] = useState(!isSuperAdmin);
  const loadTimeoutRef = useRef(null);
  const locationsLoadedRef = useRef(false);

  const locationMap = useMemo(() => {
    const map = {};
    locations.forEach((loc) => {
      map[String(loc.id)] = loc.name;
    });
    return map;
  }, [locations]);

  const adminLocationName = useMemo(() => {
    if (isSuperAdmin || !locationId) {
      return null;
    }
    const match = locationMap[String(locationId)];
    if (match) {
      return match;
    }
    return locations.length === 0 ? 'Loading location…' : 'Location not set';
  }, [isSuperAdmin, locationId, locationMap, locations.length]);

  const loadMonthly = useCallback(async (forMonth) => {
    // For superadmin, require location selection
    if (isSuperAdmin && !filterLocation) {
      setMonthlyData([]);
      return;
    }

    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const params = { month: forMonth };
      // Add location_id for superadmin
      if (isSuperAdmin && filterLocation) {
        params.location_id = filterLocation;
      }
      const res = await getMonthlyAttendanceStatus(params);
      if (Array.isArray(res.data)) {
        setMonthlyData(res.data);
      } else {
        setMonthlyData([]);
      }
    } catch (error) {
      console.warn('Failed to load monthly status', error?.response?.data || error.message);
      setMonthlyError('Failed to load monthly attendance status');
      setMonthlyData([]);
    } finally {
      setMonthlyLoading(false);
    }
  }, [isSuperAdmin, filterLocation]);

  const triggerDownloadFromResponse = (res, fallbackName = 'export.csv') => {
    try {
      const headers = res.headers || {};
      const contentType = headers['content-type'] || 'application/octet-stream';
      const disposition = headers['content-disposition'] || headers['Content-Disposition'] || '';
      let filename = fallbackName;
      if (disposition) {
        const fileNameMatch = /filename\*=UTF-8''([^;\n\r]+)|filename="?([^;\n\r"]+)"?/i.exec(disposition);
        if (fileNameMatch) {
          filename = decodeURIComponent((fileNameMatch[1] || fileNameMatch[2] || '').trim());
        }
      }
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || fallbackName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to download file', e);
    }
  };

  const exportMonthly = async (forMonth) => {
    // For superadmin, require location selection
    if (isSuperAdmin && !filterLocation) {
      alert('Please select a location first');
      return;
    }

    setMonthlyExportLoading(true);
    try {
      const params = { month: forMonth };
      // Add location_id for superadmin
      if (isSuperAdmin && filterLocation) {
        params.location_id = filterLocation;
      }
      const jsonRes = await exportMonthlyAttendanceStatus(params);
      if (jsonRes.data?.file_url) {
        window.open(jsonRes.data.file_url, '_blank');
      } else {
        const blobRes = await exportMonthlyAttendanceStatus(params, { responseType: 'blob' });
        triggerDownloadFromResponse(blobRes, `monthly-attendance-${forMonth}.csv`);
      }
    } catch (error) {
      alert('Failed to export monthly attendance');
    } finally {
      setMonthlyExportLoading(false);
    }
  };

  const selectedEmployeeName = useMemo(() => {
    if (!employeeFilter) return '';
    return employeeList.find((emp) => String(emp.id) === String(employeeFilter))?.name || '';
  }, [employeeFilter, employeeList]);

  const filteredMonthlyData = useMemo(() => {
    return monthlyData.filter((record) => {
      if (selectedEmployeeName && record.name !== selectedEmployeeName) {
        return false;
      }
      if (statusFilter === 'present') {
        return Object.values(record).some((value) => value === 'P' || value === 'HP');
      }
      if (statusFilter === 'absent') {
        return Object.values(record).some((value) => value === 'A');
      }
      return true;
    });
  }, [monthlyData, selectedEmployeeName, statusFilter]);

  const parseDateKey = (dateKey, year, monthNumber) => {
    try {
      const [day, monthName] = dateKey.split('-');
      const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      return new Date(year, monthMap[monthName] ?? monthNumber - 1, parseInt(day, 10));
    } catch {
      return null;
    }
  };

  const monthlyDateColumns = useMemo(() => {
    if (!Array.isArray(filteredMonthlyData) || filteredMonthlyData.length === 0) {
      return [];
    }
    const [year, monthNumber] = month.split('-').map(Number);
    const keys = new Set();
    filteredMonthlyData.forEach((employee) => {
      Object.keys(employee)
        .filter((key) => key !== 'name')
        .forEach((key) => keys.add(key));
    });
    return Array.from(keys)
      .map((key) => {
        const parsed = parseDateKey(key, year, monthNumber);
        return {
          key,
          sortValue: parsed ? parsed.getTime() : Number.MAX_SAFE_INTEGER,
          label: parsed ? String(parsed.getDate()).padStart(2, '0') : key,
        };
      })
      .sort((a, b) => a.sortValue - b.sortValue);
  }, [filteredMonthlyData, month]);

  const isHalfDayValue = (v) => {
    if (!v) return false;
    if (typeof v !== 'string') return false;
    const s = v.trim().toLowerCase();
    return s === 'hp' || s === 'ha' || s === 'h' || s.includes('half');
  };

  const getCounts = (employee) => {
    let present = 0;
    let absent = 0;
    monthlyDateColumns.forEach((column) => {
      const value = employee[column.key];
      if (value === 'P') present += 1;
      else if (value === 'HP') {
        // Half day Present counts as 0.5 present and 0.5 absent
        present += 0.5;
        absent += 0.5;
      }
      else if (value === 'A') absent += 1;
    });
    return { present, absent };
  };

  const renderMonthlyTable = () => {
    if (!Array.isArray(filteredMonthlyData) || filteredMonthlyData.length === 0) {
      return <div className="no-data">No monthly data for selected filters.</div>;
    }

    return (
      <table className="summary-table monthly-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Location</th>
            <th>Shift</th>
            <th>Present Days</th>
            <th>Absent Days</th>
            {monthlyDateColumns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredMonthlyData.map((employee, index) => {
            const { present, absent } = getCounts(employee);
            const dept = employee.department || employee.dept || employee.department_name || '—';
            const loc = employee.location || employee.location_name || employee.site || '—';
            const shift = employee.shift || employee.shift_name || '—';
            return (
              <tr key={employee.name || index}>
                <td data-label="Employee">
                  <div className="employee-name">{employee.name || '—'}</div>
                </td>
                <td data-label="Department">{dept}</td>
                <td data-label="Location">{loc}</td>
                <td data-label="Shift">{shift}</td>
                <td data-label="Present">{present}</td>
                <td data-label="Absent">{absent}</td>
                {monthlyDateColumns.map((column) => {
                  const raw = employee[column.key];
                  const value = raw == null || raw === '' ? '—' : raw;
                  const stringValue = String(value).trim().toUpperCase();
                  // Display 'HP' as 'HP' (Half day Present), keep 'HA' for backward compatibility
                  const displayValue = stringValue === 'HP' ? 'HP' : (isHalfDayValue(String(value)) ? 'HA' : value);
                  const statusClass =
                    displayValue === 'P'
                      ? 'status-pill present'
                      : displayValue === 'A'
                      ? 'status-pill absent'
                      : displayValue === 'HP' || isHalfDayValue(String(value))
                      ? 'status-pill half-day'
                      : 'status-pill neutral';
                  return (
                    <td key={column.key} data-label={column.label}>
                      <span className={statusClass}>{displayValue}</span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // Load locations for superadmin
  useEffect(() => {
    if (isSuperAdmin && !locationsLoadedRef.current) {
      locationsLoadedRef.current = true;
      (async () => {
        try {
          const res = await getLocations({ include_deleted: false });
          if (Array.isArray(res.data)) {
            setLocations(res.data);
            // Auto-select first location for superadmin
            if (res.data.length > 0 && !filterLocation) {
              setFilterLocation(res.data[0].id);
            }
            setLocationsLoaded(true);
            // Reset initial load flag when locations are ready
            isInitialLoad.current = true;
          }
        } catch (error) {
          console.warn('Failed to load locations', error?.response?.data || error.message);
          setLocations([]);
          setLocationsLoaded(true);
          // Reset initial load flag even on error
          isInitialLoad.current = true;
        }
      })();
    } else if (!isSuperAdmin) {
      setLocationsLoaded(true);
      // Reset initial load flag for non-superadmin
      isInitialLoad.current = true;
    }
  }, [isSuperAdmin]);

  // Load employees
  useEffect(() => {
    (async () => {
      try {
        const res = await getEmployees();
        if (Array.isArray(res.data)) {
          setEmployeeList(res.data);
        } else {
          setEmployeeList([]);
        }
      } catch (error) {
        console.warn('Failed to load employees', error?.response?.data || error.message);
        setEmployeeList([]);
      }
    })();
  }, []);

  // Initial load on mount (for non-superadmin or when locations are ready)
  const isInitialLoad = useRef(true);

  // Debounced load function
  useEffect(() => {
    if (!locationsLoaded) return;
    
    // For superadmin, wait for location to be selected
    if (isSuperAdmin && !filterLocation) {
      return;
    }
    
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    // On initial load, don't debounce
    const shouldLoadImmediately = isInitialLoad.current;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
    
    if (shouldLoadImmediately) {
      loadMonthly(month);
    } else {
      // Debounce API calls to prevent multiple rapid requests
      loadTimeoutRef.current = setTimeout(() => {
        loadMonthly(month);
      }, 300);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [month, filterLocation, locationsLoaded, loadMonthly, isSuperAdmin]);

  return (
    <section className="report-section">
      <div className="report-controls-compact">
        <div className="filter-group-compact">
          {isSuperAdmin && (
            <label className="filter-label-compact">
              <span>Location:</span>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="filter-select-compact"
                disabled={!locationsLoaded}
              >
                <option value="">Select Location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="filter-label-compact">
            <span>Month:</span>
            <input 
              type="month" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="filter-input-compact"
            />
          </label>
          <label className="filter-label-compact">
            <span>Employee:</span>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="filter-select-compact"
            >
              <option value="">All employees</option>
              {employeeList
                .filter((emp, index, array) => array.findIndex((e) => e.id === emp.id) === index)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="filter-label-compact">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select-compact"
            >
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </label>
          <button 
            className="btn-export btn-compact" 
            onClick={() => exportMonthly(month)}
            disabled={monthlyExportLoading || filteredMonthlyData.length === 0}
          >
            <span className="btn-icon">📥</span>
            {monthlyExportLoading ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {!isSuperAdmin && adminLocationName && (
        <div className="reports-location-chip location-chip" title={adminLocationName}>
          <span className="chip-icon">📍</span>
          <span className="chip-text">{adminLocationName}</span>
        </div>
      )}

      {isSuperAdmin && !filterLocation && locationsLoaded && (
        <div className="summary-error">Please select a location to view attendance report</div>
      )}

      {monthlyLoading ? (
        <div className="summary-loading">Loading monthly attendance…</div>
      ) : monthlyError ? (
        <div className="summary-error">{monthlyError}</div>
      ) : (
        <div className="table-content-wrapper">
          <div className="summary-table-wrapper limited">
            <div className="summary-table-container">
              {renderMonthlyTable()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MonthlyReport;
