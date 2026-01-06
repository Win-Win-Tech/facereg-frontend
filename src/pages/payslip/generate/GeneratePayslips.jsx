import React, { useState, useCallback, useRef } from 'react';
import { getEmployees } from '../../../api/employeeApi';
import { getPayslipConfigs } from '../../../api/payslipApi';
import httpClient from '../../../api/httpClient';
import DataTable from '../../../components/DataTable';
import useTabActive from '../../../hooks/useTabActive';
import "../../../styles/ManagementPages.css";

const GeneratePayslips = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const [employees, setEmployees] = useState([]);
    const [configs, setConfigs] = useState([]);
    const [locationConfigs, setLocationConfigs] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [employeeConfigs, setEmployeeConfigs] = useState({});
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Track if data has been loaded for this tab
    const hasLoadedRef = useRef(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [empRes, configRes] = await Promise.all([
                getEmployees({ location_id: filterLocation }),
                getPayslipConfigs()
            ]);

            const empList = Array.isArray(empRes.data) ? empRes.data : [];
            const configList = Array.isArray(configRes.data) ? configRes.data : [];

            setEmployees(empList);
            setConfigs(configList);

            // Filter configs by location - only show configs for the current location
            const filteredConfigs = configList.filter(c => {
                if (!filterLocation) return true; // If no location filter, show all
                return c.location_id === filterLocation;
            });
            
            setLocationConfigs(filteredConfigs);

            // Initialize employee configs
            const initialConfigs = {};
            
            if (filteredConfigs.length > 0) {
                empList.forEach(emp => {
                    // Use employee's assigned config if available and valid, otherwise first location config
                    const empConfigId = emp.payslip_field_config_id;
                    const validConfig = empConfigId && filteredConfigs.find(c => c.id === empConfigId) 
                        ? empConfigId 
                        : filteredConfigs[0].id;
                    initialConfigs[emp.id] = validConfig;
                });
            }
            setEmployeeConfigs(initialConfigs);

        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [filterLocation, onNotify]);

    // Load data when tab becomes active
    useTabActive('generate', () => {
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadData();
        }
    });

    const toggleEmployee = (empId) => {
        setSelectedEmployees(prev =>
            prev.includes(empId)
                ? prev.filter(id => id !== empId)
                : [...prev, empId]
        );
    };

    const handleSelectAll = () => {
        const filtered = filteredEmployees.map(e => e.id);
        if (selectedEmployees.length === filtered.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(filtered);
        }
    };

    const handleConfigChange = (empId, configId) => {
        setEmployeeConfigs(prev => ({
            ...prev,
            [empId]: configId
        }));
    };

    // Helper function to validate UUID format
    const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return str && typeof str === 'string' && uuidRegex.test(str);
    };

    const handleGenerate = async () => {
        if (selectedEmployees.length === 0) {
            onNotify?.('error', 'Error', 'Please select at least one employee');
            return;
        }

        if (!selectedMonth) {
            onNotify?.('error', 'Error', 'Please select a month');
            return;
        }

        // Validate all selected employees have valid configs
        const invalidEmployees = selectedEmployees.filter(empId => {
            const configId = employeeConfigs[empId];
            return !configId || !isValidUUID(configId);
        });

        if (invalidEmployees.length > 0) {
            onNotify?.('error', 'Error', 'Please select a valid salary configuration for all selected employees.');
            return;
        }

        setGenerating(true);
        try {
            // Group employees by config
            const configGroups = {};
            selectedEmployees.forEach(empId => {
                const configId = employeeConfigs[empId];
                if (!configGroups[configId]) {
                    configGroups[configId] = [];
                }
                configGroups[configId].push(empId);
            });

            let totalGenerated = 0;
            let totalErrors = 0;

            // Process each group
            for (const [configId, empIds] of Object.entries(configGroups)) {
                // Validate configId is a valid UUID format
                if (!configId || !isValidUUID(configId)) {
                    onNotify?.('error', 'Error', 'Invalid salary configuration selected. Please select a valid config for all employees.');
                    totalErrors += empIds.length;
                    continue;
                }

                const payload = {
                    employee_ids: empIds,
                    month: selectedMonth,
                    field_config_id: configId
                };

                try {
                    const response = await httpClient.post('/payslips/generate-bulk/', payload);
                    const data = response.data;

                    if (data.generated_count) totalGenerated += data.generated_count;
                    if (data.errors_count) totalErrors += data.errors_count;
                } catch (err) {
                    // Log individual errors but continue with other groups
                    const errorMsg = err.response?.data?.detail || err.message || 'Failed to generate';
                    console.error(`Error generating for config ${configId}:`, errorMsg);
                    totalErrors += empIds.length;
                }
            }

            if (totalGenerated > 0) {
                onNotify?.('success', 'Success', `Generated ${totalGenerated} payslip(s)`);
                setSelectedEmployees([]);
            }

            if (totalErrors > 0) {
                onNotify?.('warning', 'Warning', `${totalErrors} payslip(s) failed to generate`);
            }
        } catch (error) {
            const msg = error.response?.data?.detail || 'Failed to generate payslips';
            onNotify?.('error', 'Error', msg);
        } finally {
            setGenerating(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const columns = [
        {
            key: 'select',
            label: '',
            render: (_, row) => (
                <input
                    type="checkbox"
                    checked={selectedEmployees.includes(row.id)}
                    onChange={() => toggleEmployee(row.id)}
                />
            )
        },
        { key: 'name', label: 'Employee Name' },
        { key: 'employee_code', label: 'Code' },
        { key: 'department', label: 'Department' },
        {
            key: 'payslip_field_config',
            label: 'Salary Config',
            render: (_, row) => {
                const currentConfig = employeeConfigs[row.id] || '';
                
                if (locationConfigs.length === 0) {
                    return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No config</span>;
                }
                
                return (
                    <select
                        value={currentConfig}
                        onChange={(e) => {
                            const newConfigId = e.target.value;
                            if (newConfigId) {
                                handleConfigChange(row.id, newConfigId);
                            }
                        }}
                        className="table-input"
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0', minWidth: '150px' }}
                    >
                        {locationConfigs.map(config => (
                            <option key={config.id} value={config.id}>
                                {config.config_name}
                            </option>
                        ))}
                    </select>
                );
            }
        }
    ];

    return (
        <div className="tab-content-container">
            <div className="management-card">
                <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3>Select Employees</h3>
                        <div className="management-actions">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="form-control"
                                style={{ width: 'auto' }}
                            />
                            <button
                                className="primary-btn"
                                onClick={handleGenerate}
                                disabled={generating || selectedEmployees.length === 0 || locationConfigs.length === 0}
                                title={locationConfigs.length === 0 ? 'No salary configuration available for this location' : ''}
                            >
                                {generating ? 'Generating...' : `⚡ Generate Payslips`}
                            </button>
                        </div>
                    </div>

                    <div className="management-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-control"
                                style={{ width: '250px' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                {selectedEmployees.length} of {filteredEmployees.length} selected
                            </span>
                        </div>
                        <button
                            className="primary-btn secondary"
                            onClick={handleSelectAll}
                        >
                            {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={filteredEmployees}
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
        </div>
    );
};

export default GeneratePayslips;
