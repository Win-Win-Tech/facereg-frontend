import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Reports.css';

const DashboardReports = () => {
  const [todayData, setTodayData] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState(null);

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);

  const [payrollData, setPayrollData] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState(null);
  const [payrollStatus, setPayrollStatus] = useState(null);
  const [payrollExportUrl, setPayrollExportUrl] = useState(null);

  // Export states
  const [todayExportUrl, setTodayExportUrl] = useState(null);
  const [todayExportLoading, setTodayExportLoading] = useState(false);
  const [monthlyExportUrl, setMonthlyExportUrl] = useState(null);
  const [monthlyExportLoading, setMonthlyExportLoading] = useState(false);

  // Filter states for monthly attendance
  const [employeeFilter, setEmployeeFilter] = useState(''); // Now stores employee ID
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'present', 'absent'
  const [tab, setTab] = useState('today');

  const loadToday = async () => {
    setTodayLoading(true);
    setTodayError(null);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/attendance-summary/');
      let arr = [];
      if (Array.isArray(res.data)) arr = res.data;
      else if (Array.isArray(res.data?.results)) arr = res.data.results;
      else arr = [];
      setTodayData(arr);
    } catch (err) {
      console.warn('Failed to load today summary', err?.response?.data || err.message);
      setTodayError('Failed to load today attendance');
      setTodayData([]);
    } finally {
      setTodayLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/employees/');
      if (Array.isArray(res.data)) {
        setEmployeeList(res.data);
      } else {
        setEmployeeList([]);
      }
    } catch (err) {
      console.warn('Failed to load employees', err?.response?.data || err.message);
      setEmployeeList([]);
    }
  };

  const loadMonthly = async (forMonth, employeeId = '', status = 'all') => {
    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const params = { month: forMonth };
      if (employeeId) {
        params.employee_id = employeeId;
      }
      if (status !== 'all') {
        params.status = status;
      }
      
      const res = await axios.get('http://127.0.0.1:8000/api/monthly-attendance-status/', { params });
      if (Array.isArray(res.data)) {
        setMonthlyData(res.data);
      } else {
        setMonthlyData([]);
      }
    } catch (err) {
      console.warn('Failed to load monthly status', err?.response?.data || err.message);
      setMonthlyError('Failed to load monthly attendance status');
      setMonthlyData([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const loadPayroll = async (forMonth) => {
    setPayrollLoading(true);
    setPayrollError(null);
    setPayrollData([]);
    try {
      // Try to ensure payroll records exist on the server (generate if backend requires it)
      try {
        await axios.post('http://127.0.0.1:8000/api/generate-payroll/', { month: forMonth });
      } catch (e) {
        // generation may fail if already present; ignore
      }

      // Fetch payroll list (records) from backend API
      const listRes = await axios.get('http://127.0.0.1:8000/api/payroll/', { params: { month: forMonth } });
      if (Array.isArray(listRes.data)) {
        setPayrollData(listRes.data);
      } else if (Array.isArray(listRes.data?.results)) {
        setPayrollData(listRes.data.results);
      } else {
        setPayrollData([]);
      }

      // Also fetch export url if available
      try {
        const expRes = await axios.get('http://127.0.0.1:8000/api/payroll/export/', { params: { month: forMonth } });
        if (expRes.data?.file_url) {
          setPayrollExportUrl(expRes.data.file_url);
        } else {
          setPayrollExportUrl(null);
        }
      } catch (e) {
        // ignore export errors, we still have the list
        setPayrollExportUrl(null);
      }

      setPayrollStatus('Payroll data loaded');
    } catch (err) {
      console.warn('Load payroll failed', err?.response?.data || err.message);
      setPayrollError('Failed to load payroll data');
      setPayrollStatus(null);
    } finally {
      setPayrollLoading(false);
    }
  };

  const generatePayroll = async (forMonth) => {
    setPayrollLoading(true);
    setPayrollStatus(null);
    setPayrollExportUrl(null);
    setPayrollError(null);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/generate-payroll/', { month: forMonth });
      setPayrollStatus(res.data?.status || 'Payroll generated');
      // Load payroll data after generation
      await loadPayroll(forMonth);
    } catch (err) {
      console.warn('Generate payroll failed', err?.response?.data || err.message);
      setPayrollStatus('Failed to generate payroll');
      setPayrollError('Failed to generate payroll');
    } finally {
      setPayrollLoading(false);
    }
  };

  const exportPayroll = async (forMonth) => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/payroll/export/', { params: { month: forMonth } });
      if (res.data?.file_url) {
        setPayrollExportUrl(res.data.file_url);
        setPayrollStatus('Payroll export ready');
      }
    } catch (err) {
      console.warn('Payroll export failed', err?.response?.data || err.message);
      setPayrollExportUrl(null);
      setPayrollError('Payroll export failed');
    }
  };

  const exportTodayAttendance = async () => {
    setTodayExportLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/attendance-summary/export/');
      if (res.data?.file_url) {
        setTodayExportUrl(res.data.file_url);
        // Auto-download
        window.open(res.data.file_url, '_blank');
      }
    } catch (err) {
      console.warn('Today attendance export failed', err?.response?.data || err.message);
      alert('Failed to export today\'s attendance');
    } finally {
      setTodayExportLoading(false);
    }
  };

  const exportMonthlyAttendance = async (forMonth) => {
    setMonthlyExportLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/monthly-attendance/export/', { params: { month: forMonth } });
      if (res.data?.file_url) {
        setMonthlyExportUrl(res.data.file_url);
        // Auto-download
        window.open(res.data.file_url, '_blank');
      }
    } catch (err) {
      console.warn('Monthly attendance export failed', err?.response?.data || err.message);
      alert('Failed to export monthly attendance');
    } finally {
      setMonthlyExportLoading(false);
    }
  };

  useEffect(() => {
    loadToday();
    loadEmployees(); // Load employee list on mount
  }, []);

  // Auto-load monthly data when monthly tab is clicked (first time only)
  useEffect(() => {
    if (tab === 'monthly' && monthlyData.length === 0 && !monthlyLoading) {
      loadMonthly(month, employeeFilter, statusFilter);
    }
  }, [tab]); // Only depend on tab to avoid re-loading unnecessarily

  // Reload monthly data when filters or month change (only if monthly tab is active and already loaded)
  useEffect(() => {
    if (tab === 'monthly' && monthlyData.length > 0) {
      loadMonthly(month, employeeFilter, statusFilter);
    }
  }, [employeeFilter, statusFilter, month]);

  // Auto-load payroll when payroll tab is clicked
  useEffect(() => {
    if (tab === 'payroll' && payrollData.length === 0 && !payrollLoading) {
      loadPayroll(month);
    }
  }, [tab]);

  // Helper to get filtered monthly data (now filtered on backend)
  const getFilteredMonthlyData = () => {
    // Data is already filtered on backend, just return it
    return Array.isArray(monthlyData) ? monthlyData : [];
  };

  // Helper to parse date from format like "01-Jan" to Date object
  const parseDateKey = (dateKey, year, month) => {
    try {
      const [day, monthName] = dateKey.split('-');
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      return new Date(year, monthMap[monthName] || month - 1, parseInt(day));
    } catch {
      return null;
    }
  };

  // Helper to render attendance cards view
  const renderAttendanceCardsView = () => {
    // Data is already filtered on backend
    const filteredData = monthlyData;

    if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
      return <div className="no-data">No monthly data for selected month.</div>;
    }

    if (filteredData.length === 0) {
      return <div className="no-data">No data matches the selected filters.</div>;
    }

    const [year, monthNum] = month.split('-').map(Number);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    // Process each employee's attendance data
    const processEmployeeData = (employee) => {
      const dateKeys = Object.keys(employee).filter(k => k !== 'name');
      const presentDates = [];
      const absentDates = [];
      const noDataDates = [];

      // Get all days in the month
      const lastDay = new Date(year, monthNum, 0).getDate();
      const allDates = Array.from({ length: lastDay }, (_, i) => i + 1);

      allDates.forEach(day => {
        const dateKey = dateKeys.find(key => {
          const parsed = parseDateKey(key, year, monthNum);
          return parsed && parsed.getDate() === day;
        });

        if (dateKey) {
          const status = employee[dateKey];
          if (status === 'P') {
            presentDates.push(day);
          } else if (status === 'A') {
            absentDates.push(day);
          }
        } else {
          noDataDates.push(day);
        }
      });

      return { presentDates, absentDates, noDataDates };
    };

    return (
      <div className="attendance-cards-container">
        <div className="attendance-cards-grid">
          {filteredData.map((employee, empIdx) => {
            const { presentDates, absentDates, noDataDates } = processEmployeeData(employee);
            const totalDays = presentDates.length + absentDates.length + noDataDates.length;
            const presentCount = presentDates.length;
            const absentCount = absentDates.length;
            const attendanceRate = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : 0;

            return (
              <div key={employee.name || empIdx} className="attendance-card">
                <div className="attendance-card-header">
                  <div className="attendance-card-name-section">
                    <h5 className="attendance-card-name">{employee.name}</h5>
                    {/* <span className="attendance-rate-badge">
                      {attendanceRate}% Present
                    </span> */}
                  </div>
                </div>
                
                <div className="attendance-card-stats">
                  <div className="stat-item present-stat">
                    <span className="stat-icon">✓</span>
                    <div className="stat-content">
                      <span className="stat-value">{presentCount}</span>
                      <span className="stat-label">Present</span>
                    </div>
                  </div>
                  <div className="stat-item absent-stat">
                    <span className="stat-icon">✕</span>
                    <div className="stat-content">
                      <span className="stat-value">{absentCount}</span>
                      <span className="stat-label">Absent</span>
                    </div>
                  </div>
                  {/* <div className="stat-item nodata-stat">
                    <span className="stat-icon">—</span>
                    <div className="stat-content">
                      <span className="stat-value">{noDataDates.length}</span>
                      <span className="stat-label">No Data</span>
                    </div>
                  </div> */}
                </div>

                <div className="attendance-card-details">
                  {presentDates.length > 0 && (
                    <div className="attendance-detail-section">
                      <div className="detail-section-header">
                        <span className="detail-section-title present-title">Present Days</span>
                        <span className="detail-count">({presentDates.length})</span>
                      </div>
                      <div className="detail-dates">
                        {presentDates.map((day, idx) => (
                          <span key={idx} className="date-badge present-badge">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {absentDates.length > 0 && (
                    <div className="attendance-detail-section">
                      <div className="detail-section-header">
                        <span className="detail-section-title absent-title">Absent Days</span>
                        <span className="detail-count">({absentDates.length})</span>
                      </div>
                      <div className="detail-dates">
                        {absentDates.map((day, idx) => (
                          <span key={idx} className="date-badge absent-badge">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* {noDataDates.length > 0 && (
                    <div className="attendance-detail-section">
                      <div className="detail-section-header">
                        <span className="detail-section-title nodata-title">No Data</span>
                        <span className="detail-count">({noDataDates.length})</span>
                      </div>
                      <div className="detail-dates">
                        {noDataDates.map((day, idx) => (
                          <span key={idx} className="date-badge nodata-badge">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper to render payroll table (placeholder - would need backend API to fetch payroll records)
  const renderPayrollTable = () => {
    if (payrollLoading) {
      return <div className="summary-loading">Loading payroll data...</div>;
    }
    
    if (payrollError) {
      return <div className="summary-error">{payrollError}</div>;
    }
    // If we have payroll records, render them in a table
    if (Array.isArray(payrollData) && payrollData.length > 0) {
      return (
        <div className="summary-table-wrapper">
          <table className="summary-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Employee</th>
                <th>Present Days</th>
                <th>Absent Days</th>
                <th>Base Salary</th>
                <th>Deduction/Day</th>
                <th>Deductions</th>
                <th>PF</th>
                <th>ESI</th>
                <th>Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map((row, i) => (
                <tr key={row.employee + i}>
                  <td>{i + 1}</td>
                  <td className="employee-cell">
                    <div className="employee-name">{row.employee}</div>
                  </td>
                  <td>{row.present_days ?? row.presentDays ?? '—'}</td>
                  <td>{row.absent_days ?? row.absentDays ?? '—'}</td>
                  <td>{typeof row.base_salary === 'number' ? row.base_salary.toFixed(2) : (row.base_salary ?? '—')}</td>
                  <td>{typeof row.deduction_per_day === 'number' ? row.deduction_per_day.toFixed(2) : (row.deduction_per_day ?? '—')}</td>
                  <td>{typeof row.deductions === 'number' ? row.deductions.toFixed(2) : (row.deductions ?? '—')}</td>
                  <td>{typeof row.pf_deduction === 'number' ? row.pf_deduction.toFixed(2) : (row.pf_deduction ?? '—')}</td>
                  <td>{typeof row.esi_deduction === 'number' ? row.esi_deduction.toFixed(2) : (row.esi_deduction ?? '—')}</td>
                  <td>{typeof row.net_pay === 'number' ? row.net_pay.toFixed(2) : (row.net_pay ?? '—')}</td>
                 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // No payroll records but maybe an export URL or status exists
    if (payrollExportUrl) {
      return (
        <div className="summary-table-wrapper payroll-content">
          <div className="summary-note">
            <p>{payrollStatus || 'Payroll data is available for download.'}</p>
            <a
              className="btn-export"
              href={payrollExportUrl}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: '12px', display: 'inline-block' }}
            >
              <span className="btn-icon">📥</span>
              Download Payroll Excel
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="no-data">
        <p>No payroll data available. Please generate payroll for the selected month.</p>
      </div>
    );
  };


  return (
    <div className="reports-screen">
      <div className="reports-container">
       
        <div className="reports-tab-header">
          <button className={`tab-button ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>Today's</button>
          <button className={`tab-button ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>Monthly</button>
          <button className={`tab-button ${tab === 'payroll' ? 'active' : ''}`} onClick={() => setTab('payroll')}>Payroll</button>
        </div>

        <div className="reports-tabs">

          <div className="reports-tab-panel">
            {tab === 'today' && (
              <section className="report-section">
                <div className="report-section-header">
                  <div className="summary-actions">
                    <button 
                      className="btn-secondary btn-compact" 
                      onClick={loadToday} 
                      disabled={todayLoading}
                      title="Refresh data"
                    >
                      <span className="btn-icon">🔄</span>
                      {todayLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button 
                      className="btn-export btn-compact" 
                      onClick={exportTodayAttendance} 
                      disabled={todayExportLoading || todayData.length === 0}
                      title="Export to Excel"
                    >
                      <span className="btn-icon">📥</span>
                      {todayExportLoading ? 'Exporting...' : 'Export'}
                    </button>
                  </div>
                </div>
                {todayLoading ? (
                  <div className="summary-loading">Loading attendance...</div>
                ) : todayError ? (
                  <div className="summary-error">{todayError}</div>
                ) : (
                  <div className="table-content-wrapper">
                    {/* {todayData.length > 0 && (
                      <div className="table-info-compact">
                        <span className="record-count">
                          {todayData.length} {todayData.length === 1 ? 'employee' : 'employees'} marked attendance today
                        </span>
                      </div>
                    )} */}
                    <div className="summary-table-wrapper">
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
                            todayData.map((row, i) => (
                              <tr key={row.employee || i}>
                                <td>{i + 1}</td>
                                <td className="employee-cell">
                                  <div className="employee-name">{row.employee}</div>
                                </td>
                                <td>{row.date || '—'}</td>
                                <td>{row.checkin || '—'}</td>
                                <td>{row.checkout || '—'}</td>
                                <td>{row.duration || '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
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
                      onChange={e => {
                        setMonth(e.target.value);
                        // Auto-load when month changes with current filters
                        setTimeout(() => loadMonthly(e.target.value, employeeFilter, statusFilter), 100);
                      }}
                      className="filter-input-compact"
                    />
                  </label>
                  {employeeList.length > 0 && (
                    <label className="filter-label-compact">
                      <span>Employee:</span>
                      <select
                        value={employeeFilter}
                        onChange={e => {
                          setEmployeeFilter(e.target.value);
                          // Reload with new filter
                          setTimeout(() => loadMonthly(month, e.target.value, statusFilter), 100);
                        }}
                        className="filter-select-compact"
                      >
                        <option value="">All Employees</option>
                        {employeeList
                          .filter((emp, index, array) => array.findIndex(e => e.id === emp.id) === index) // Remove duplicates by ID
                          .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))
                        }
                      </select>
                    </label>
                  )}
                  
                  {/* <button 
                    className="btn-secondary btn-compact" 
                    onClick={() => loadMonthly(month, employeeFilter, statusFilter)} 
                    disabled={monthlyLoading}
                    title="Refresh data"
                  >
                    <span className="btn-icon">🔄</span>
                    {monthlyLoading ? 'Refreshing...' : 'Refresh'}
                  </button> */}
                  {monthlyData.length > 0 && (
                    <>

                       <button 
                    className="btn-export btn-compact" 
                    onClick={() => exportMonthlyAttendance(month)} 
                    disabled={monthlyExportLoading || monthlyData.length === 0}
                    title="Export to Excel"
                  >
                    <span className="btn-icon">📥</span>
                    {monthlyExportLoading ? 'Exporting...' : 'Export'}
                  </button>
                      {(employeeFilter || statusFilter !== 'all') && (
                        <button
                          className="btn-clear-filters btn-compact"
                          onClick={() => {
                            setEmployeeFilter('');
                            setStatusFilter('all');
                          }}
                          title="Clear filters"
                        >
                          Clear
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {monthlyLoading ? (
                <div className="summary-loading">Loading monthly attendance...</div>
              ) : monthlyError ? (
                <div className="summary-error">{monthlyError}</div>
              ) : (
                <div className="attendance-cards-scroll-container">
                  {monthlyData.length > 0 && (
                    <div className="table-info-compact">
                      <span className="record-count">
                        {monthlyData.length} {monthlyData.length === 1 ? 'employee' : 'employees'}
                        {(employeeFilter || statusFilter !== 'all') && ' (filtered)'}
                      </span>
                    </div>
                  )}
                  {renderAttendanceCardsView()}
                </div>
              )}
            </section>
          )}

          {tab === 'payroll' && (
            <section className="report-section">
              <div className="report-section-header">
              </div>
              <div className="report-controls-compact">
                <div className="filter-group-compact">
                  <label className="filter-label-compact">
                    <span>Month:</span>
                    <input 
                      type="month" 
                      value={month} 
                      onChange={e => setMonth(e.target.value)}
                      className="filter-input-compact"
                    />
                  </label>
                  {/* <button 
                    className="btn-primary btn-compact" 
                    onClick={() => generatePayroll(month)} 
                    disabled={payrollLoading}
                  >
                    {payrollLoading ? 'Generating...' : 'Generate'}
                  </button> */}
                  <button 
                    className="btn-primary btn-compact" 
                    onClick={() => loadPayroll(month)} 
                    disabled={payrollLoading}
                  >
                    {payrollLoading ? 'Generating...' : 'Generate'}
                  </button>
                  <button 
                    className="btn-export btn-compact" 
                    onClick={() => exportPayroll(month)} 
                    disabled={payrollLoading || !payrollExportUrl}
                  >
                    <span className="btn-icon">📥</span>
                    Export
                  </button>
                </div>
              </div>
              <div className="table-content-wrapper">
                {renderPayrollTable()}
              </div>
            </section>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardReports;
