import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Reports.css';
import {
  getTodayAttendanceSummary,
  exportTodayAttendanceSummary,
  getMonthlyAttendanceStatus,
  exportMonthlyAttendanceStatus,
} from './api/attendanceApi';
import { getEmployees } from './api/employeeApi';
import {
  generatePayroll as generatePayrollApi,
  getPayroll,
  exportPayroll as exportPayrollFile,
} from './api/payrollApi';
import { getLocations } from './api/locationApi';
import useAuth from './hooks/useAuth';

const DashboardReports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, locationId } = useAuth();
  const isSuperAdmin = role === 'superadmin';

  const getCurrentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [tab, setTab] = useState('today');

  const [todayData, setTodayData] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState(null);
  const [todayExportLoading, setTodayExportLoading] = useState(false);

  const [month, setMonth] = useState(getCurrentMonth);
  const [payrollMonth, setPayrollMonth] = useState(getCurrentMonth);
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);
  const [monthlyExportLoading, setMonthlyExportLoading] = useState(false);

  const [employeeList, setEmployeeList] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [payrollData, setPayrollData] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState(null);
  const [payrollStatus, setPayrollStatus] = useState(null);
  const [payrollExportUrl, setPayrollExportUrl] = useState(null);
  const [payrollExportLoading, setPayrollExportLoading] = useState(false);
  const [locations, setLocations] = useState([]);

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

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/reports/payroll')) {
      setTab('payroll');
    } else if (path.startsWith('/reports/monthly')) {
      setTab('monthly');
    } else {
      setTab('today');
      if (path === '/reports') {
        navigate('/reports/today', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const loadToday = async () => {
    setTodayLoading(true);
    setTodayError(null);
    try {
      const res = await getTodayAttendanceSummary();
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
  };

  const loadMonthly = async (forMonth) => {
    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const res = await getMonthlyAttendanceStatus({ month: forMonth });
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
  };

  const loadPayroll = async (forMonth, { withSpinner = true } = {}) => {
    if (!forMonth) {
      setPayrollData([]);
      setPayrollError('Select a month to view payroll data.');
      setPayrollLoading(false);
      return;
    }
    if (withSpinner) {
    setPayrollLoading(true);
    }
    setPayrollError(null);
    try {
      const res = await getPayroll(forMonth);
      let rows = [];
      if (Array.isArray(res.data)) rows = res.data;
      else if (Array.isArray(res.data?.results)) rows = res.data.results;
      else if (Array.isArray(res.data?.payroll)) rows = res.data.payroll;
      setPayrollData(rows);
      setPayrollStatus(null);
          setPayrollExportUrl(null);
    } catch (error) {
      console.warn('Failed to load payroll', error?.response?.data || error.message);
      setPayrollError('Failed to load payroll data');
      setPayrollData([]);
    } finally {
      if (withSpinner) {
      setPayrollLoading(false);
      }
    }
  };

  const handleGeneratePayroll = async (forMonth) => {
    setPayrollLoading(true);
    setPayrollError(null);
    try {
      const res = await generatePayrollApi(forMonth);
      setPayrollStatus(res.data?.status || `Payroll generated for ${forMonth}`);
      await loadPayroll(forMonth, { withSpinner: false });
    } catch (error) {
      console.warn('Failed to generate payroll', error?.response?.data || error.message);
      setPayrollError('Failed to generate payroll');
      setPayrollStatus(null);
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleExportPayroll = async (forMonth) => {
    setPayrollExportLoading(true);
    try {
      const res = await exportPayrollFile(forMonth);
      if (res.data?.file_url) {
        setPayrollExportUrl(res.data.file_url);
        window.open(res.data.file_url, '_blank');
      }
    } catch (error) {
      console.warn('Failed to export payroll', error?.response?.data || error.message);
      setPayrollError('Failed to export payroll data');
    } finally {
      setPayrollExportLoading(false);
    }
  };

  const handleTabSelect = (nextTab) => {
    setTab(nextTab);
    const base = '/reports';
    if (nextTab === 'today') navigate(`${base}/today`);
    else if (nextTab === 'monthly') navigate(`${base}/monthly`);
    else if (nextTab === 'payroll') navigate(`${base}/payroll`);
  };

  useEffect(() => {
    loadToday();
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
    (async () => {
      try {
        const res = await getLocations({ include_deleted: false });
        if (Array.isArray(res.data)) {
          setLocations(res.data);
        }
      } catch (error) {
        console.warn('Failed to load locations', error?.response?.data || error.message);
        setLocations([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === 'monthly') {
      loadMonthly(month);
    }
  }, [tab, month]);

  useEffect(() => {
    if (tab === 'payroll') {
      loadPayroll(payrollMonth);
    }
  }, [tab, payrollMonth]);

  const exportToday = async () => {
    setTodayExportLoading(true);
    try {
      const res = await exportTodayAttendanceSummary();
      if (res.data?.file_url) {
        window.open(res.data.file_url, '_blank');
      }
    } catch (error) {
      alert("Failed to export today's attendance");
    } finally {
      setTodayExportLoading(false);
    }
  };

  const exportMonthly = async (forMonth) => {
    setMonthlyExportLoading(true);
    try {
      const res = await exportMonthlyAttendanceStatus({ month: forMonth });
      if (res.data?.file_url) {
        window.open(res.data.file_url, '_blank');
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
        return Object.values(record).some((value) => value === 'P');
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

  const renderMonthlyTable = () => {
    if (!Array.isArray(filteredMonthlyData) || filteredMonthlyData.length === 0) {
      return <div className="no-data">No monthly data for selected filters.</div>;
    }

    const getCounts = (employee) => {
      let present = 0;
      let absent = 0;
      monthlyDateColumns.forEach((column) => {
        const value = employee[column.key];
        if (value === 'P') present += 1;
        if (value === 'A') absent += 1;
      });
      return { present, absent };
    };

    return (
      <table className="summary-table monthly-table">
            <thead>
              <tr>
                <th>Employee</th>
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
                return (
                  <tr key={employee.name || index}>
                    <td data-label="Employee">
                      <div className="employee-name">{employee.name || '—'}</div>
                    </td>
                    <td data-label="Present">{present}</td>
                    <td data-label="Absent">{absent}</td>
                    {monthlyDateColumns.map((column) => {
                      const value = employee[column.key] || '—';
                      const statusClass =
                        value === 'P'
                          ? 'status-pill present'
                          : value === 'A'
                          ? 'status-pill absent'
                          : 'status-pill neutral';
                      return (
                        <td key={column.key} data-label={column.label}>
                          <span className={statusClass}>{value}</span>
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

  return (
    <div className="reports-screen">
      <div className="reports-container">
        <div className="reports-tab-header">
          <button className={`tab-button ${tab === 'today' ? 'active' : ''}`} onClick={() => handleTabSelect('today')}>
            Today's
          </button>
          <button className={`tab-button ${tab === 'monthly' ? 'active' : ''}`} onClick={() => handleTabSelect('monthly')}>
            Monthly
          </button>
          {/* <button className={`tab-button ${tab === 'payroll' ? 'active' : ''}`} onClick={() => handleTabSelect('payroll')}>
            Payroll
          </button> */}
        </div>

        {!isSuperAdmin && adminLocationName && (
          <div className="reports-location-chip location-chip" title={adminLocationName}>
            <span className="chip-icon">📍</span>
            <span className="chip-text">{adminLocationName}</span>
          </div>
        )}

        <div className="reports-tabs">
          <div className="reports-tab-panel">
            {tab === 'today' && (
              <section className="report-section">
                <div className="report-section-header">
                  <div className="summary-actions">
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
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(!Array.isArray(todayData) || todayData.length === 0) ? (
                            <tr>
                              <td colSpan={6} className="no-data">No attendance data for today</td>
                            </tr>
                          ) : (
                            todayData.map((row, index) => (
                              <tr key={row.employee || index}>
                                <td data-label="S.No">{index + 1}</td>
                                <td data-label="Employee" className="employee-cell">
                                  <div className="employee-name">{row.employee}</div>
                                </td>
                                <td data-label="Date">{row.date || '—'}</td>
                                <td data-label="Check-in">{row.checkin || '—'}</td>
                                <td data-label="Check-out">{row.checkout || '—'}</td>
                                <td data-label="Duration">{row.duration || '—'}</td>
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
            )}

          {tab === 'monthly' && (
            <section className="report-section">
              <div className="report-controls-compact">
                <div className="filter-group-compact">
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
          )}

          {tab === 'payroll' && (
            <section className="report-section">
              <div className="report-controls-compact">
                <div className="filter-group-compact">
                  <label className="filter-label-compact">
                    <span>Month:</span>
                    <input 
                      type="month" 
                        value={payrollMonth}
                        onChange={(e) => setPayrollMonth(e.target.value)}
                      className="filter-input-compact"
                    />
                  </label>
                    <button
                      className="btn-secondary btn-compact"
                      onClick={() => loadPayroll(payrollMonth)}
                      disabled={payrollLoading || !payrollMonth}
                    >
                      <span className="btn-icon">🔄</span>
                      {payrollLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  <button 
                    className="btn-primary btn-compact" 
                      onClick={() => handleGeneratePayroll(payrollMonth)}
                      disabled={payrollLoading || !payrollMonth}
                  >
                      <span className="btn-icon">⚙️</span>
                      {payrollLoading ? 'Processing…' : 'Generate'}
                  </button>
                  <button 
                    className="btn-export btn-compact" 
                      onClick={() => handleExportPayroll(payrollMonth)}
                      disabled={payrollExportLoading || payrollData.length === 0 || !payrollMonth}
                  >
                    <span className="btn-icon">📥</span>
                      {payrollExportLoading ? 'Exporting…' : 'Export'}
                  </button>
                </div>
              </div>
                {payrollStatus && <div className="summary-status">{payrollStatus}</div>}
                {payrollError && <div className="summary-error">{payrollError}</div>}
                {payrollLoading && payrollData.length === 0 ? (
                  <div className="summary-loading">Loading payroll…</div>
                ) : (
              <div className="table-content-wrapper">
                    <div className="summary-table-wrapper limited">
                      <table className="summary-table payroll-table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Month</th>
                            <th>Present Days</th>
                            <th>Absent Days</th>
                            <th>Base Salary</th>
                            <th>Deductions</th>
                            <th>Net Pay</th>
                            <th>Generated On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payrollData.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="no-data">No payroll records found.</td>
                            </tr>
                          ) : (
                            payrollData.map((record, index) => (
                              <tr key={record.id || `${record.employee}-${index}`}>
                                <td data-label="Employee">{record.employee_name || record.employee || '—'}</td>
                                <td data-label="Month">{record.month || '—'}</td>
                                <td data-label="Present Days">{record.present_days ?? '—'}</td>
                                <td data-label="Absent Days">{record.absent_days ?? '—'}</td>
                                <td data-label="Base Salary">{record.base_salary ?? '—'}</td>
                                <td data-label="Deductions">{record.deductions ?? '—'}</td>
                                <td data-label="Net Pay">{record.net_pay ?? '—'}</td>
                                <td data-label="Generated On">{record.generated_on ? new Date(record.generated_on).toLocaleString() : '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {payrollExportUrl && (
                  <div className="summary-status subtle">
                    Latest export: <a href={payrollExportUrl} target="_blank" rel="noopener noreferrer">Download</a>
              </div>
                )}
            </section>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardReports;
