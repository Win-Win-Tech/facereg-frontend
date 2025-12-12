import React, { useState, useEffect, useMemo } from 'react';
import './PayslipPage.css';
import Modal from '../components/Modal';
import {
  listPayslips,
  generatePayslip,
  getPayslip,
  downloadPayslipPDF,
  payslipReports,
  getPayslipConfigs,
  createPayslipConfig,
  updatePayslipConfig,
  deletePayslipConfig,
  listFields,
  createField,
  updateField,
  deleteField,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  approvePayslip,
} from '../api/payslipApi';
import { getEmployees } from '../api/employeeApi';
import { getLocations } from '../api/locationApi';

const PayslipPage = ({ onNotify }) => {
  const [tab, setTab] = useState('records');
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [recordSearch, setRecordSearch] = useState('');
  const [recordStatus, setRecordStatus] = useState('ALL');
  const [recordMonth, setRecordMonth] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    return `${now.getFullYear()}-${m}`;
  });
  const [fieldConfigId, setFieldConfigId] = useState('');
  const [templateId, setTemplateId] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await listPayslips();
      setPayslips(res.data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Payslip', 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  // Payslip template/field config/fields state
  const [configs, setConfigs] = useState([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configForm, setConfigForm] = useState({
    config_name: '',
    description: '',
    location_id: '',
    is_active: true,
  });

  const [fields, setFields] = useState([]);
  const [fieldLoading, setFieldLoading] = useState(false);
  const [selectedConfigForFields, setSelectedConfigForFields] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    field_type: 'EARNING',
    value_type: 'FIXED',
    value: '',
    display_order: 1,
    is_visible: true,
    default_value: '',
  });

  const [templates, setTemplates] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    location_id: '',
    company_name: '',
    company_address: '',
    company_email: '',
    company_phone: '',
    header_text: '',
    footer_text: '',
    header_color: '#1e40af',
    footer_color: '#64748b',
    page_size: 'A4',
    orientation: 'portrait',
    font_size: 10,
  });

  // Employees and Locations for dropdowns
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const loadConfigs = async () => {
    setConfigLoading(true);
    try {
      const res = await getPayslipConfigs();
      setConfigs(res.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Payslip Template', 'Failed to load templates');
    } finally {
      setConfigLoading(false);
    }
  };

  const loadTemplates = async () => {
    setTemplateLoading(true);
    try {
      const res = await listTemplates();
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Payslip Template', 'Failed to load templates');
    } finally {
      setTemplateLoading(false);
    }
  };

  const loadFields = async (configId) => {
    if (!configId) {
      setFields([]);
      return;
    }
    setFieldLoading(true);
    try {
      const res = await listFields(configId);
      setFields(res.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Payslip Fields', 'Failed to load fields');
    } finally {
      setFieldLoading(false);
    }
  };

  const resetConfigForm = () => {
    setEditingConfig(null);
    setConfigForm({
      config_name: '',
      description: '',
      location_id: '',
      is_active: true,
    });
  };

  const resetFieldForm = () => {
    setEditingField(null);
    setFieldForm({
      field_name: '',
      field_type: 'EARNING',
      value_type: 'FIXED',
      value: '',
      display_order: 1,
      is_visible: true,
      default_value: '',
    });
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateForm({
      location_id: '',
      company_name: '',
      company_address: '',
      company_email: '',
      company_phone: '',
      header_text: '',
      footer_text: '',
      header_color: '#1e40af',
      footer_color: '#64748b',
      page_size: 'A4',
      orientation: 'portrait',
      font_size: 10,
    });
  };

  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Employees', 'Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadLocations = async () => {
    setLocationsLoading(true);
    try {
      const res = await getLocations({ include_deleted: false });
      setLocations(res.data || []);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Locations', 'Failed to load locations');
    } finally {
      setLocationsLoading(false);
    }
  };

  useEffect(() => {
    // Load employees and locations on mount
    loadEmployees();
    loadLocations();
  }, []);

  useEffect(() => {
    if (tab === 'records') {
      fetchList();
    } else if (tab === 'configs') {
      loadConfigs();
    } else if (tab === 'fields') {
      loadConfigs();
    } else if (tab === 'templates') {
      loadTemplates();
    }
  }, [tab]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!employeeId || !month) {
      if (onNotify) onNotify('error', 'Payslip', 'Employee and Month are required');
      return;
    }
    try {
      const payload = {
        employee_id: Number(employeeId),
        month,
        field_config_id: fieldConfigId || undefined,
        template_id: templateId || undefined,
      };
      await generatePayslip(payload);
      if (onNotify) onNotify('success', 'Payslip', 'Payslip generated');
      setEmployeeId('');
      setFieldConfigId('');
      setTemplateId('');
      setTab('records');
      fetchList();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to generate payslip';
      if (onNotify) onNotify('error', 'Payslip', errorMsg);
    }
  };

  const handleCreateOrUpdateConfig = async (payload) => {
    if (!payload.location_id && !editingConfig?.id) {
      if (onNotify) onNotify('error', 'Template', 'Location is required');
      return;
    }
    if (!payload.location_id) {
      delete payload.location_id;
    }
    try {
      if (editingConfig?.id) {
        await updatePayslipConfig(editingConfig.id, payload);
        if (onNotify) onNotify('success', 'Template', 'Template updated');
      } else {
        await createPayslipConfig(payload);
        if (onNotify) onNotify('success', 'Template', 'Template created');
      }
      resetConfigForm();
      loadConfigs();
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Template', 'Failed to save template');
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await deletePayslipConfig(id);
      if (onNotify) onNotify('success', 'Template', 'Template deleted');
      loadConfigs();
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Template', 'Delete failed');
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const res = await downloadPayslipPDF(id);
      
      // Check content type to determine if it's a PDF or JSON error
      const contentType = res.headers['content-type'] || '';
      
      if (contentType.includes('application/pdf') || res.data instanceof Blob) {
        // It's a PDF file
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `payslip-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        if (onNotify) onNotify('success', 'Payslip', 'PDF downloaded successfully');
      } else if (contentType.includes('application/json')) {
        // It's a JSON error response
        const errorMsg = res.data?.detail || 'PDF file not available';
        if (onNotify) onNotify('error', 'Payslip', errorMsg);
      } else {
        // Unknown content type, try to download anyway
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `payslip-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
      let errorMsg = 'Failed to download PDF';
      
      if (err.response) {
        // Try to parse error message from response
        if (err.response.data) {
          if (typeof err.response.data === 'string') {
            try {
              const parsed = JSON.parse(err.response.data);
              errorMsg = parsed.detail || parsed.error || errorMsg;
            } catch {
              errorMsg = err.response.data;
            }
          } else if (err.response.data.detail) {
            errorMsg = err.response.data.detail;
          } else if (err.response.data.error) {
            errorMsg = err.response.data.error;
          }
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      if (onNotify) onNotify('error', 'Payslip', errorMsg);
    }
  };

  const handleReports = async () => {
    setLoading(true);
    try {
      const res = await payslipReports();
      if (onNotify) onNotify('success', 'Reports', 'Reports fetched');
      console.log('reports', res.data);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Reports', 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSave = async (payload) => {
    if (!selectedConfigForFields) {
      if (onNotify) onNotify('error', 'Fields', 'Select a config first');
      return;
    }
    try {
      if (editingField?.id) {
        await updateField(selectedConfigForFields, editingField.id, payload);
        if (onNotify) onNotify('success', 'Field', 'Field updated');
      } else {
        await createField(selectedConfigForFields, payload);
        if (onNotify) onNotify('success', 'Field', 'Field added');
      }
      resetFieldForm();
      loadFields(selectedConfigForFields);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Field', 'Failed to save field');
    }
  };

  const handleFieldDelete = async (id) => {
    if (!selectedConfigForFields) return;
    if (!window.confirm('Delete this field?')) return;
    try {
      await deleteField(selectedConfigForFields, id);
      if (onNotify) onNotify('success', 'Field', 'Field deleted');
      loadFields(selectedConfigForFields);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Field', 'Delete failed');
    }
  };

  const handleTemplateSave = async (payload) => {
    if (!payload.location_id && !editingTemplate?.id) {
      if (onNotify) onNotify('error', 'Payslip Template', 'Location is required');
      return;
    }
    if (!payload.location_id) {
      delete payload.location_id;
    }
    try {
      if (editingTemplate?.id) {
        await updateTemplate(editingTemplate.id, payload);
        if (onNotify) onNotify('success', 'Payslip Template', 'Template updated');
      } else {
        await createTemplate(payload);
        if (onNotify) onNotify('success', 'Payslip Template', 'Template created');
      }
      resetTemplateForm();
      loadTemplates();
      setShowTemplateModal(false);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Payslip Template', 'Save failed');
    }
  };

  const handleTemplateDelete = async (id) => {
    if (!window.confirm('Delete this payslip template?')) return;
    try {
      await deleteTemplate(id);
      if (onNotify) onNotify('success', 'Payslip Template', 'Template deleted');
      loadTemplates();
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Payslip Template', 'Delete failed');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePayslip(id);
      if (onNotify) onNotify('success', 'Payslip', 'Payslip approved');
      fetchList();
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('error', 'Payslip', 'Approve failed');
    }
  };

  const tabItems = useMemo(
    () => [
      { id: 'records', label: 'Records' },
      { id: 'generate', label: 'Generate' },
      { id: 'configs', label: 'Field Configs' },
      { id: 'fields', label: 'Fields' },
      { id: 'templates', label: 'Templates' },
      { id: 'reports', label: 'Reports' },
    ],
    []
  );

  const currentTabTitle = tabItems.find((t) => t.id === tab)?.label || 'Payslip';

  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      const statusOk =
        recordStatus === 'ALL' ? true : (p.status || 'DRAFT').toUpperCase() === recordStatus;
      const monthOk = recordMonth ? (p.month || '').startsWith(recordMonth) : true;
      const text = recordSearch.trim().toLowerCase();
      const textOk =
        !text ||
        [p.employee_name, p.employee, p.employee_email, p.month, p.id]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(text));
      return statusOk && monthOk && textOk;
    });
  }, [payslips, recordStatus, recordMonth, recordSearch]);

  const recordStats = useMemo(() => {
    const total = payslips.length;
    const draft = payslips.filter((p) => (p.status || 'DRAFT').toUpperCase() === 'DRAFT').length;
    const approved = payslips.filter((p) => (p.status || '').toUpperCase() === 'APPROVED').length;
    const paid = payslips.filter((p) => (p.status || '').toUpperCase() === 'PAID').length;
    return { total, draft, approved, paid };
  }, [payslips]);

  return (
    <div className="payslip-page">
      {/* <div className="payslip-header">
        <h1>💰 Payslip Management</h1>
        <p>Generate, review, approve, and manage payroll artifacts in one unified workspace.</p>
      </div> */}

      {/* Stats Overview */}
      {/* <div className="payslip-stats">
        <div className="stat-card">
          <div className="stat-label">📊 Total Payslips</div>
          <div className="stat-value">{recordStats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📝 Draft</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{recordStats.draft}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ Approved</div>
          <div className="stat-value" style={{ color: '#059669' }}>{recordStats.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">💳 Paid</div>
          <div className="stat-value" style={{ color: '#2563eb' }}>{recordStats.paid}</div>
        </div>
      </div> */}

      {/* Tabs */}
      <div className="payslip-tabs">
        {tabItems.map((item) => (
          <button
            key={item.id}
            className={`payslip-tab ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="payslip-content">
        {tab === 'records' && (
          <div>
            <h3 className="payslip-section-title">📋 Payslip Records</h3>
            <p style={{ color: '#667085', marginBottom: '1rem' }}>Filter by employee, month, or status to quickly find a payslip.</p>

            <div className="payslip-filters">
              <input
                type="search"
                placeholder="🔍 Search by employee, email, or ID"
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
              />
              <select value={recordStatus} onChange={(e) => setRecordStatus(e.target.value)}>
                <option value="ALL">📌 All Status</option>
                <option value="DRAFT">✏️ Draft</option>
                <option value="APPROVED">✅ Approved</option>
                <option value="PAID">💳 Paid</option>
              </select>
              <input
                type="month"
                value={recordMonth}
                onChange={(e) => setRecordMonth(e.target.value)}
                placeholder="Month"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setRecordSearch('');
                  setRecordStatus('ALL');
                  setRecordMonth('');
                }}
              >
                Clear
              </button>
            </div>

            <div className="payslip-actions">
              <button className="btn-primary" onClick={fetchList} disabled={loading}>
                {loading ? '🔄 Refreshing…' : '🔄 Refresh'}
              </button>
              <button className="btn-secondary" onClick={() => setTab('generate')}>
                ➕ Generate New
              </button>
            </div>

            {lastRefreshed && (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Last updated: {lastRefreshed.toLocaleString()}
              </div>
            )}

            {loading ? (
              <div className="payslip-loading">Loading payslips…</div>
            ) : filteredPayslips.length === 0 ? (
              <div className="payslip-empty-state">
                <div className="payslip-empty-state-icon">📭</div>
                <h3>No Payslips Found</h3>
                <p>Try clearing your search or picking another month.</p>
              </div>
            ) : (
              <div className="payslip-table-wrapper">
                <table className="payslip-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Month</th>
                      <th>Status</th>
                      <th>Net Pay</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayslips.map((p) => (
                      <tr key={p.id}>
                        <td><strong>#{p.id}</strong></td>
                        <td>{p.employee_name || p.employee || p.employee_email}</td>
                        <td>{p.month || p.period}</td>
                        <td>
                          <span
                            className={`status-badge ${(p.status || 'DRAFT').toLowerCase()}`}
                          >
                            {p.status || 'DRAFT'}
                          </span>
                        </td>
                        <td><strong>₹{p.net_pay ?? p.amount ?? '-'}</strong></td>
                        <td>
                          <button className="btn-small" onClick={() => handleDownload(p.id, `payslip-${p.id}.pdf`)}>📥 Download</button>
                          <button className="btn-small" onClick={() => handleApprove(p.id)}>✅ Approve</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'generate' && (
          <div>
            <h3 className="payslip-section-title">➕ Generate New Payslip</h3>
            <div className="payslip-form">
              <form onSubmit={handleGenerate} className="payslip-form-row">
                <label>
                  👤 Employee *
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    disabled={employeesLoading}
                  >
                    <option value="">— Select Employee —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.employee_code ? `(${emp.employee_code})` : ''} {emp.email ? `- ${emp.email}` : ''}
                      </option>
                    ))}
                  </select>
                  {employeesLoading && <small style={{ color: '#667085' }}>Loading employees...</small>}
                </label>

                <label>
                  📅 Month *
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
                </label>

                <label>
                  🎨 Field Config
                  <select
                    value={fieldConfigId}
                    onChange={(e) => setFieldConfigId(e.target.value)}
                  >
                    <option value="">— Auto-select (Optional) —</option>
                    {configs.filter(c => c.is_active).map((cfg) => (
                      <option key={cfg.id} value={cfg.id}>
                        {cfg.config_name} {cfg.location_name ? `(${cfg.location_name})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  📄 Template
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    <option value="">— Auto-select (Optional) —</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.location_name || tpl.location_id || 'Template'} {tpl.company_name ? `- ${tpl.company_name}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn-primary">Generate Payslip</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div>
            <h3 className="payslip-section-title">📊 Payslip Reports</h3>
            <p style={{ color: '#667085', marginBottom: '1.5rem' }}>Generate comprehensive payroll summaries and export data for analysis.</p>
            <div className="payslip-actions">
              <button className="btn-primary" onClick={handleReports} disabled={loading}>
                {loading ? '🔄 Generating…' : '📥 Generate Reports'}
              </button>
            </div>
            {loading && <div className="payslip-loading">Generating reports…</div>}
          </div>
        )}

        {tab === 'configs' && (
          <div>
            <h3 className="payslip-section-title">⚙️ Field Configurations</h3>
            <p style={{ color: '#667085', marginBottom: '1rem' }}>Manage payslip field configurations for different locations and requirements.</p>
            {configLoading ? (
              <div className="payslip-loading">Loading configurations…</div>
            ) : (
              <div>
                <div className="payslip-actions">
                  <button className="btn-primary" onClick={resetConfigForm}>➕ New Config</button>
                </div>
                <div className="payslip-table-wrapper">
                  <table className="payslip-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Location</th>
                        <th>Active</th>
                        <th>Fields</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((c) => (
                        <tr key={c.id}>
                          <td><strong>#{c.id}</strong></td>
                          <td>{c.config_name}</td>
                          <td>{c.description || '—'}</td>
                          <td>{c.location_name || c.location_id || '—'}</td>
                          <td>{c.is_active ? '✅ Yes' : '❌ No'}</td>
                          <td><span style={{ background: '#667eea30', padding: '4px 8px', borderRadius: 4 }}>{c.fields_count ?? '0'}</span></td>
                          <td>
                            <button className="btn-small" onClick={() => { setEditingConfig(c); setConfigForm({
                              config_name: c.config_name || '',
                              description: c.description || '',
                              location_id: c.location || c.location_id || '',
                              is_active: c.is_active ?? true,
                            }); }}>✏️ Edit</button>
                            <button className="btn-small" onClick={() => handleDeleteConfig(c.id)}>🗑️ Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem' }}>
                    {editingConfig?.id ? '✏️ Edit Configuration' : '➕ Create New Configuration'}
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateOrUpdateConfig({
                        config_name: configForm.config_name,
                        description: configForm.description,
                        location_id: configForm.location_id,
                        is_active: configForm.is_active,
                      });
                    }}
                    className="payslip-form"
                  >
                    <label>
                      Config Name *
                      <input
                        value={configForm.config_name}
                        onChange={(e) => setConfigForm({ ...configForm, config_name: e.target.value })}
                        placeholder="e.g. Standard, Executive"
                        required
                      />
                    </label>
                    <label>
                      Description
                      <input
                        value={configForm.description}
                        onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </label>
                    <label>
                      Location
                      <select
                        value={configForm.location_id}
                        onChange={(e) => setConfigForm({ ...configForm, location_id: e.target.value })}
                        disabled={locationsLoading}
                      >
                        <option value="">— Select Location (Optional) —</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      {locationsLoading && <small style={{ color: '#667085' }}>Loading locations...</small>}
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={configForm.is_active}
                        onChange={(e) => setConfigForm({ ...configForm, is_active: e.target.checked })}
                      />
                      Active
                    </label>
                    <div className="payslip-form-actions">
                      <button type="submit" className="btn-primary">Save Config</button>
                      <button type="button" className="btn-secondary" onClick={resetConfigForm}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'fields' && (
          <div>
            <h3 className="payslip-section-title">🏷️ Payslip Fields</h3>
            <p style={{ color: '#667085', marginBottom: '1rem' }}>Add and configure individual fields for payslip calculations.</p>
            <div className="payslip-form" style={{ marginBottom: '1.5rem' }}>
              <label>
                Select Configuration
                <select
                  value={selectedConfigForFields}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedConfigForFields(id);
                    loadFields(id);
                    resetFieldForm();
                  }}
                >
                  <option value="">— Choose a config —</option>
                  {configs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.config_name} ({c.location_name || c.location_id || 'Location'})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedConfigForFields && (
              <>
                {fieldLoading ? (
                  <div className="payslip-loading">Loading fields…</div>
                ) : (
                  <div className="payslip-table-wrapper" style={{ marginBottom: '2rem' }}>
                    <table className="payslip-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Code</th>
                          <th>Type</th>
                          <th>Value</th>
                          <th>Visible</th>
                          <th>Order</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((f) => (
                          <tr key={f.id}>
                            <td><strong>{f.field_name}</strong></td>
                            <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 3 }}>{f.field_code}</code></td>
                            <td><span style={{ background: '#667eea30', padding: '4px 8px', borderRadius: 4 }}>{f.field_type}</span></td>
                            <td>{f.value_type}: {f.value}</td>
                            <td>{f.is_visible ? '✅' : '❌'}</td>
                            <td>{f.display_order}</td>
                            <td>
                              <button
                                className="btn-small"
                                onClick={() => {
                                  setEditingField(f);
                                  setFieldForm({
                                    field_name: f.field_name || '',
                                    field_type: f.field_type || 'EARNING',
                                    value_type: f.value_type || 'FIXED',
                                    value: f.value || '',
                                    display_order: f.display_order || 1,
                                    is_visible: !!f.is_visible,
                                    default_value: f.default_value || '',
                                  });
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button className="btn-small" onClick={() => handleFieldDelete(f.id)}>🗑️ Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem' }}>
                    {editingField?.id ? '✏️ Edit Field' : '➕ Add New Field'}
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleFieldSave({
                        field_name: fieldForm.field_name,
                        field_type: fieldForm.field_type,
                        value_type: fieldForm.value_type,
                        value: fieldForm.value,
                        display_order: Number(fieldForm.display_order) || 1,
                        is_visible: fieldForm.is_visible,
                        default_value: fieldForm.default_value || null,
                      });
                    }}
                    className="payslip-form"
                  >
                    <div className="payslip-form-row">
                      <label>
                        Field Name *
                        <input
                          value={fieldForm.field_name}
                          onChange={(e) => setFieldForm({ ...fieldForm, field_name: e.target.value })}
                          placeholder="e.g. Basic Salary"
                          required
                        />
                      </label>
                      <label>
                        Field Type
                        <select
                          value={fieldForm.field_type}
                          onChange={(e) => setFieldForm({ ...fieldForm, field_type: e.target.value })}
                        >
                          <option value="EARNING">💰 Earning</option>
                          <option value="DEDUCTION">📉 Deduction</option>
                          <option value="INFO">ℹ️ Info</option>
                        </select>
                      </label>
                    </div>
                    <div className="payslip-form-row">
                      <label>
                        Value Type
                        <select
                          value={fieldForm.value_type}
                          onChange={(e) => setFieldForm({ ...fieldForm, value_type: e.target.value })}
                        >
                          <option value="FIXED">Fixed Amount</option>
                          <option value="PERCENTAGE">Percentage</option>
                          <option value="CALCULATION">Formula</option>
                        </select>
                      </label>
                      <label>
                        Value *
                        <input
                          value={fieldForm.value}
                          onChange={(e) => setFieldForm({ ...fieldForm, value: e.target.value })}
                          placeholder="2000 or 60 or gross_salary*0.1"
                          required
                        />
                      </label>
                    </div>
                    <div className="payslip-form-row">
                      <label>
                        Display Order
                        <input
                          type="number"
                          value={fieldForm.display_order}
                          onChange={(e) => setFieldForm({ ...fieldForm, display_order: e.target.value })}
                          min={1}
                        />
                      </label>
                      <label>
                        Default Value
                        <input
                          value={fieldForm.default_value}
                          onChange={(e) => setFieldForm({ ...fieldForm, default_value: e.target.value })}
                          placeholder="Optional"
                        />
                      </label>
                    </div>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={fieldForm.is_visible}
                        onChange={(e) => setFieldForm({ ...fieldForm, is_visible: e.target.checked })}
                      />
                      Visible on payslip
                    </label>
                    <div className="payslip-form-actions">
                      <button type="submit" className="btn-primary">Save Field</button>
                      <button type="button" className="btn-secondary" onClick={resetFieldForm}>Cancel</button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'templates' && (
          <div>
            <h3 className="payslip-section-title">📄 Layout Templates</h3>
            <p style={{ color: '#667085', marginBottom: '1rem' }}>Create and manage visual templates for payslip documents.</p>
            {templateLoading ? (
              <div className="payslip-loading">Loading templates…</div>
            ) : (
              <div>
                <div className="payslip-actions">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      resetTemplateForm();
                      setShowTemplateModal(true);
                    }}
                  >
                    ➕ New Template
                  </button>
                </div>
                <div className="payslip-table-wrapper">
                  <table className="payslip-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Location</th>
                        <th>Company</th>
                        <th>Header</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((t) => (
                        <tr key={t.id}>
                          <td><strong>#{t.id}</strong></td>
                          <td>{t.location_name || t.location_id}</td>
                          <td>{t.company_name || '—'}</td>
                          <td>{t.header_text || '—'}</td>
                          <td>
                            <button
                              className="btn-small"
                              onClick={() => {
                                  setEditingTemplate(t);
                                  setTemplateForm({
                                    location_id: t.location || t.location_id || '',
                                    company_name: t.company_name || '',
                                    company_address: t.company_address || '',
                                    company_email: t.company_email || '',
                                    company_phone: t.company_phone || '',
                                    header_text: t.header_text || '',
                                    footer_text: t.footer_text || '',
                                    header_color: t.header_color || '#1e40af',
                                    footer_color: t.footer_color || '#64748b',
                                    page_size: t.page_size || 'A4',
                                    orientation: t.orientation || 'portrait',
                                    font_size: t.font_size || 10,
                                  });
                                  setShowTemplateModal(true);
                                }}
                            >
                              ✏️ Edit
                            </button>
                            <button className="btn-small" onClick={() => handleTemplateDelete(t.id)}>🗑️ Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {showTemplateModal && (
              <Modal
                title={editingTemplate?.id ? '✏️ Edit Payslip Template' : '➕ New Payslip Template'}
                onClose={() => setShowTemplateModal(false)}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleTemplateSave({
                      location_id: templateForm.location_id,
                      company_name: templateForm.company_name,
                      company_address: templateForm.company_address,
                      company_email: templateForm.company_email,
                      company_phone: templateForm.company_phone,
                      header_text: templateForm.header_text,
                      footer_text: templateForm.footer_text,
                      header_color: templateForm.header_color,
                      footer_color: templateForm.footer_color,
                      page_size: templateForm.page_size,
                      orientation: templateForm.orientation,
                      font_size: templateForm.font_size,
                    });
                  }}
                  className="payslip-form"
                >
                  <div className="payslip-form-row">
                    <label>
                      Location *
                      <select
                        value={templateForm.location_id}
                        onChange={(e) => setTemplateForm({ ...templateForm, location_id: e.target.value })}
                        required
                        disabled={locationsLoading}
                      >
                        <option value="">— Select Location —</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      {locationsLoading && <small style={{ color: '#667085' }}>Loading locations...</small>}
                    </label>
                    <label>
                      Company Name
                      <input
                        value={templateForm.company_name}
                        onChange={(e) => setTemplateForm({ ...templateForm, company_name: e.target.value })}
                        placeholder="Your Company Inc."
                      />
                    </label>
                  </div>
                  <label>
                    Company Address
                    <textarea
                      value={templateForm.company_address}
                      onChange={(e) => setTemplateForm({ ...templateForm, company_address: e.target.value })}
                      rows={2}
                      placeholder="Full address"
                    />
                  </label>
                  <div className="payslip-form-row">
                    <label>
                      Company Email
                      <input
                        value={templateForm.company_email}
                        onChange={(e) => setTemplateForm({ ...templateForm, company_email: e.target.value })}
                        type="email"
                      />
                    </label>
                    <label>
                      Company Phone
                      <input
                        value={templateForm.company_phone}
                        onChange={(e) => setTemplateForm({ ...templateForm, company_phone: e.target.value })}
                        type="tel"
                      />
                    </label>
                  </div>
                  <div className="payslip-form-row">
                    <label>
                      Header Text
                      <input
                        value={templateForm.header_text}
                        onChange={(e) => setTemplateForm({ ...templateForm, header_text: e.target.value })}
                        placeholder="e.g. Monthly Salary Statement"
                      />
                    </label>
                    <label>
                      Footer Text
                      <input
                        value={templateForm.footer_text}
                        onChange={(e) => setTemplateForm({ ...templateForm, footer_text: e.target.value })}
                        placeholder="e.g. Confidential"
                      />
                    </label>
                  </div>
                  <div className="payslip-form-row">
                    <label>
                      Header Color
                      <input
                        type="color"
                        value={templateForm.header_color}
                        onChange={(e) => setTemplateForm({ ...templateForm, header_color: e.target.value })}
                        className="payslip-color-input"
                      />
                    </label>
                    <label>
                      Footer Color
                      <input
                        type="color"
                        value={templateForm.footer_color}
                        onChange={(e) => setTemplateForm({ ...templateForm, footer_color: e.target.value })}
                        className="payslip-color-input"
                      />
                    </label>
                  </div>
                  <div className="payslip-form-row">
                    <label>
                      Page Size
                      <select
                        value={templateForm.page_size}
                        onChange={(e) => setTemplateForm({ ...templateForm, page_size: e.target.value })}
                      >
                        <option value="A4">A4 (210×297mm)</option>
                        <option value="A5">A5 (148×210mm)</option>
                      </select>
                    </label>
                    <label>
                      Orientation
                      <select
                        value={templateForm.orientation}
                        onChange={(e) => setTemplateForm({ ...templateForm, orientation: e.target.value })}
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </label>
                    <label>
                      Font Size
                      <input
                        type="number"
                        value={templateForm.font_size}
                        min={8}
                        max={18}
                        onChange={(e) => setTemplateForm({ ...templateForm, font_size: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <div className="payslip-form-actions">
                    <button type="submit" className="btn-primary">Save Template</button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        resetTemplateForm();
                        setShowTemplateModal(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Modal>
            )}
          </div>

        )}

      </div>
    </div>

  );
};

export default PayslipPage;
