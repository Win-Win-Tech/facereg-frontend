import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../components/Modal';
import './ManagementPages.css';
import Webcam from 'react-webcam';
import { getEmployees, registerEmployee, updateEmployee, deleteEmployee } from '../api/employeeApi';
import { getLocations } from '../api/locationApi';

const dataURLtoFile = (dataUrl, filename) => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const initialForm = {
  id: null,
  name: '',
  location_id: '',
  faceImage: null,
  profilePhoto: null,
};

const EmployeesPage = ({ onNotify, isSuperAdmin, auth }) => {
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [filterLocation, setFilterLocation] = useState('');
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facePreview, setFacePreview] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [originalFacePreview, setOriginalFacePreview] = useState(null);
  const [originalProfilePreview, setOriginalProfilePreview] = useState(null);
  const faceSectionRef = useRef(null);

  const activeLocations = useMemo(
    () => locations.filter((loc) => !loc.is_deleted),
    [locations]
  );

  const adminLocationName = useMemo(() => {
    if (isSuperAdmin) {
      return null;
    }
    const userLocId = auth?.location_id || auth?.location;
    if (!userLocId) {
      return 'Location not set';
    }
    const match = activeLocations.find((loc) => String(loc.id) === String(userLocId));
    if (match?.name) {
      return match.name;
    }
    return locations.length === 0 ? 'Loading location…' : 'Location not set';
  }, [isSuperAdmin, auth, activeLocations, locations.length]);

  const locationName = useCallback(
    (id) => activeLocations.find((loc) => String(loc.id) === String(id))?.name || '—',
    [activeLocations]
  );

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const userLocationId = auth?.location_id || auth?.location || '';

  const loadLocations = useCallback(async () => {
    try {
      const res = await getLocations({ include_deleted: false });
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (error) {
      onNotify?.('error', 'Locations', 'Failed to load locations', undefined, { durationMs: 4000 });
    }
  }, [onNotify]);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      if (Array.isArray(res.data)) {
        setEmployees(res.data);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      onNotify?.('error', 'Employees', 'Failed to load employees', undefined, { durationMs: 4000 });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadLocations();
    loadEmployees();
  }, [loadLocations, loadEmployees]);

  useEffect(() => {
    if (!showModal) {
      setShowCamera(false);
      setFacePreview(null);
      setProfilePreview(null);
      setOriginalFacePreview(null);
      setOriginalProfilePreview(null);
    }
  }, [showModal]);

  useEffect(() => {
    if (showCamera && faceSectionRef.current) {
      faceSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showCamera]);

  const handleLocationChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, location_id: value }));
    clearFieldError('location_id');
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, profilePhoto: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
      clearFieldError('profile_photo');
    } else {
      setProfilePreview(originalProfilePreview);
    }
  };

  const handleStartCamera = () => {
    setShowCamera(true);
    clearFieldError('face_image');
  };

  const handleCaptureFace = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      return;
    }
    const file = dataURLtoFile(screenshot, `face-${Date.now()}.jpg`);
    setForm((prev) => ({ ...prev, faceImage: file }));
    setFacePreview(screenshot);
    setShowCamera(false);
    clearFieldError('face_image');
  };

  const handleUseOriginalFace = () => {
    if (originalFacePreview) {
      setForm((prev) => ({ ...prev, faceImage: null }));
      setFacePreview(originalFacePreview);
      setShowCamera(false);
      clearFieldError('face_image');
    }
  };

  const handleResetProfilePhoto = () => {
    setForm((prev) => ({ ...prev, profilePhoto: null }));
    setProfilePreview(originalProfilePreview);
    clearFieldError('profile_photo');
  };

  const handleNameChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, name: value }));
    if (value.trim()) {
      clearFieldError('name');
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!isSuperAdmin || !filterLocation) {
      if (!isSuperAdmin && userLocationId) {
        return employees.filter((emp) => String(emp.location_id) === String(userLocationId));
      }
      return employees;
    }
    return employees.filter((emp) => String(emp.location_id) === String(filterLocation));
  }, [employees, filterLocation, isSuperAdmin, userLocationId]);

  const openCreateModal = () => {
    setForm({
      id: null,
      name: '',
      location_id: isSuperAdmin ? '' : (userLocationId ? String(userLocationId) : ''),
      faceImage: null,
      profilePhoto: null,
    });
    setErrors({});
    setModalMode('create');
    setShowModal(true);
    setShowCamera(false);
    setFacePreview(null);
    setProfilePreview(null);
    setOriginalFacePreview(null);
    setOriginalProfilePreview(null);
  };

  const openEditModal = (employee) => {
    setForm({
      id: employee.id,
      name: employee.name || '',
      location_id: employee.location_id ? String(employee.location_id) : '',
      faceImage: null,
      profilePhoto: null,
    });
    setErrors({});
    setModalMode('edit');
    setShowModal(true);
    setShowCamera(false);
    const existingPhoto = employee.photo_data || null;
    setFacePreview(null);
    setOriginalFacePreview(existingPhoto);
    setProfilePreview(existingPhoto);
    setOriginalProfilePreview(existingPhoto);
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = 'Name is required';
    }
    if (!form.location_id) {
      next.location_id = 'Location is required';
    }
    if (modalMode === 'create' && !form.faceImage) {
      next.face_image = 'Face capture image is required';
    }
    if (modalMode === 'create' && !form.profilePhoto) {
      next.profile_photo = 'Profile photo is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const locationId = isSuperAdmin
        ? form.location_id
        : form.location_id || (userLocationId ? String(userLocationId) : '');

      if (modalMode === 'create') {
        const formData = new FormData();
        formData.append('name', form.name.trim());
        formData.append('location_id', locationId);
        if (form.faceImage) {
          formData.append('face_image', form.faceImage);
        }
        if (form.profilePhoto) {
          formData.append('profile_photo', form.profilePhoto);
        }
        await registerEmployee(formData);
        onNotify?.('success', 'Employee Registered', 'Employee has been registered successfully.');
      } else {
        const formData = new FormData();
        if (form.name.trim()) {
          formData.append('name', form.name.trim());
        }
        if (locationId) {
          formData.append('location_id', locationId);
        }
        if (form.faceImage) {
          formData.append('face_image', form.faceImage);
        }
        if (form.profilePhoto) {
          formData.append('profile_photo', form.profilePhoto);
        }
        await updateEmployee(form.id, formData);
        onNotify?.('success', 'Employee Updated', 'Employee details have been updated.');
      }
      setShowModal(false);
      setForm({
        ...initialForm,
        location_id: isSuperAdmin ? '' : (userLocationId ? String(userLocationId) : ''),
      });
      setFacePreview(null);
      setProfilePreview(null);
      loadEmployees();
    } catch (error) {
      const detail = error.response?.data?.detail || error.response?.data?.error;
      onNotify?.('error', 'Save Failed', detail || 'Unable to save employee.', undefined, { durationMs: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Delete employee "${employee.name}"?`)) {
      return;
    }
    try {
      await deleteEmployee(employee.id);
      onNotify?.('success', 'Employee Deleted', 'Employee has been deleted.');
      loadEmployees();
    } catch (error) {
      onNotify?.('error', 'Delete Failed', 'Unable to delete employee.', undefined, { durationMs: 5000 });
    }
  };

  return (
    <div className="management-page">
      <div className="management-header">
        <h2 className="management-title">Employees</h2>
        <div className="management-actions">
          {isSuperAdmin ? (
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="">All locations</option>
              {activeLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="location-chip" title={adminLocationName || 'Location'}>
              <span className="chip-icon">📍</span>
              <span className="chip-text">{adminLocationName || 'Location not set'}</span>
            </div>
          )}
          <button type="button" onClick={openCreateModal}>
            + Register employee
          </button>
        </div>
      </div>

      <div className="management-card">
        <div className="management-card-scroll">
        {loading ? (
          <div className="management-empty">Loading employees…</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="management-empty">No employees found.</div>
        ) : (
          <div className="management-table-wrapper limited mobile-auto">
            <table className="management-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td data-label="ID">{employee.id}</td>
                    <td data-label="Name">{employee.name || '—'}</td>
                    <td data-label="Location">{locationName(employee.location_id)}</td>
                    <td data-label="Actions" className="actions">
                      <button type="button" className="edit" onClick={() => openEditModal(employee)}>
                        Edit
                      </button>
                      <button type="button" className="delete" onClick={() => handleDelete(employee)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {showModal && (
        <Modal
          title={modalMode === 'create' ? 'Register employee' : 'Edit employee'}
          onClose={() => setShowModal(false)}
          actions={
            <>
              <button type="button" className="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" form="employee-form" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="employee-form" className="management-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleNameChange}
                placeholder="Employee name"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </label>

            {isSuperAdmin ? (
              <label>
                Location
                <select
                  name="location_id"
                  value={form.location_id}
                  onChange={handleLocationChange}
                >
                  <option value="">Select location</option>
                  {activeLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                {errors.location_id && <div className="form-error">{errors.location_id}</div>}
              </label>
            ) : (
              <label>
                Location
                <input value={locationName(form.location_id)} readOnly />
                {errors.location_id && <div className="form-error">{errors.location_id}</div>}
              </label>
            )}

            <div className="face-capture-section" ref={faceSectionRef}>
              <span className="face-capture-label">Employee face photo</span>
              <div className="face-capture-preview">
                {showCamera ? (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user' }}
                  />
                ) : facePreview ? (
                  <img src={facePreview} alt="Face preview" />
                ) : (
                  <div className="face-placeholder">No face captured yet</div>
                )}
              </div>
              {modalMode === 'edit' && (
                <span className="face-note">
                  Capture a new face photo if you want to update recognition data.
                </span>
              )}
              <div className="face-capture-actions">
                {showCamera ? (
                  <>
                    <button type="button" onClick={handleCaptureFace}>
                      Capture
                    </button>
                    <button type="button" className="secondary" onClick={() => setShowCamera(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={handleStartCamera}>
                      {facePreview ? 'Retake face photo' : 'Capture face photo'}
                    </button>
                    {modalMode === 'edit' && originalFacePreview && facePreview !== originalFacePreview && (
                      <button type="button" className="secondary" onClick={handleUseOriginalFace}>
                        Use saved face photo
                      </button>
                    )}
                  </>
                )}
              </div>
              {errors.face_image && <div className="form-error">{errors.face_image}</div>}
            </div>

            <label>
              Employee profile photo
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
              />
            </label>
            <div className="profile-preview">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile preview" />
              ) : (
                <div className="face-placeholder">No profile photo selected</div>
              )}
            </div>
            {errors.profile_photo && <div className="form-error">{errors.profile_photo}</div>}

          </form>
        </Modal>
      )}
    </div>
  );
};

export default EmployeesPage;
