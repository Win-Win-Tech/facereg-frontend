import React, { useState, useEffect, useCallback } from 'react';
import {
    getLocationWeekoffs,
    createOrUpdateLocationWeekoff,
    getEmployeeWeekoffs,
    createOrUpdateEmployeeWeekoff,
    deleteEmployeeWeekoff
} from '../../api/leaveApi';
import { getLocations } from '../../api/locationApi';
import { getEmployees } from '../../api/employeeApi';
import useAuth from '../../hooks/useAuth';
import '../../styles/ManagementPages.css';

// Sub-components
import LocationWeekoffs from './LocationWeekoffs';
import EmployeeWeekoffs from './EmployeeWeekoffs';
import SetWeekoffsTable from './SetWeekoffsTable';
import SetLocationWeekoffForm from './SetLocationWeekoffForm';

const Weekoffs = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const { auth } = useAuth();
    const userLocationId = auth?.location_id || auth?.location;

    const [subTab, setSubTab] = useState('location-list');
    const [locationWeekoffs, setLocationWeekoffs] = useState([]);
    const [employeeWeekoffs, setEmployeeWeekoffs] = useState([]);
    const [locations, setLocations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [locationForm, setLocationForm] = useState({
        id: null,
        location_id: isSuperAdmin ? '' : userLocationId || '',
        weekoff_patterns: []
    });

    const loadLocations = useCallback(async () => {
        if (isSuperAdmin) {
            try {
                const locRes = await getLocations();
                const locs = Array.isArray(locRes.data) ? locRes.data : [];
                setLocations(locs);
            } catch (error) {
                onNotify?.('error', 'Error', 'Failed to load locations');
            }
        }
    }, [isSuperAdmin, onNotify]);

    useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    const loadData = useCallback(async () => {
        if (!filterLocation && isSuperAdmin) return;
        setLoading(true);
        try {
            const params = { location_id: filterLocation };

            const [locWeekRes, empWeekRes, empRes] = await Promise.all([
                getLocationWeekoffs(params),
                getEmployeeWeekoffs(params),
                getEmployees(params)
            ]);

            setLocationWeekoffs(Array.isArray(locWeekRes.data) ? locWeekRes.data : []);
            setEmployeeWeekoffs(Array.isArray(empWeekRes.data) ? empWeekRes.data : []);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load weekoffs');
        } finally {
            setLoading(false);
        }
    }, [filterLocation, isSuperAdmin, onNotify]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLocationSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...locationForm };
            if (isSuperAdmin && !payload.location_id) {
                payload.location_id = filterLocation;
            }
            await createOrUpdateLocationWeekoff(payload);
            onNotify?.('success', 'Success', 'Location weekoff updated');
            setSubTab('location-list');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to save location weekoff');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEmployeeBulkSubmit = async (selectedEmployeeIds, patterns) => {
        setSubmitting(true);
        try {
            const promises = selectedEmployeeIds.map(empId => {
                const payload = {
                    employee_id: empId,
                    weekoff_patterns: patterns,
                    location_id: filterLocation || userLocationId
                };
                return createOrUpdateEmployeeWeekoff(payload);
            });

            await Promise.all(promises);
            onNotify?.('success', 'Success', `Weekoffs updated for ${selectedEmployeeIds.length} employees`);
            setSubTab('employee-list');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to update some employee weekoffs');
        } finally {
            setSubmitting(false);
        }
    };

    const openSetLocationForm = (item = null) => {
        if (item) {
            setLocationForm({
                id: item.id,
                location_id: item.location_id || item.location,
                weekoff_patterns: item.weekoff_patterns || []
            });
        } else {
            setLocationForm({
                id: null,
                location_id: isSuperAdmin ? '' : userLocationId || '',
                weekoff_patterns: []
            });
        }
        setSubTab('location-set');
    };

    const handleDeleteEmployeeWeekoff = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employee weekoff?')) return;
        try {
            await deleteEmployeeWeekoff(id);
            onNotify?.('success', 'Success', 'Employee weekoff deleted');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to delete weekoff');
        }
    };

    const locationColumns = [
        { key: 'location_name', label: 'Location', render: (_, row) => row.location_name || row.location },
        { key: 'weekoff_patterns', label: 'Patterns', render: (val) => val.join(', ') }
    ];

    const employeeColumns = [
        { key: 'employee_name', label: 'Employee', render: (_, row) => row.employee_name || row.employee },
        { key: 'location_name', label: 'Location', render: (_, row) => row.location_name || row.location },
        { key: 'weekoff_patterns', label: 'Patterns', render: (val) => val.join(', ') }
    ];

    return (
        <div className="tab-content-container">
            <div className="sub-tabs">
                <button
                    className={subTab === 'location-list' ? 'active' : ''}
                    onClick={() => setSubTab('location-list')}
                >
                    📍 Location List
                </button>
                <button
                    className={subTab === 'location-set' ? 'active' : ''}
                    onClick={() => openSetLocationForm()}
                >
                    ⚙️ Set Location
                </button>
                <button
                    className={subTab === 'employee-list' ? 'active' : ''}
                    onClick={() => setSubTab('employee-list')}
                >
                    👤 Employee List
                </button>
                <button
                    className={subTab === 'employee-set' ? 'active' : ''}
                    onClick={() => setSubTab('employee-set')}
                >
                    ➕ Set Employee
                </button>
            </div>

            {subTab === 'location-list' && (
                <LocationWeekoffs
                    locationWeekoffs={locationWeekoffs}
                    loading={loading}
                    columns={locationColumns}
                    openEditModal={openSetLocationForm}
                />
            )}

            {subTab === 'location-set' && (
                <SetLocationWeekoffForm
                    form={locationForm}
                    setForm={setLocationForm}
                    onSubmit={handleLocationSubmit}
                    submitting={submitting}
                    isSuperAdmin={isSuperAdmin}
                    locations={locations}
                />
            )}

            {subTab === 'employee-list' && (
                <EmployeeWeekoffs
                    employeeWeekoffs={employeeWeekoffs}
                    loading={loading}
                    columns={employeeColumns}
                    openEditModal={(item) => {
                        // For single edit, we can still use the table but pre-select?
                        // Or just navigate to set tab.
                        setSubTab('employee-set');
                    }}
                    handleDeleteEmployeeWeekoff={handleDeleteEmployeeWeekoff}
                />
            )}

            {subTab === 'employee-set' && (
                <SetWeekoffsTable
                    employees={employees}
                    onSubmit={handleEmployeeBulkSubmit}
                    submitting={submitting}
                />
            )}
        </div>
    );
};

export default Weekoffs;
