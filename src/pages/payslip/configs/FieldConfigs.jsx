import React, { useState, useCallback, useRef } from 'react';
import {
    getPayslipConfigs,
    createPayslipConfig,
    updatePayslipConfig,
    deletePayslipConfig,
    listFields,
    createField,
    updateField,
    deleteField,
    createDefaultSalaryConfig,
    bulkCreateFields
} from '../../../api/payslipApi';
import DataTable from '../../../components/DataTable';
import useTabActive from '../../../hooks/useTabActive';
import FieldConfigHelpModal from './FieldConfigHelpModal';
// import '../../styles/ManagementPages.css';
import "../../../styles/ManagementPages.css";

const FieldConfigs = ({ onNotify, filterLocation, isSuperAdmin, locationsLoaded }) => {
    const [configs, setConfigs] = useState([]);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [creatingDefault, setCreatingDefault] = useState(false);

    // Track if data has been loaded for this tab
    const hasLoadedRef = useRef(false);

    // Sub-tabs
    const [subTab, setSubTab] = useState('configs');
    const [fieldSubTab, setFieldSubTab] = useState('list');
    const [showHelpModal, setShowHelpModal] = useState(false);

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

            // Use functional update to avoid dependency on selectedConfig
            setSelectedConfig(prev => {
                if (configList.length > 0 && !prev) {
                    return configList[0];
                }
                return prev;
            });
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load configurations');
        } finally {
            setLoading(false);
        }
    }, [filterLocation, onNotify]);

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

    // Load data when tab becomes active (only if locations are loaded)
    useTabActive('configs', () => {
        if (!hasLoadedRef.current && locationsLoaded) {
            hasLoadedRef.current = true;
            loadConfigs();
        }
    });

    // Also trigger load when locations become loaded (for initial mount)
    React.useEffect(() => {
        if (locationsLoaded && !hasLoadedRef.current) {
            // Check if this tab is active
            const path = window.location.pathname;
            if (path.includes('/payslip/configs')) {
                hasLoadedRef.current = true;
                loadConfigs();
            }
        }
    }, [locationsLoaded]); // Only depend on locationsLoaded

    // Reload configs when filterLocation changes
    React.useEffect(() => {
        if (hasLoadedRef.current) {
            const loadConfigsData = async () => {
                setLoading(true);
                try {
                    const params = filterLocation ? { location_id: filterLocation } : {};
                    const response = await getPayslipConfigs(params);
                    const configList = Array.isArray(response.data) ? response.data : [];
                    setConfigs(configList);
                    setSelectedConfig(prev => {
                        if (configList.length > 0 && !prev) {
                            return configList[0];
                        }
                        return prev;
                    });
                } catch (error) {
                    onNotify?.('error', 'Error', 'Failed to load configurations');
                } finally {
                    setLoading(false);
                }
            };
            loadConfigsData();
            // Reset selected config when location changes
            setSelectedConfig(null);
            setFields([]);
        }
    }, [filterLocation, onNotify]);

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

    const handleCreateDefaultConfig = async () => {
        if (!filterLocation) {
            onNotify?.('error', 'Error', 'Please select a location first');
            return;
        }

        if (!window.confirm('This will create a default salary configuration with basic earning, deduction, and information fields. Continue?')) {
            return;
        }

        setCreatingDefault(true);
        try {
            const response = await createDefaultSalaryConfig(filterLocation);
            onNotify?.('success', 'Success', response.data.message || 'Default salary config created successfully');
            loadConfigs();
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to create default salary config';
            onNotify?.('error', 'Error', errorMessage);
        } finally {
            setCreatingDefault(false);
        }
    };

    const handleFieldSubmit = async (e) => {
        e.preventDefault();
        if (!selectedConfig) return;

        // Ensure display_order has a valid value
        const formData = {
            ...fieldForm,
            display_order: fieldForm.display_order && fieldForm.display_order >= 1 
                ? fieldForm.display_order 
                : (fields.length + 1)
        };

        setSubmitting(true);
        try {
            if (formData.id) {
                await updateField(selectedConfig.id, formData.id, formData);
                onNotify?.('success', 'Success', 'Field updated');
            } else {
                await createField(selectedConfig.id, formData);
                onNotify?.('success', 'Success', 'Field created');
            }
            setFieldSubTab('list');
            resetFieldForm();
            loadFields();
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 
                                error.response?.data?.non_field_errors?.[0] || 
                                error.response?.data?.message || 
                                'Failed to save field';
            onNotify?.('error', 'Error', errorMessage);
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

    // Bulk create state - form input and added fields list
    const [bulkFieldForm, setBulkFieldForm] = useState({
        field_name: '',
        field_type: 'EARNING',
        value_type: 'PERCENTAGE',
        value: '',
        display_order: '',
        is_visible: true
    });
    const [addedFields, setAddedFields] = useState([]); // List of fields ready to submit
    const [editingFieldIndex, setEditingFieldIndex] = useState(null); // Index of field being edited

    // Validate form before adding to table
    const validateBulkFieldForm = () => {
        if (!bulkFieldForm.field_name || bulkFieldForm.field_name.trim() === '') {
            onNotify?.('error', 'Validation Error', 'Field Name is required');
            return false;
        }
        if (!bulkFieldForm.value || bulkFieldForm.value.trim() === '') {
            onNotify?.('error', 'Validation Error', 'Value is required');
            return false;
        }
        return true;
    };

    // Check for duplicate field names (case-insensitive)
    const checkDuplicateFieldName = (fieldName, excludeIndex = null) => {
        const normalizedName = fieldName.trim().toUpperCase();
        return addedFields.some((field, index) => {
            if (excludeIndex !== null && index === excludeIndex) return false;
            return field.field_name.trim().toUpperCase() === normalizedName;
        });
    };

    // Add field to table
    const addFieldToTable = () => {
        if (!validateBulkFieldForm()) return;

        // Check for duplicate
        if (checkDuplicateFieldName(bulkFieldForm.field_name)) {
            onNotify?.('error', 'Duplicate Field', `A field with name "${bulkFieldForm.field_name}" already exists in the list`);
            return;
        }

        // Auto-generate field_code from field_name
        const fieldCode = bulkFieldForm.field_name
            .toUpperCase()
            .replace(/\s+/g, '_')
            .replace(/[^A-Z0-9_]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

        const newField = {
            ...bulkFieldForm,
            field_code: fieldCode,
            display_order: bulkFieldForm.display_order && bulkFieldForm.display_order >= 1 
                ? bulkFieldForm.display_order 
                : (fields.length + addedFields.length + 1),
            tempId: Date.now() // Temporary ID for table rows
        };

        if (editingFieldIndex !== null) {
            // Update existing field
            const updated = [...addedFields];
            updated[editingFieldIndex] = newField;
            setAddedFields(updated);
            setEditingFieldIndex(null);
            // No success notification - it's temporary until bulk submit
        } else {
            // Add new field
            setAddedFields([...addedFields, newField]);
            // No success notification - it's temporary until bulk submit
        }

        // Reset form
        setBulkFieldForm({
            field_name: '',
            field_type: 'EARNING',
            value_type: 'PERCENTAGE',
            value: '',
            display_order: '',
            is_visible: true
        });
    };

    // Remove field from table
    const removeFieldFromTable = (index) => {
        setAddedFields(addedFields.filter((_, i) => i !== index));
        if (editingFieldIndex === index) {
            setEditingFieldIndex(null);
            setBulkFieldForm({
                field_name: '',
                field_type: 'EARNING',
                value_type: 'PERCENTAGE',
                value: '',
                display_order: '',
                is_visible: true
            });
        } else if (editingFieldIndex > index) {
            setEditingFieldIndex(editingFieldIndex - 1);
        }
    };

    // Edit field from table
    const editFieldFromTable = (index) => {
        const field = addedFields[index];
        setBulkFieldForm({
            field_name: field.field_name,
            field_type: field.field_type,
            value_type: field.value_type,
            value: field.value,
            display_order: field.display_order,
            is_visible: field.is_visible
        });
        setEditingFieldIndex(index);
    };

    // Check for duplicates before submit
    const checkDuplicatesBeforeSubmit = () => {
        const fieldNames = addedFields.map(f => f.field_name.trim().toUpperCase());
        const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
        
        if (duplicates.length > 0) {
            const uniqueDuplicates = [...new Set(duplicates)];
            onNotify?.('error', 'Duplicate Fields', `Duplicate field names found: ${uniqueDuplicates.join(', ')}. Please remove duplicates before submitting.`);
            return false;
        }
        return true;
    };

    // Submit bulk create
    const handleBulkFieldSubmit = async (e) => {
        e.preventDefault();
        if (!selectedConfig) return;

        if (addedFields.length === 0) {
            onNotify?.('error', 'Error', 'Please add at least one field to the list');
            return;
        }

        if (!checkDuplicatesBeforeSubmit()) {
            return;
        }

        // Prepare fields for submission
        const fieldsToSubmit = addedFields.map((field, index) => ({
            field_name: field.field_name,
            field_type: field.field_type,
            value_type: field.value_type,
            value: field.value,
            display_order: field.display_order,
            is_visible: field.is_visible
        }));

        setSubmitting(true);
        try {
            const response = await bulkCreateFields(selectedConfig.id, fieldsToSubmit);
            const data = response.data || {};
            const createdCount = data.created_count || 0;
            const failedCount = data.failed_count || 0;
            const failedFields = data.failed || [];
            
            // Show appropriate notification based on results
            if (failedCount === 0) {
                // All succeeded
                onNotify?.('success', 'Success', `${createdCount} field(s) created successfully`);
                setFieldSubTab('list');
                setAddedFields([]);
                setBulkFieldForm({
                    field_name: '',
                    field_type: 'EARNING',
                    value_type: 'PERCENTAGE',
                    value: '',
                    display_order: '',
                    is_visible: true
                });
                setEditingFieldIndex(null);
                loadFields();
            } else if (createdCount > 0) {
                // Partial success - show detailed message
                const failedSummary = failedFields.length > 0 
                    ? failedFields.map(f => `${f.field_name}: ${f.reason}`).join('; ')
                    : `${failedCount} field(s) failed`;
                
                onNotify?.('warning', 
                    'Partial Success', 
                    `✅ ${createdCount} created, ❌ ${failedCount} failed. ${failedSummary}`
                );
                
                // Remove successfully created fields from the list
                const createdFieldNames = (data.created || []).map(f => f.field_name);
                setAddedFields(addedFields.filter(f => !createdFieldNames.includes(f.field_name)));
                
                // Reload fields to show newly created ones
                loadFields();
            } else {
                // All failed
                const failedSummary = failedFields.length > 0 
                    ? failedFields.map(f => `${f.field_name}: ${f.reason}`).join('; ')
                    : 'All fields failed to create';
                
                onNotify?.('error', 'Creation Failed', failedSummary);
            }
        } catch (error) {
            const errorData = error.response?.data || {};
            const errorMessage = errorData.detail || 
                                errorData.message || 
                                'Failed to create fields';
            
            // If backend returns structured error with failed fields
            if (errorData.failed && errorData.failed.length > 0) {
                const failedSummary = errorData.failed.map(f => 
                    `${f.field_name}: ${f.reason}`
                ).join('; ');
                onNotify?.('error', 'Creation Failed', failedSummary);
            } else {
                onNotify?.('error', 'Error', errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
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
    const infoFields = fields.filter(f => f.field_type === 'INFO');

    const fieldColumns = [
        { key: 'field_name', label: 'Field Name' },
        {
            key: 'field_type',
            label: 'Type',
            render: (val) => {
                let badgeClass = 'rejected';
                if (val === 'EARNING') badgeClass = 'approved';
                else if (val === 'INFO') badgeClass = 'pending';
                return (
                    <span className={`status-badge ${badgeClass}`}>
                        {val}
                    </span>
                );
            }
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
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Salary Configurations</h3>
                            {configs.length === 0 && filterLocation && (
                                <button
                                    onClick={handleCreateDefaultConfig}
                                    disabled={creatingDefault || !filterLocation}
                                    className="primary-btn"
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {creatingDefault ? (
                                        <>
                                            <span>⏳</span>
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>✨</span>
                                            <span>Create Default Config</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        {configs.length === 0 && filterLocation && (
                            <div style={{
                                padding: '20px',
                                margin: '16px',
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <p style={{ margin: '0 0 12px 0', color: '#0c4a6e', fontSize: '0.95rem' }}>
                                    No salary configuration found for this location.
                                </p>
                                <p style={{ margin: '0', color: '#075985', fontSize: '0.875rem' }}>
                                    Click "Create Default Config" to generate a template with basic earning, deduction, and information fields.
                                </p>
                            </div>
                        )}
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
                        <button
                            className={fieldSubTab === 'bulk-add' ? 'active' : ''}
                            onClick={() => {
                                setBulkFieldForm({
                                    field_name: '',
                                    field_type: 'EARNING',
                                    value_type: 'PERCENTAGE',
                                    value: '',
                                    display_order: '',
                                    is_visible: true
                                });
                                setAddedFields([]);
                                setEditingFieldIndex(null);
                                setFieldSubTab('bulk-add');
                            }}
                        >
                            📦 Bulk Add Fields
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
                                    Information ({infoFields.length})
                                </h4>
                                {infoFields.length > 0 ? (
                                    <DataTable
                                        columns={fieldColumns}
                                        data={infoFields}
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
                                        No information fields configured
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {fieldSubTab === 'add-field' && (
                        <div className="management-card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>{fieldForm.id ? 'Edit' : 'Add'} Salary Field</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowHelpModal(true)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1.25rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        color: '#0ea5e9',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                    title="Click for help with field configuration"
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#f0f9ff';
                                        e.target.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    <span>ℹ️</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Help</span>
                                </button>
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
                                            onChange={(e) => setFieldForm({ ...fieldForm, value_type: e.target.value, value: '' })}
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
                                            placeholder={
                                                fieldForm.value_type === 'PERCENTAGE' 
                                                    ? 'e.g., 40 (means 40% of gross salary)'
                                                    : fieldForm.value_type === 'FIXED'
                                                    ? 'e.g., 5000 (fixed amount)'
                                                    : 'e.g., absent_days * deduction_per_day'
                                            }
                                        />
                                    </label>
                                </div>

                                <div className="management-form-two-column">
                                    <label>
                                        <span>Display Order</span>
                                        <input
                                            type="number"
                                            value={fieldForm.display_order || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // Allow empty value for better UX
                                                if (val === '') {
                                                    setFieldForm({ ...fieldForm, display_order: '' });
                                                } else {
                                                    const numVal = parseInt(val, 10);
                                                    if (!isNaN(numVal) && numVal >= 1) {
                                                        setFieldForm({ ...fieldForm, display_order: numVal });
                                                    }
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // Set default to 1 if empty on blur
                                                if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                                                    setFieldForm({ ...fieldForm, display_order: 1 });
                                                }
                                            }}
                                            className="form-control"
                                            min={1}
                                            placeholder="Enter order number"
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

            {fieldSubTab === 'bulk-add' && (
                <div className="management-card" style={{ width: '100%', maxWidth: '100%' }}>
                    <div className="card-header" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                    }}>
                        <h3 style={{ margin: 0 }}>Bulk Add Fields</h3>
                        <button
                            type="button"
                            onClick={() => setShowHelpModal(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                color: '#0ea5e9',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            title="Click for help with field configuration"
                        >
                            <span>ℹ️</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Help</span>
                        </button>
                    </div>
                    
                    <div style={{ padding: '1.5rem' }}>
                        {/* Single Form Input */}
                        <div style={{
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            backgroundColor: '#f8fafc',
                            marginBottom: '1.5rem'
                        }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1e293b', fontWeight: '600' }}>
                                {editingFieldIndex !== null ? '✏️ Edit Field' : '➕ Add New Field'}
                            </h4>
                            <div className="management-form-two-column">
                                <label>
                                    <span>Field Name <span className="required-indicator">*</span></span>
                                    <input
                                        type="text"
                                        value={bulkFieldForm.field_name}
                                        onChange={(e) => setBulkFieldForm({ ...bulkFieldForm, field_name: e.target.value })}
                                        className="form-control"
                                        placeholder="e.g., Basic Salary"
                                    />
                                </label>
                                <label>
                                    <span>Type</span>
                                    <select
                                        value={bulkFieldForm.field_type}
                                        onChange={(e) => setBulkFieldForm({ ...bulkFieldForm, field_type: e.target.value })}
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
                                        value={bulkFieldForm.value_type}
                                        onChange={(e) => setBulkFieldForm({ ...bulkFieldForm, value_type: e.target.value, value: '' })}
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
                                        value={bulkFieldForm.value}
                                        onChange={(e) => setBulkFieldForm({ ...bulkFieldForm, value: e.target.value })}
                                        className="form-control"
                                        placeholder={
                                            bulkFieldForm.value_type === 'PERCENTAGE' 
                                                ? 'e.g., 40'
                                                : bulkFieldForm.value_type === 'FIXED'
                                                ? 'e.g., 5000'
                                                : 'e.g., absent_days * deduction_per_day'
                                        }
                                    />
                                </label>
                            </div>

                            <div className="management-form-two-column">
                                <label>
                                    <span>Display Order</span>
                                    <input
                                        type="number"
                                        value={bulkFieldForm.display_order || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setBulkFieldForm({ ...bulkFieldForm, display_order: '' });
                                            } else {
                                                const numVal = parseInt(val, 10);
                                                if (!isNaN(numVal) && numVal >= 1) {
                                                    setBulkFieldForm({ ...bulkFieldForm, display_order: numVal });
                                                }
                                            }
                                        }}
                                        className="form-control"
                                        min={1}
                                        placeholder="Auto"
                                    />
                                </label>
                                <label>
                                    <span>Visibility</span>
                                    <div style={{ paddingTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={bulkFieldForm.is_visible}
                                                onChange={(e) => setBulkFieldForm({ ...bulkFieldForm, is_visible: e.target.checked })}
                                            />
                                            <span>Show on payslip</span>
                                        </label>
                                    </div>
                                </label>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={addFieldToTable}
                                    className="primary-btn"
                                    style={{ flex: 1 }}
                                >
                                    {editingFieldIndex !== null ? '💾 Update Field' : '➕ Add to List'}
                                </button>
                                {editingFieldIndex !== null && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBulkFieldForm({
                                                field_name: '',
                                                field_type: 'EARNING',
                                                value_type: 'PERCENTAGE',
                                                value: '',
                                                display_order: '',
                                                is_visible: true
                                            });
                                            setEditingFieldIndex(null);
                                        }}
                                        className="primary-btn secondary"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Added Fields Table */}
                        {addedFields.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1e293b', fontWeight: '600' }}>
                                    📋 Added Fields ({addedFields.length})
                                </h4>
                                <div style={{ 
                                    overflowX: 'auto',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    backgroundColor: 'white'
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>#</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Field Name</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Type</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Value Type</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Value</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Order</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Visible</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {addedFields.map((field, index) => (
                                                <tr key={field.tempId || index} style={{ 
                                                    borderBottom: '1px solid #e2e8f0',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                                >
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>{index + 1}</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1e293b', fontWeight: '500' }}>{field.field_name}</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500',
                                                            backgroundColor: field.field_type === 'EARNING' ? '#dcfce7' : field.field_type === 'DEDUCTION' ? '#fee2e2' : '#dbeafe',
                                                            color: field.field_type === 'EARNING' ? '#166534' : field.field_type === 'DEDUCTION' ? '#991b1b' : '#1e40af'
                                                        }}>
                                                            {field.field_type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>{field.value_type}</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b', fontFamily: 'monospace' }}>{field.value}</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>{field.display_order}</td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                                                        {field.is_visible ? '✅' : '❌'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => editFieldFromTable(index)}
                                                                style={{
                                                                    background: '#dbeafe',
                                                                    color: '#1e40af',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    padding: '0.375rem 0.75rem',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: '500'
                                                                }}
                                                                title="Edit field"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFieldFromTable(index)}
                                                                style={{
                                                                    background: '#fee2e2',
                                                                    color: '#dc2626',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    padding: '0.375rem 0.75rem',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: '500'
                                                                }}
                                                                title="Remove field"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Submit Section */}
                        <form onSubmit={handleBulkFieldSubmit}>
                            <div className="management-actions" style={{
                                paddingTop: '1rem',
                                borderTop: '1px solid #e2e8f0',
                                marginTop: '1rem',
                                display: 'flex',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ 
                                    fontSize: '0.875rem', 
                                    color: '#64748b',
                                    fontWeight: '500'
                                }}>
                                    {addedFields.length > 0 ? `${addedFields.length} field(s) ready to create` : 'No fields added yet'}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="primary-btn secondary"
                                        onClick={() => {
                                            setFieldSubTab('list');
                                            setAddedFields([]);
                                            setBulkFieldForm({
                                                field_name: '',
                                                field_type: 'EARNING',
                                                value_type: 'PERCENTAGE',
                                                value: '',
                                                display_order: '',
                                                is_visible: true
                                            });
                                            setEditingFieldIndex(null);
                                        }}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="primary-btn"
                                        disabled={submitting || addedFields.length === 0}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {submitting ? (
                                            <>⏳ Creating...</>
                                        ) : (
                                            <>✨ Create {addedFields.length} Field(s)</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            <FieldConfigHelpModal 
                isOpen={showHelpModal} 
                onClose={() => setShowHelpModal(false)} 
            />

        </div>
    );
};

export default FieldConfigs;
