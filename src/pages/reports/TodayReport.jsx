import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  getTodayAttendanceSummary,
  exportTodayAttendanceSummary,
} from '../../api/attendanceApi';
import { getLocations } from '../../api/locationApi';
import useAuth from '../../hooks/useAuth';

const TodayReport = ({ onNotify }) => {
  const { role, locationId } = useAuth();
  const isSuperAdmin = role === 'superadmin';

  const [todayData, setTodayData] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState(null);
  const [todayExportLoading, setTodayExportLoading] = useState(false);
  const [todayFilter, setTodayFilter] = useState('today');
  const [todayStartDate, setTodayStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [todayEndDate, setTodayEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [locations, setLocations] = useState([]);
  const [filterLocation, setFilterLocation] = useState(locationId || '');
  const [locationsLoaded, setLocationsLoaded] = useState(!isSuperAdmin);
  const isInitialTodayLoad = useRef(true);
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

  const loadToday = useCallback(async () => {
    // For superadmin, require location selection
    if (isSuperAdmin && !filterLocation) {
      setTodayData([]);
      return;
    }

    setTodayLoading(true);
    setTodayError(null);
    try {
      let params = {};
      const today = new Date();
      // Use local date string (YYYY-MM-DD) without timezone conversion
      const localDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      if (todayFilter === 'today') {
        params.start_date = localDate(today);
        params.end_date = localDate(today);
      } else if (todayFilter === 'yesterday') {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        params.start_date = localDate(y);
        params.end_date = localDate(y);
      } else if (todayFilter === 'thisweek') {
        const first = new Date(today);
        first.setDate(first.getDate() - 6);
        params.start_date = localDate(first);
        params.end_date = localDate(today);
      } else if (todayFilter === 'custom') {
        params.start_date = todayStartDate;
        params.end_date = todayEndDate;
      }
      
      // Add location_id for superadmin
      if (isSuperAdmin && filterLocation) {
        params.location_id = filterLocation;
      }
      
      const res = await getTodayAttendanceSummary(params);
      let arr = [];
      if (Array.isArray(res.data)) arr = res.data;
      else if (Array.isArray(res.data?.results)) arr = res.data.results;
      setTodayData(arr);
    } catch (error) {
      console.warn('Failed to load today summary', error?.response?.data || error.message);
      setTodayError('Failed to load today attendance');
      setTodayData([]);
    } finally {
      setTodayLoading(false);
    }
  }, [isSuperAdmin, filterLocation, todayFilter, todayStartDate, todayEndDate]);

  const isMissing = (v) => v == null || v === '' || String(v).trim() === '—' || String(v).trim() === '';

  const calculateAttendanceStatus = (row) => {
    const hasNoShift = isMissing(row.shift);

    if (hasNoShift) {
      if (isMissing(row.checkin) || isMissing(row.checkout)) {
        return 'Absent';
      }

      let durationHours = 0;
      if (row.duration && typeof row.duration === 'string') {
        const parts = row.duration.split(':');
        const h = parseFloat(parts[0]) || 0;
        const m = parseFloat(parts[1]) || 0;
        durationHours = h + m / 60;
      } else if (typeof row.duration === 'number') {
        durationHours = row.duration;
      }

      if (durationHours < 4) {
        return 'Absent';
      } else if (durationHours >= 4 && durationHours <= 6) {
        return 'Half Day Absent';
      } else if (durationHours > 6 && durationHours < 12) {
        return 'Early Checkout';
      } else if (durationHours > 12) {
        return 'Delayed Checkout';
      }

      return 'Present';
    }

    if (isMissing(row.checkin) || isMissing(row.checkout)) {
      return 'Absent';
    }

    return row.status || 'Present';
  };

  const getRemarks = (row) => {
    if (isMissing(row.checkout) && !isMissing(row.checkin)) return 'No checkout';
    return row.remarks || '—';
  };

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

  const exportToday = async () => {
    // For superadmin, require location selection
    if (isSuperAdmin && !filterLocation) {
      alert('Please select a location first');
      return;
    }

    setTodayExportLoading(true);
    try {
      let params = {};
      const today = new Date();
      // Use local date string (YYYY-MM-DD) without timezone conversion
      const localDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      if (todayFilter === 'custom') {
        params.start_date = todayStartDate;
        params.end_date = todayEndDate;
      } else {
        if (todayFilter === 'today') {
          params.start_date = localDate(today);
          params.end_date = localDate(today);
        } else if (todayFilter === 'yesterday') {
          const y = new Date(today);
          y.setDate(y.getDate() - 1);
          params.start_date = localDate(y);
          params.end_date = localDate(y);
        } else if (todayFilter === 'thisweek') {
          const first = new Date(today);
          first.setDate(first.getDate() - 5);
          params.start_date = localDate(first);
          params.end_date = localDate(today);
        }
      }
      
      // Add location_id for superadmin
      if (isSuperAdmin && filterLocation) {
        params.location_id = filterLocation;
      }
      
      const jsonRes = await exportTodayAttendanceSummary(params);
      if (jsonRes.data?.file_url) {
        window.open(jsonRes.data.file_url, '_blank');
      } else {
        const blobRes = await exportTodayAttendanceSummary(params, { responseType: 'blob' });
        triggerDownloadFromResponse(blobRes, `attendance-${params.start_date || 'report'}.csv`);
      }
    } catch (error) {
      alert("Failed to export today's attendance");
    } finally {
      setTodayExportLoading(false);
    }
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
          }
        } catch (error) {
          console.warn('Failed to load locations', error?.response?.data || error.message);
          setLocations([]);
          setLocationsLoaded(true);
        }
      })();
    } else if (!isSuperAdmin) {
      setLocationsLoaded(true);
    }
  }, [isSuperAdmin, filterLocation]);

  // Debounced load function
  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    if (isInitialTodayLoad.current) {
      isInitialTodayLoad.current = false;
      loadToday();
    } else {
      // Debounce API calls to prevent multiple rapid requests
      loadTimeoutRef.current = setTimeout(() => {
        loadToday();
      }, 300);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [loadToday]);

  return (
    <section className="report-section">
      <div className="report-section-header">
        <div className="summary-actions">
          <div className="filter-group-compact">
            {isSuperAdmin && (
              <div className="filter-item">
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
              </div>
            )}
            <div className="filter-item">
              <label className="filter-label-compact">
                <select
                  value={todayFilter}
                  onChange={(e) => setTodayFilter(e.target.value)}
                  className="filter-select-compact"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="thisweek">This week</option>
                  <option value="custom">Date customize</option>
                </select>
              </label>
            </div>
            {todayFilter === 'custom' && (
              <div className="custom-date-inputs filter-row">
                <label className="filter-label-compact">
                  <span>From:</span>
                  <input type="date" value={todayStartDate} onChange={(e) => setTodayStartDate(e.target.value)} className="filter-input-compact" />
                </label>
                <label className="filter-label-compact">
                  <span>To:</span>
                  <input type="date" value={todayEndDate} onChange={(e) => setTodayEndDate(e.target.value)} className="filter-input-compact" />
                </label>
              </div>
            )}
          </div>
          <button className="btn-secondary btn-compact" onClick={loadToday} disabled={todayLoading}>
            <span className="btn-icon">🔄</span>
            {todayLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button 
            className="btn-export btn-compact" 
            onClick={exportToday}
            disabled={todayExportLoading || todayData.length === 0}
          >
            <span className="btn-icon">📥</span>
            {todayExportLoading ? 'Exporting…' : 'Export'}
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

      {todayLoading ? (
        <div className="summary-loading">Loading attendance…</div>
      ) : todayError ? (
        <div className="summary-error">{todayError}</div>
      ) : (
        <div className="table-content-wrapper">
          <div className="summary-table-wrapper limited">
            <div className="summary-table-container">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Shift Date</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Shift</th>
                    <th>Shift Start</th>
                    <th>Shift End</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Variance</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(!Array.isArray(todayData) || todayData.length === 0) ? (
                    <tr>
                      <td colSpan={14} className="no-data">No attendance data for today</td>
                    </tr>
                  ) : (
                    todayData.map((row, index) => (
                      <tr key={row.name || row.id || index}>
                        <td data-label="S.No">{index + 1}</td>
                        <td data-label="Shift Date">{row.date || '—'}</td>
                        <td data-label="Name" className="employee-cell">
                          <div className="employee-name">{row.name || '—'}</div>
                        </td>
                        <td data-label="Department">{row.department || '—'}</td>
                        <td data-label="Location">{row.location || '—'}</td>
                        <td data-label="Shift">{row.shift || '—'}</td>
                        <td data-label="Shift Start">{row.shift_start || '—'}</td>
                        <td data-label="Shift End">{row.shift_end || '—'}</td>
                        <td data-label="Check-in">{row.checkin || '—'}</td>
                        <td data-label="Check-out">{row.checkout || '—'}</td>
                        <td data-label="Duration">{row.duration || '—'}</td>
                        <td data-label="Status">{calculateAttendanceStatus(row)}</td>
                        <td data-label="Variance">{row.variance || '—'}</td>
                        <td data-label="Remarks">{getRemarks(row)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TodayReport;

