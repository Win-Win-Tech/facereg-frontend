import React from 'react';

const WeekoffPatterns = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
    'ODD_SUNDAY', 'ODD_MONDAY', 'ODD_TUESDAY', 'ODD_WEDNESDAY', 'ODD_THURSDAY', 'ODD_FRIDAY', 'ODD_SATURDAY',
    'EVEN_SUNDAY', 'EVEN_MONDAY', 'EVEN_TUESDAY', 'EVEN_WEDNESDAY', 'EVEN_THURSDAY', 'EVEN_FRIDAY', 'EVEN_SATURDAY'
];

const SetLocationWeekoffForm = ({ form, setForm, onSubmit, submitting, isSuperAdmin, locations }) => {
    const handlePatternToggle = (pattern) => {
        setForm(prev => {
            const patterns = prev.weekoff_patterns.includes(pattern)
                ? prev.weekoff_patterns.filter(p => p !== pattern)
                : [...prev.weekoff_patterns, pattern];
            return { ...prev, weekoff_patterns: patterns };
        });
    };

    return (
        <div className="management-card">
            <div className="card-header">
                <h3>📍 Set Location Weekoff</h3>
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
                <div className="form-group">
                    <label style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'block' }}>Select Weekoff Patterns *</label>
                    <div className="patterns-grid">
                        {WeekoffPatterns.map(pattern => (
                            <label key={pattern} className="pattern-checkbox">
                                <input
                                    type="checkbox"
                                    checked={form.weekoff_patterns.includes(pattern)}
                                    onChange={() => handlePatternToggle(pattern)}
                                />
                                {pattern.replace(/_/g, ' ')}
                            </label>
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="primary-btn" disabled={submitting || form.weekoff_patterns.length === 0}>
                        {submitting ? 'Saving...' : 'Save Location Weekoff'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SetLocationWeekoffForm;
