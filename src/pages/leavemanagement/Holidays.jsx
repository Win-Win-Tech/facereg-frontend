import React, { useState, useEffect, useCallback } from 'react';
import {
    getHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    uploadHolidaysExcel
} from '../../api/leaveApi';
import { getLocations } from '../../api/locationApi';
import useAuth from '../../hooks/useAuth';
import '../../styles/ManagementPages.css';

// Sub-components
import HolidaysList from './HolidaysList';
import BulkUploadHolidays from './BulkUploadHolidays';
import AddHolidayForm from './AddHolidayForm';

const Holidays = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const { auth } = useAuth();
    const userLocationId = auth?.location_id || auth?.location;

    const [holidays, setHolidays] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Tabs
    const [subTab, setSubTab] = useState('list');

    const [form, setForm] = useState({
        id: null,
        holiday_name: '',
        holiday_date: new Date().toISOString().split('T')[0],
        description: '',
        is_recurring: false,
        location_id: isSuperAdmin ? '' : userLocationId || ''
    });

    // Load locations for superadmin to use in the form
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
            const res = await getHolidays(params);
            setHolidays(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load holidays');
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
                onNotify?.('error', 'Error', 'Please select a location for the holiday.');
                setSubmitting(false);
                return;
            }
            if (!isSuperAdmin && !payload.location_id) {
                payload.location_id = userLocationId;
            }

            if (form.id) {
                await updateHoliday(form.id, payload);
                onNotify?.('success', 'Success', 'Holiday updated');
            } else {
                await createHoliday(payload);
                onNotify?.('success', 'Success', 'Holiday created');
            }
            setSubTab('list');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to save holiday');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('excel_file', file);
        if (filterLocation || userLocationId) {
            formData.append('location_id', filterLocation || userLocationId);
        } else {
            onNotify?.('error', 'Error', 'Please select a location to upload holidays.');
            return;
        }

        setSubmitting(true);
        try {
            await uploadHolidaysExcel(formData);
            onNotify?.('success', 'Success', 'Holidays uploaded successfully');
            setSubTab('list');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to upload holidays');
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateForm = () => {
        setForm({
            id: null,
            holiday_name: '',
            holiday_date: new Date().toISOString().split('T')[0],
            description: '',
            is_recurring: false,
            location_id: isSuperAdmin ? '' : userLocationId || ''
        });
        setSubTab('add');
    };

    const openEditForm = (holiday) => {
        setForm({
            ...holiday,
            holiday_date: holiday.holiday_date.split('T')[0],
            location_id: holiday.location_id || holiday.location
        });
        setSubTab('add');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) return;
        try {
            await deleteHoliday(id);
            onNotify?.('success', 'Success', 'Holiday deleted');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to delete holiday');
        }
    };

    const columns = [
        { key: 'holiday_name', label: 'Name' },
        { key: 'holiday_date', label: 'Date' },
        { key: 'description', label: 'Description' }
    ];

    return (
        <div className="tab-content-container">
            <div className="sub-tabs">
                <button
                    className={subTab === 'list' ? 'active' : ''}
                    onClick={() => setSubTab('list')}
                >
                    🏖️ Holidays List
                </button>
                <button
                    className={subTab === 'add' ? 'active' : ''}
                    onClick={openCreateForm}
                >
                    ➕ {form.id ? 'Edit Holiday' : 'Add Holiday'}
                </button>
                <button
                    className={subTab === 'bulk' ? 'active' : ''}
                    onClick={() => setSubTab('bulk')}
                >
                    📤 Bulk Upload
                </button>
            </div>

            {subTab === 'list' && (
                <HolidaysList
                    holidays={holidays}
                    loading={loading}
                    columns={columns}
                    openCreateModal={openCreateForm}
                    openEditModal={openEditForm}
                    handleDelete={handleDelete}
                />
            )}

            {subTab === 'add' && (
                <AddHolidayForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    isSuperAdmin={isSuperAdmin}
                    locations={locations}
                />
            )}

            {subTab === 'bulk' && (
                <BulkUploadHolidays
                    submitting={submitting}
                    handleBulkUpload={handleBulkUpload}
                />
            )}
        </div>
    );
};

export default Holidays;
