import React, { useState, useEffect } from 'react';
import Modal from './Modal';

/**
 * Generic FormModal component for create/edit operations
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {function} props.onClose - Close modal handler
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string} props.title - Modal title
 * @param {Object} props.formData - Current form data
 * @param {function} props.onFormDataChange - Handle form data changes
 * @param {Object} props.errors - Form errors object
 * @param {Array} props.fields - Array of field configurations
 * @param {boolean} props.isSubmitting - Loading state during submission
 * @param {function} props.onSubmit - Form submission handler
 */
const FormModal = ({
  isOpen,
  onClose,
  mode = 'create',
  title,
  formData,
  onFormDataChange,
  errors,
  fields,
  isSubmitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const handleFormChange = (fieldName, value) => {
    onFormDataChange({ ...formData, [fieldName]: value });
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
          <button type="submit" form="form-modal-form" disabled={isSubmitting}>
            {isSubmitting ? (mode === 'create' ? 'Creating…' : 'Saving…') : (mode === 'create' ? 'Create' : 'Save')}
          </button>
        </>
      }
    >
      <form id="form-modal-form" className="management-form" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.name}>
            {field.type === 'select' ? (
              <label>
                {field.label}
                <select
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  disabled={field.disabled}
                >
                  <option value="">{field.placeholder || 'Select...'}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors[field.name] && <div className="form-error">{errors[field.name]}</div>}
              </label>
            ) : field.type === 'textarea' ? (
              <label>
                {field.label}
                <textarea
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows || 3}
                />
                {errors[field.name] && <div className="form-error">{errors[field.name]}</div>}
              </label>
            ) : field.type === 'checkbox' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name={field.name}
                  checked={formData[field.name] || false}
                  onChange={(e) => handleFormChange(field.name, e.target.checked)}
                />
                {field.label}
              </label>
            ) : field.type === 'time' ? (
              <label>
                {field.label}
                <input
                  type="time"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                />
                {errors[field.name] && <div className="form-error">{errors[field.name]}</div>}
              </label>
            ) : field.type === 'number' ? (
              <label>
                {field.label}
                <input
                  type="number"
                  name={field.name}
                  step={field.step}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                />
                {errors[field.name] && <div className="form-error">{errors[field.name]}</div>}
              </label>
            ) : (
              <label>
                {field.label}
                <input
                  type={field.type || 'text'}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                />
                {errors[field.name] && <div className="form-error">{errors[field.name]}</div>}
              </label>
            )}
          </div>
        ))}
      </form>
    </Modal>
  );
};

export default FormModal;
