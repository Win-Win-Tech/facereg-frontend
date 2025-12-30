import React, { useState, useEffect, useCallback } from 'react';
import { getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from '../../api/leaveApi';
import { getLocations } from '../../api/locationApi';
import useAuth from '../../hooks/useAuth';
import '../../styles/ManagementPages.css';

// Sub-components
import LeaveTypesList from './LeaveTypesList';
import AddLeaveTypeForm from './AddLeaveTypeForm';

const LeaveTypes = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const { auth } = useAuth();
    const userLocationId = auth?.location_id || auth?.location;

    const [leaveTypes, setLeaveTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Tabs
    const [subTab, setSubTab] = useState('list');

    const [form, setForm] = useState({
        id: null,
        name: '',
        code: '',
        description: '',
        is_paid: true,
        location_id: isSuperAdmin ? '' : userLocationId || ''
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
            const res = await getLeaveTypes(params);
            setLeaveTypes(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load leave types');
        } finally {
            setLoading(false);
        }
    }, [filterLocation, isSuperAdmin, onNotify]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...form };
            if (isSuperAdmin && !payload.location_id) {
                payload.location_id = filterLocation;
            }
            if (form.id) {
                await updateLeaveType(form.id, payload);
                onNotify?.('success', 'Success', 'Leave type updated');
            } else {
                await createLeaveType(payload);
                onNotify?.('success', 'Success', 'Leave type created');
            }
            setSubTab('list');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to save leave type');
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateForm = () => {
        setForm({
            id: null,
            name: '',
            code: '',
            description: '',
            is_paid: true,
            location_id: isSuperAdmin ? '' : userLocationId || ''
        });
        setSubTab('add');
    };

    const openEditForm = (type) => {
        setForm({
            ...type,
            location_id: type.location_id || type.location
        });
        setSubTab('add');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this leave type?')) return;
        try {
            await deleteLeaveType(id);
            onNotify?.('success', 'Success', 'Leave type deleted');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to delete leave type');
        }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'is_paid', label: 'Paid', render: (val) => val ? 'Yes' : 'No' },
        { key: 'description', label: 'Description' }
    ];

    return (
        <div className="tab-content-container">
            <div className="sub-tabs">
                <button
                    className={subTab === 'list' ? 'active' : ''}
                    onClick={() => setSubTab('list')}
                >
                    ⚙️ Leave Types
                </button>
                <button
                    className={subTab === 'add' ? 'active' : ''}
                    onClick={openCreateForm}
                >
                    ➕ {form.id ? 'Edit Type' : 'Add Type'}
                </button>
            </div>

            {subTab === 'list' && (
                <LeaveTypesList
                    leaveTypes={leaveTypes}
                    loading={loading}
                    columns={columns}
                    openEditModal={openEditForm}
                    handleDelete={handleDelete}
                />
            )}

            {subTab === 'add' && (
                <AddLeaveTypeForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    isSuperAdmin={isSuperAdmin}
                    locations={locations}
                />
            )}
        </div>
    );
};

export default LeaveTypes;
