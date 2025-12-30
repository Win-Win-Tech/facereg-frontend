import React from 'react';

const AddLeaveTypeForm = ({ form, setForm, onSubmit, submitting, isSuperAdmin, locations }) => {
    return (
        <div className="management-card">
            <div className="card-header">
                <h3>{form.id ? '📝 Edit Leave Type' : '➕ Add Leave Type'}</h3>
            </div>
            <form className="employee-form-container" onSubmit={onSubmit}>
                {isSuperAdmin && (
                    <div className="form-group">
                        <label>Location *</label>
                        <select
                            value={form.location_id}
                            onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                            required
                        >
                            <option value="">Select Location</option>
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>
                )}
                <div className="form-grid">
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            placeholder="e.g. Sick Leave"
                        />
                    </div>
                    <div className="form-group">
                        <label>Code *</label>
                        <input
                            type="text"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            required
                            placeholder="e.g. SL"
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="pattern-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={form.is_paid}
                            onChange={(e) => setForm({ ...form, is_paid: e.target.checked })}
                        />
                        Is Paid Leave?
                    </label>
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Optional description..."
                        rows="3"
                    />
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="submit" className="primary-btn" disabled={submitting}>
                        {submitting ? 'Saving...' : (form.id ? 'Update Leave Type' : 'Create Leave Type')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddLeaveTypeForm;
