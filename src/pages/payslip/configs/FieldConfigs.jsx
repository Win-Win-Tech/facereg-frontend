import React, { useState, useCallback, useRef } from 'react';
import {
    getPayslipConfigs,
    createPayslipConfig,
    updatePayslipConfig,
    deletePayslipConfig,
    listFields,
    createField,
    updateField,
    deleteField
} from '../../../api/payslipApi';
import DataTable from '../../../components/DataTable';
import useTabActive from '../../../hooks/useTabActive';
// import '../../styles/ManagementPages.css';
import "../../../styles/ManagementPages.css";

const FieldConfigs = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const [configs, setConfigs] = useState([]);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Track if data has been loaded for this tab
    const hasLoadedRef = useRef(false);

    // Sub-tabs
    const [subTab, setSubTab] = useState('configs');
    const [fieldSubTab, setFieldSubTab] = useState('list');

    // Forms
    const [configForm, setConfigForm] = useState({
        id: null,
        config_name: '',
        description: ''
    });
    const [fieldForm, setFieldForm] = useState({
        id: null,
        field_name: '',
        field_type: 'EARNING',
        value_type: 'PERCENTAGE',
        value: '',
        display_order: 1,
        is_visible: true
    });

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const params = filterLocation ? { location_id: filterLocation } : {};
            const response = await getPayslipConfigs(params);
            const configList = Array.isArray(response.data) ? response.data : [];
            setConfigs(configList);

            if (configList.length > 0 && !selectedConfig) {
                setSelectedConfig(configList[0]);
            }
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load configurations');
        } finally {
            setLoading(false);
        }
    }, [filterLocation, onNotify, selectedConfig]);

    const loadFields = useCallback(async () => {
        if (!selectedConfig) return;

        setFieldsLoading(true);
        try {
            const response = await listFields(selectedConfig.id);
            setFields(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load fields');
        } finally {
            setFieldsLoading(false);
        }
    }, [selectedConfig, onNotify]);

    // Load data when tab becomes active
    useTabActive('configs', () => {
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadConfigs();
        }
    });

    // Load fields when selectedConfig changes
    React.useEffect(() => {
        if (selectedConfig) {
            loadFields();
        }
    }, [selectedConfig, loadFields]);

    const handleConfigSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...configForm,
                location_id: filterLocation
            };

            if (configForm.id) {
                await updatePayslipConfig(configForm.id, payload);
                onNotify?.('success', 'Success', 'Configuration updated');
            } else {
                await createPayslipConfig(payload);
                onNotify?.('success', 'Success', 'Configuration created');
            }
            setSubTab('configs');
            setConfigForm({ id: null, config_name: '', description: '' });
            loadConfigs();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to save configuration');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfig = async (config) => {
        if (!window.confirm(`Delete "${config.config_name}"? This cannot be undone.`)) return;

        try {
            await deletePayslipConfig(config.id);
            onNotify?.('success', 'Success', 'Configuration deleted');
            if (selectedConfig?.id === config.id) {
                setSelectedConfig(null);
                setFields([]);
            }
            loadConfigs();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to delete configuration');
        }
    };

    const openEditConfig = (config) => {
        setConfigForm({
            id: config.id,
            config_name: config.config_name,
            description: config.description || ''
        });
        setSubTab('add-config');
    };

    const openCreateConfig = () => {
        setConfigForm({ id: null, config_name: '', description: '' });
        setSubTab('add-config');
    };

    const handleFieldSubmit = async (e) => {
        e.preventDefault();
        if (!selectedConfig) return;

        setSubmitting(true);
        try {
            if (fieldForm.id) {
                await updateField(selectedConfig.id, fieldForm.id, fieldForm);
                onNotify?.('success', 'Success', 'Field updated');
            } else {
                await createField(selectedConfig.id, fieldForm);
                onNotify?.('success', 'Success', 'Field created');
            }
            setFieldSubTab('list');
            resetFieldForm();
            loadFields();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to save field');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteField = async (field) => {
        if (!window.confirm(`Delete "${field.field_name}"?`)) return;

        try {
            await deleteField(selectedConfig.id, field.id);
            onNotify?.('success', 'Success', 'Field deleted');
            loadFields();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to delete field');
        }
    };

    const openEditField = (field) => {
        setFieldForm({
            id: field.id,
            field_name: field.field_name,
            field_type: field.field_type,
            value_type: field.value_type,
            value: field.value,
            display_order: field.display_order,
            is_visible: field.is_visible
        });
        setFieldSubTab('add-field');
    };

    const resetFieldForm = () => {
        setFieldForm({
            id: null,
            field_name: '',
            field_type: 'EARNING',
            value_type: 'PERCENTAGE',
            value: '',
            display_order: fields.length + 1,
            is_visible: true
        });
    };

    const configColumns = [
        { key: 'config_name', label: 'Configuration Name' },
        { key: 'description', label: 'Description', render: (val) => val || '—' },
        { key: 'fields_count', label: 'Fields Count' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="actions">
                    <button className="edit" onClick={() => {
                        setSelectedConfig(row);
                        setSubTab('fields');
                        setFieldSubTab('list');
                    }}>📋 Manage Fields</button>
                    <button className="edit" onClick={() => openEditConfig(row)}>✏️ Edit</button>
                    <button className="delete" onClick={() => handleDeleteConfig(row)}>🗑️ Delete</button>
                </div>
            )
        }
    ];

    const earningFields = fields.filter(f => f.field_type === 'EARNING');
    const deductionFields = fields.filter(f => f.field_type === 'DEDUCTION');

    const fieldColumns = [
        { key: 'field_name', label: 'Field Name' },
        {
            key: 'field_type',
            label: 'Type',
            render: (val) => (
                <span className={`status-badge ${val === 'EARNING' ? 'approved' : 'rejected'}`}>
                    {val}
                </span>
            )
        },
        {
            key: 'value_type',
            label: 'Value Type',
            render: (val) => val
        },
        { key: 'value', label: 'Value' },
        { key: 'display_order', label: 'Order' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="actions">
                    <button className="edit" onClick={() => openEditField(row)}>✏️ Edit</button>
                    <button className="delete" onClick={() => handleDeleteField(row)}>🗑️ Delete</button>
                </div>
            )
        }
    ];

    return (
        <div className="tab-content-container" style={{ width: '100%', maxWidth: '100%', overflow: 'visible', minHeight: 'auto', height: 'auto' }}>
            {subTab === 'configs' && (
                <>
                    <div className="sub-tabs">
                        <button
                            className={subTab === 'configs' ? 'active' : ''}
                            onClick={() => setSubTab('configs')}
                        >
                            💰 Configurations
                        </button>
                        <button
                            className={subTab === 'add-config' ? 'active' : ''}
                            onClick={openCreateConfig}
                        >
                            ➕ {configForm.id ? 'Edit Config' : 'Add Config'}
                        </button>
                    </div>

                    <div className="management-card" style={{ width: '100%', maxWidth: '100%' }}>
                        <div className="card-header">
                            <h3>Salary Configurations</h3>
                        </div>
                        <DataTable
                            columns={configColumns}
                            data={configs}
                            isLoading={loading}
                            rowKey="id"
                            wrapperStyle={{ 
                                maxHeight: 'calc(100vh - 350px)', 
                                overflowY: 'auto', 
                                overflowX: 'auto', 
                                width: '100%', 
                                maxWidth: '100%' 
                            }}
                        />
                    </div>
                </>
            )}

            {subTab === 'add-config' && (
                <>
                    <div className="sub-tabs">
                        <button
                            className={subTab === 'configs' ? 'active' : ''}
                            onClick={() => {
                                setSubTab('configs');
                                setConfigForm({ id: null, config_name: '', description: '' });
                            }}
                        >
                            💰 Configurations
                        </button>
                        <button
                            className={subTab === 'add-config' ? 'active' : ''}
                        >
                            ➕ {configForm.id ? 'Edit Config' : 'Add Config'}
                        </button>
                    </div>

                    <div className="management-card">
                        <div className="card-header">
                            <h3>{configForm.id ? 'Edit' : 'Create'} Salary Configuration</h3>
                        </div>
                        <form onSubmit={handleConfigSubmit} className="management-form">
                            <label>
                                <span>Configuration Name <span className="required-indicator">*</span></span>
                                <input
                                    type="text"
                                    value={configForm.config_name}
                                    onChange={(e) => setConfigForm({ ...configForm, config_name: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </label>
                            <label>
                                <span>Description</span>
                                <textarea
                                    value={configForm.description}
                                    onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                                    className="form-control"
                                    rows={3}
                                />
                            </label>
                            <div className="management-actions">
                                <button
                                    type="button"
                                    className="primary-btn secondary"
                                    onClick={() => {
                                        setSubTab('configs');
                                        setConfigForm({ id: null, config_name: '', description: '' });
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : (configForm.id ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {selectedConfig && subTab === 'fields' && (
                <>
                    <div className="sub-tabs">
                        <button
                            className={subTab === 'configs' ? 'active' : ''}
                            onClick={() => {
                                setSubTab('configs');
                                setSelectedConfig(null);
                            }}
                        >
                            ← Back to Configs
                        </button>
                        <button
                            className={fieldSubTab === 'list' ? 'active' : ''}
                            onClick={() => setFieldSubTab('list')}
                        >
                            📋 Fields: {selectedConfig.config_name}
                        </button>
                        <button
                            className={fieldSubTab === 'add-field' ? 'active' : ''}
                            onClick={() => {
                                resetFieldForm();
                                setFieldSubTab('add-field');
                            }}
                        >
                            ➕ {fieldForm.id ? 'Edit Field' : 'Add Field'}
                        </button>
                    </div>

                    {fieldSubTab === 'list' && (
                        <div className="management-card" style={{ 
                            width: '100%',
                            maxWidth: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'visible',
                            minHeight: 'auto',
                            position: 'relative'
                        }}>
                            <div className="card-header" style={{ 
                                // position: 'sticky', 
                                top: 0, 
                                backgroundColor: '#ffffff', 
                                zIndex: 1000, 
                                paddingTop: '1rem',
                                paddingBottom: '1rem', 
                                paddingLeft: '1rem',
                                paddingRight: '1rem',
                                borderBottom: '2px solid #e2e8f0',
                                marginBottom: '1rem',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                marginTop: 0,
                                flexShrink: 0,
                                isolation: 'isolate'
                            }}>
                                <h3>{selectedConfig.config_name} - Fields</h3>
                            </div>

                            <div style={{ marginBottom: '1.5rem', padding: '0 1rem', position: 'relative', zIndex: 1 }}>
                                <h4 style={{ 
                                    fontSize: '0.95rem', 
                                    color: '#475569', 
                                    marginTop: '0',
                                    marginBottom: '0.75rem', 
                                    fontWeight: '600',
                                    paddingTop: '0.5rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    Earnings ({earningFields.length})
                                </h4>
                                {earningFields.length > 0 ? (
                                    <DataTable
                                        columns={fieldColumns}
                                        data={earningFields}
                                        isLoading={fieldsLoading}
                                        rowKey="id"
                                        wrapperStyle={{ 
                                            maxHeight: '300px', 
                                            overflowY: 'auto', 
                                            overflowX: 'auto',
                                            width: '100%',
                                            maxWidth: '100%',
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                    />
                                ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                        No earnings fields configured
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '0 1rem', paddingBottom: '3rem', marginTop: '1rem', position: 'relative', zIndex: 1 }}>
                                <h4 style={{ 
                                    fontSize: '0.95rem', 
                                    color: '#475569', 
                                    marginTop: '0',
                                    marginBottom: '0.75rem', 
                                    fontWeight: '600',
                                    paddingTop: '0.5rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    Deductions ({deductionFields.length})
                                </h4>
                                {deductionFields.length > 0 ? (
                                    <DataTable
                                        columns={fieldColumns}
                                        data={deductionFields}
                                        isLoading={fieldsLoading}
                                        rowKey="id"
                                        wrapperStyle={{ 
                                            maxHeight: '300px', 
                                            overflowY: 'auto', 
                                            overflowX: 'auto',
                                            width: '100%',
                                            maxWidth: '100%',
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                    />
                                ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                        No deduction fields configured
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {fieldSubTab === 'add-field' && (
                        <div className="management-card">
                            <div className="card-header">
                                <h3>{fieldForm.id ? 'Edit' : 'Add'} Salary Field</h3>
                            </div>
                            <form onSubmit={handleFieldSubmit} className="management-form">
                                <div className="management-form-two-column">
                                    <label>
                                        <span>Field Name <span className="required-indicator">*</span></span>
                                        <input
                                            type="text"
                                            value={fieldForm.field_name}
                                            onChange={(e) => setFieldForm({ ...fieldForm, field_name: e.target.value })}
                                            className="form-control"
                                            required
                                        />
                                    </label>
                                    <label>
                                        <span>Type</span>
                                        <select
                                            value={fieldForm.field_type}
                                            onChange={(e) => setFieldForm({ ...fieldForm, field_type: e.target.value })}
                                            className="form-control"
                                        >
                                            <option value="EARNING">Earning (+)</option>
                                            <option value="DEDUCTION">Deduction (−)</option>
                                            <option value="INFO">Information</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="management-form-two-column">
                                    <label>
                                        <span>Value Type</span>
                                        <select
                                            value={fieldForm.value_type}
                                            onChange={(e) => setFieldForm({ ...fieldForm, value_type: e.target.value })}
                                            className="form-control"
                                        >
                                            <option value="PERCENTAGE">Percentage of Gross</option>
                                            <option value="FIXED">Fixed Amount</option>
                                            <option value="CALCULATION">Custom Calculation</option>
                                        </select>
                                    </label>
                                    <label>
                                        <span>Value <span className="required-indicator">*</span></span>
                                        <input
                                            type="text"
                                            value={fieldForm.value}
                                            onChange={(e) => setFieldForm({ ...fieldForm, value: e.target.value })}
                                            className="form-control"
                                            required
                                            placeholder={fieldForm.value_type === 'PERCENTAGE' ? 'e.g., 40' : 'e.g., 5000'}
                                        />
                                    </label>
                                </div>

                                <div className="management-form-two-column">
                                    <label>
                                        <span>Display Order</span>
                                        <input
                                            type="number"
                                            value={fieldForm.display_order}
                                            onChange={(e) => setFieldForm({ ...fieldForm, display_order: parseInt(e.target.value) || 1 })}
                                            className="form-control"
                                            min={1}
                                        />
                                    </label>
                                    <label>
                                        <span>Visibility</span>
                                        <div style={{ paddingTop: '0.5rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={fieldForm.is_visible}
                                                    onChange={(e) => setFieldForm({ ...fieldForm, is_visible: e.target.checked })}
                                                />
                                                <span>Show on payslip</span>
                                            </label>
                                        </div>
                                    </label>
                                </div>

                                <div className="management-actions">
                                    <button
                                        type="button"
                                        className="primary-btn secondary"
                                        onClick={() => {
                                            setFieldSubTab('list');
                                            resetFieldForm();
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="primary-btn"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Saving...' : (fieldForm.id ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </>
            )}

        </div>
    );
};

export default FieldConfigs;
