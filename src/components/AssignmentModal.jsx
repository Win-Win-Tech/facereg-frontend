import React from 'react';
import Modal from './Modal';

/**
 * AssignmentModal - Reusable modal for shift and site assignment with date range
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {function} props.onClose - Close modal handler
 * @param {string} props.title - Modal title
 * @param {Object} props.formData - { shift_id, site_ids, assignment_from_date, assignment_to_date }
 * @param {function} props.onFormChange - Handle form changes
 * @param {Array} props.availableShifts - Array of shift objects
 * @param {Array} props.availableSites - Array of site objects
 * @param {boolean} props.isSubmitting - Loading state
 * @param {function} props.onSubmit - Form submission handler
 */
const AssignmentModal = ({
  isOpen,
  onClose,
  title = 'Assign Shift & Sites',
  formData,
  onFormChange,
  availableShifts = [],
  availableSites = [],
  isSubmitting = false,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    onFormChange({ ...formData, [field]: value });
  };

  const handleSiteToggle = (siteId) => {
    const newSiteIds = formData.site_ids.includes(siteId) ? [] : [siteId];
    
    onFormChange({
      ...formData,
      site_ids: newSiteIds,
      shift_id: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="assignment-modal-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Assign'}
          </button>
        </>
      }
    >
      <form id="assignment-modal-form" className="assignment-form" onSubmit={handleSubmit}>

         {/* Site Selection */}
        <div className="form-section">
          <h3 className="section-title">Sites</h3>
          <div className="form-group">
            <label className="form-label">Select Sites</label>
            <div className="checkbox-group">
              {availableSites.length > 0 ? (
                availableSites.map((site) => (
                  <label key={site.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.site_ids.includes(site.id)}
                      onChange={() => handleSiteToggle(site.id)}
                    />
                    <span className="checkbox-text">{site.site_name || site.name}</span>
                  </label>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                  No sites available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Shift</h3>
          <div className="form-group">
            <label className="form-label">Select Shift</label>
            <select
              className="form-control"
              value={formData.shift_id || ''}
              onChange={(e) => handleInputChange('shift_id', e.target.value)}
            >
              <option value="">No Shift</option>
              {availableShifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.shift_name || shift.name} ({shift.start_time} - {shift.end_time})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="form-section">
          <h3 className="section-title">Date Range</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-control"
                disabled={!formData.shift_id}
                value={formData.assignment_from_date || ''}
                onChange={(e) => handleInputChange('assignment_from_date', e.target.value)}
              />
              <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                {formData.shift_id ? 'Effective from this date' : 'Select a shift first'}
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-control"
                disabled={!formData.shift_id}
                value={formData.assignment_to_date || ''}
                onChange={(e) => handleInputChange('assignment_to_date', e.target.value)}
              />
              <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                {formData.shift_id ? 'Effective until this date' : 'Select a shift first'}
              </small>
            </div>
          </div>
        </div>

       
      </form>
    </Modal>
  );
};

export default AssignmentModal;
