import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../components/Modal';
import AssignmentModal from '../components/AssignmentModal';
import DataTable from '../components/DataTable';
import '../styles/ManagementPages.css';
import Webcam from 'react-webcam';
import {
  getEmployees,
  getEmployeeById,
  registerEmployee,
  updateEmployee,
  deleteEmployee,
  getShifts,
  getSites,
  getAssignments,
  createAssignment,
  updateAssignment,
  assignUserSites,
  getUserSites,
} from '../api/employeeApi';
import { getLocations } from '../api/locationApi';
import { getPayslipConfigs } from '../api/payslipApi';

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
  // Payslip fields
  gross_salary: '',
  payslip_field_config_id: '',
  // Employee details
  employee_code: '',
  department: '',
  designation: '',
  experience_years: '',
  joining_date: '',
  // Banking details
  bank_account_number: '',
  ifsc_code: '',
  bank_name: '',
  // Identification
  pan_number: '',
  aadhaar_number: '',
  uan_number: '',
  esi_number: '',
  // Contact
  email: '',
  phone: '',
  address: '',
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
  const [modalLoading, setModalLoading] = useState(false);
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facePreview, setFacePreview] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [originalFacePreview, setOriginalFacePreview] = useState(null);
  const [originalProfilePreview, setOriginalProfilePreview] = useState(null);
  const faceSectionRef = useRef(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [sites, setSites] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    shift_id: '',
    site_ids: [],
    assignment_from_date: new Date().toISOString().split('T')[0],
    assignment_to_date: new Date().toISOString().split('T')[0],
  });
  const [existingAssignmentId, setExistingAssignmentId] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [payslipConfigs, setPayslipConfigs] = useState([]);

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

  const loadShiftsAndSites = useCallback(async () => {
    try {
      const [shiftsRes, sitesRes] = await Promise.all([getShifts(), getSites()]);
      setShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
      setSites(Array.isArray(sitesRes.data) ? sitesRes.data : []);
    } catch (error) {
      console.error('Failed to load shifts and sites:', error);
    }
  }, []);

  const loadPayslipConfigsData = useCallback(async () => {
    try {
      const res = await getPayslipConfigs();
      if (Array.isArray(res.data)) {
        setPayslipConfigs(res.data);
      } else {
        setPayslipConfigs([]);
      }
    } catch (error) {
      console.error('Failed to load payslip configs:', error);
      setPayslipConfigs([]);
    }
  }, []);

  useEffect(() => {
    loadLocations();
    loadEmployees();
    loadShiftsAndSites();
    loadPayslipConfigsData();
  }, [loadLocations, loadEmployees, loadShiftsAndSites, loadPayslipConfigsData]);

  useEffect(() => {
    if (!showModal) {
      setShowCamera(false);
      setFacePreview(null);
      setProfilePreview(null);
      setOriginalFacePreview(null);
      setOriginalProfilePreview(null);
      setModalLoading(false);
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

  const filteredSitesForAssignment = useMemo(() => {
    if (!selectedEmployeeForAssign) return [];
    return sites.filter((site) => String(site.location) === String(selectedEmployeeForAssign.location_id));
  }, [sites, selectedEmployeeForAssign]);

  const availableAssignmentShifts = useMemo(() => {
    // If no sites selected, show all shifts
    if (assignmentForm.site_ids.length === 0) {
      return shifts;
    }

    // Show only shifts assigned to the selected sites
    const selectedSiteIds = new Set(assignmentForm.site_ids);
    const shiftIds = new Set();
    sites.forEach((site) => {
      if (selectedSiteIds.has(site.id)) {
        if (Array.isArray(site.shifts) && site.shifts.length > 0) {
          site.shifts.forEach((s) => shiftIds.add(s.id));
        } else if (Array.isArray(site.shift_ids) && site.shift_ids.length > 0) {
          site.shift_ids.forEach((id) => shiftIds.add(id));
        }
      }
    });
    return shifts.filter((s) => shiftIds.has(s.id));
  }, [assignmentForm.site_ids, shifts, sites]);

  const openCreateModal = () => {
    setModalLoading(false);
    setForm({
      id: null,
      name: '',
      location_id: isSuperAdmin ? '' : (userLocationId ? String(userLocationId) : ''),
      faceImage: null,
      profilePhoto: null,
      gross_salary: '',
      payslip_field_config_id: '',
      employee_code: '',
      department: '',
      designation: '',
      experience_years: '',
      joining_date: '',
      bank_account_number: '',
      ifsc_code: '',
      bank_name: '',
      pan_number: '',
      aadhaar_number: '',
      uan_number: '',
      esi_number: '',
      email: '',
      phone: '',
      address: '',
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

  const openEditModal = async (employee) => {
    setErrors({});
    setModalMode('edit');
    setShowCamera(false);
    setModalLoading(true);
    setForm({
      id: employee.id,
      name: employee.name || '',
      location_id: employee.location_id ? String(employee.location_id) : '',
      faceImage: null,
      profilePhoto: null,
      gross_salary: '',
      payslip_field_config_id: '',
      employee_code: '',
      department: '',
      designation: '',
      experience_years: '',
      joining_date: '',
      bank_account_number: '',
      ifsc_code: '',
      bank_name: '',
      pan_number: '',
      aadhaar_number: '',
      uan_number: '',
      esi_number: '',
      email: '',
      phone: '',
      address: '',
    });
    setFacePreview(null);
    setProfilePreview(null);
    setOriginalFacePreview(null);
    setOriginalProfilePreview(null);
    setShowModal(true);

    try {
      const res = await getEmployeeById(employee.id);
      const detail = res.data || {};
      setForm({
        id: detail.id,
        name: detail.name || '',
        location_id: detail.location_id ? String(detail.location_id) : '',
        faceImage: null,
        profilePhoto: null,
        gross_salary: detail.gross_salary || '',
        payslip_field_config_id: detail.payslip_field_config_id || '',
        employee_code: detail.employee_code || '',
        department: detail.department || '',
        designation: detail.designation || '',
        experience_years: detail.experience_years || '',
        joining_date: detail.joining_date || '',
        bank_account_number: detail.bank_account_number || '',
        ifsc_code: detail.ifsc_code || '',
        bank_name: detail.bank_name || '',
        pan_number: detail.pan_number || '',
        aadhaar_number: detail.aadhaar_number || '',
        uan_number: detail.uan_number || '',
        esi_number: detail.esi_number || '',
        email: detail.email || '',
        phone: detail.phone || '',
        address: detail.address || '',
      });
      const existingPhoto = detail.photo_data || null;
      setFacePreview(null);
      setOriginalFacePreview(existingPhoto);
      setProfilePreview(existingPhoto);
      setOriginalProfilePreview(existingPhoto);
    } catch (error) {
      setShowModal(false);
      onNotify?.(
        'error',
        'Employees',
        'Failed to load employee details.',
        undefined,
        { durationMs: 5000 }
      );
    } finally {
      setModalLoading(false);
    }
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
        // Payslip fields
        if (form.gross_salary) formData.append('gross_salary', form.gross_salary);
        if (form.payslip_field_config_id) formData.append('payslip_field_config_id', form.payslip_field_config_id);
        // Employee details
        if (form.employee_code) formData.append('employee_code', form.employee_code);
        if (form.department) formData.append('department', form.department);
        if (form.designation) formData.append('designation', form.designation);
        if (form.experience_years) formData.append('experience_years', form.experience_years);
        if (form.joining_date) formData.append('joining_date', form.joining_date);
        // Banking details
        if (form.bank_account_number) formData.append('bank_account_number', form.bank_account_number);
        if (form.ifsc_code) formData.append('ifsc_code', form.ifsc_code);
        if (form.bank_name) formData.append('bank_name', form.bank_name);
        // Identification
        if (form.pan_number) formData.append('pan_number', form.pan_number);
        if (form.aadhaar_number) formData.append('aadhaar_number', form.aadhaar_number);
        if (form.uan_number) formData.append('uan_number', form.uan_number);
        if (form.esi_number) formData.append('esi_number', form.esi_number);
        // Contact
        if (form.email) formData.append('email', form.email);
        if (form.phone) formData.append('phone', form.phone);
        if (form.address) formData.append('address', form.address);
        
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
        // Payslip fields
        if (form.gross_salary) formData.append('gross_salary', form.gross_salary);
        if (form.payslip_field_config_id) formData.append('payslip_field_config_id', form.payslip_field_config_id);
        // Employee details
        if (form.employee_code) formData.append('employee_code', form.employee_code);
        if (form.department) formData.append('department', form.department);
        if (form.designation) formData.append('designation', form.designation);
        if (form.experience_years) formData.append('experience_years', form.experience_years);
        if (form.joining_date) formData.append('joining_date', form.joining_date);
        // Banking details
        if (form.bank_account_number) formData.append('bank_account_number', form.bank_account_number);
        if (form.ifsc_code) formData.append('ifsc_code', form.ifsc_code);
        if (form.bank_name) formData.append('bank_name', form.bank_name);
        // Identification
        if (form.pan_number) formData.append('pan_number', form.pan_number);
        if (form.aadhaar_number) formData.append('aadhaar_number', form.aadhaar_number);
        if (form.uan_number) formData.append('uan_number', form.uan_number);
        if (form.esi_number) formData.append('esi_number', form.esi_number);
        // Contact
        if (form.email) formData.append('email', form.email);
        if (form.phone) formData.append('phone', form.phone);
        if (form.address) formData.append('address', form.address);
        
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

  const openAssignModal = async (employee) => {
    setSelectedEmployeeForAssign(employee);
    setAssignmentForm({ 
      shift_id: '', 
      site_ids: [],
      assignment_from_date: new Date().toISOString().split('T')[0],
      assignment_to_date: new Date().toISOString().split('T')[0],
    });
    setExistingAssignmentId(null);
    setShowAssignModal(true);
    
    // Load shifts and sites
    try {
      const [shiftsRes, sitesRes] = await Promise.all([
        getShifts(),
        getSites(),
      ]);
      setShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
      setSites(Array.isArray(sitesRes.data) ? sitesRes.data : []);
    } catch (error) {
      console.error('Failed to load shifts and sites:', error);
    }

    // Load existing assignments if available
    try {
      const assignmentsRes = await getAssignments({ user_id: employee.id });
      if (Array.isArray(assignmentsRes.data) && assignmentsRes.data.length > 0) {
        const assignment = assignmentsRes.data[0];
        setExistingAssignmentId(assignment.id);
        
        // Extract shift_id - handle multiple formats from backend
        let shiftId = '';
        if (assignment.shift) {
          // If shift is an object with id property
          shiftId = assignment.shift.id || assignment.shift;
        } else if (assignment.shift_id) {
          shiftId = assignment.shift_id;
        }
        
        // Convert to string for consistency
        shiftId = shiftId ? String(shiftId) : '';
        
        console.log('Loaded assignment:', { 
          assignmentId: assignment.id, 
          rawShift: assignment.shift, 
          rawShiftId: assignment.shift_id,
          extractedShiftId: shiftId 
        });
        
        setAssignmentForm({
          shift_id: shiftId,
          site_ids: assignment.site_ids || [],
          assignment_from_date: assignment.assignment_from_date || new Date().toISOString().split('T')[0],
          assignment_to_date: assignment.assignment_to_date || new Date().toISOString().split('T')[0],
        });
      }

      // Also load user sites to ensure we have the correct site assignments
      try {
        const userSitesRes = await getUserSites(employee.id);
        if (Array.isArray(userSitesRes.data) && userSitesRes.data.length > 0) {
          const siteIds = userSitesRes.data.map(us => us.site || us.site_id).filter(Boolean);
          setAssignmentForm(prev => ({
            ...prev,
            site_ids: siteIds,
          }));
        }
      } catch (error) {
        console.error('Failed to load user sites:', error);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!selectedEmployeeForAssign) return;
    
    setAssignmentLoading(true);
    try {
      // If no shift selected, send null for dates
      const assignmentPayload = {
        user: selectedEmployeeForAssign.id,
        location: selectedEmployeeForAssign.location_id,
        shift: assignmentForm.shift_id || null,
        assignment_from_date: assignmentForm.shift_id ? (assignmentForm.assignment_from_date || null) : null,
        assignment_to_date: assignmentForm.shift_id ? (assignmentForm.assignment_to_date || null) : null,
      };

      // Update or create assignment based on whether it exists
      if (existingAssignmentId) {
        // Update existing assignment
        await updateAssignment(existingAssignmentId, assignmentPayload);
      } else {
        // Create new assignment
        await createAssignment(assignmentPayload);
      }

      // Always call assignUserSites to update site assignments
      // This handles both adding new sites and updating existing ones
      await assignUserSites(selectedEmployeeForAssign.id, {
        site_ids: assignmentForm.site_ids,
      });

      const dateRange = assignmentForm.shift_id 
        ? `from ${assignmentForm.assignment_from_date} to ${assignmentForm.assignment_to_date}`
        : 'with no shift';
      
      onNotify?.('success', 'Assignment Saved', `Shift assigned ${dateRange}.`);
      setShowAssignModal(false);
      setSelectedEmployeeForAssign(null);
      setExistingAssignmentId(null);
    } catch (error) {
      const detail = error.response?.data?.detail || error.response?.data?.error || 'Unable to save assignment.';
      onNotify?.('error', 'Assignment Failed', detail, undefined, { durationMs: 6000 });
    } finally {
      setAssignmentLoading(false);
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

  const employeeTableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', render: (value) => value || '—' },
    {
      key: 'location_id',
      label: 'Location',
      render: (value, row) => locationName(row.location_id),
    },
  ];

  const employeeTableActions = [
    { label: 'Edit', className: 'edit', onClick: openEditModal },
    { label: 'Assign', className: 'assign', onClick: openAssignModal },
    { label: 'Delete', className: 'delete', onClick: handleDelete },
  ];

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
            + Register
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
          <DataTable
            columns={employeeTableColumns}
            data={filteredEmployees}
            isLoading={loading}
            emptyMessage="No employees found."
            actions={employeeTableActions}
            rowKey="id"
          />
        )}
        </div>
      </div>

      {showAssignModal && selectedEmployeeForAssign && (
        <AssignmentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title={`${existingAssignmentId ? 'Update' : 'Assign'} Shift & Sites - ${selectedEmployeeForAssign.name}`}
          formData={assignmentForm}
          onFormChange={setAssignmentForm}
          availableShifts={availableAssignmentShifts}
          availableSites={filteredSitesForAssignment}
          isSubmitting={assignmentLoading}
          onSubmit={handleAssignmentSubmit}
        />
      )}

      {showModal && (
        <Modal
          title={modalMode === 'create' ? 'Register employee' : 'Edit employee'}
          onClose={() => setShowModal(false)}
          actions={
            <>
              <button type="button" className="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" form="employee-form" disabled={submitting || modalLoading}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          {modalLoading ? (
            <div className="management-empty">Loading employee…</div>
          ) : (
            <form id="employee-form" className="employee-form-container" onSubmit={handleSubmit}>
             

              {/* Basic Information Section */}
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Name <span className="required-indicator">*</span>
                    </label>
                    <input
                      name="name"
                      className="form-control"
                      value={form.name}
                      onChange={handleNameChange}
                      placeholder="Enter employee name"
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>

                  {isSuperAdmin ? (
                    <div className="form-group">
                      <label className="form-label">
                        Location <span className="required-indicator">*</span>
                      </label>
                      <select
                        name="location_id"
                        className="form-control"
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
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">
                        Location <span className="required-indicator">*</span>
                      </label>
                      <input
                        className="form-control"
                        value={locationName(form.location_id)}
                        readOnly
                      />
                      {errors.location_id && <div className="form-error">{errors.location_id}</div>}
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Section */}
              <div className="form-section">
                <h3 className="section-title">Photography</h3>
                <div className="photo-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Face Photo <span className="required-indicator">*</span>
                    </label>
                    <div className="face-capture-section" ref={faceSectionRef}>
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
                          <div className="face-placeholder">
                            <span>📷</span>
                            <p>No face</p>
                          </div>
                        )}
                      </div>
                      {modalMode === 'edit' && (
                        <span className="face-note">
                          Capture new photo to update recognition.
                        </span>
                      )}
                      <div className="face-capture-actions">
                        {showCamera ? (
                          <>
                            <button type="button" className="btn-primary" onClick={handleCaptureFace}>
                              Capture
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setShowCamera(false)}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="btn-primary" onClick={handleStartCamera}>
                              {facePreview ? 'Retake' : 'Capture'}
                            </button>
                            {modalMode === 'edit' && originalFacePreview && facePreview !== originalFacePreview && (
                              <button type="button" className="btn-secondary" onClick={handleUseOriginalFace}>
                                Use Saved
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      {errors.face_image && <div className="form-error">{errors.face_image}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Profile Photo</label>
                    <div className="profile-preview">
                      {profilePreview ? (
                        <img src={profilePreview} alt="Profile preview" />
                      ) : (
                        <div className="face-placeholder">
                          <span>📸</span>
                          <p>No photo</p>
                        </div>
                      )}
                    </div>
                    <div className="file-input-wrapper" style={{ marginTop: '0.4rem' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="form-control"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                      />
                    </div>
                    {errors.profile_photo && <div className="form-error">{errors.profile_photo}</div>}
                  </div>
                </div>
              </div>

              {/* Payroll Information Section */}
              <div className="form-section">
                <h3 className="section-title">Payroll Information</h3>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Gross Salary</label>
                    <input
                      type="number"
                      name="gross_salary"
                      className="form-control"
                      value={form.gross_salary}
                      onChange={(e) => setForm({ ...form, gross_salary: e.target.value })}
                      placeholder="Gross salary amount"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payslip Config</label>
                    <select
                      name="payslip_field_config_id"
                      className="form-control"
                      value={form.payslip_field_config_id}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm({ ...form, payslip_field_config_id: value });
                        // Clear error when selection is made
                        if (value) {
                          setErrors((prev) => ({ ...prev, payslip_field_config_id: undefined }));
                        }
                      }}
                    >
                      <option value="">-- Select Payslip Config --</option>
                      {payslipConfigs.map((config) => (
                        <option key={config.id} value={config.id}>
                          {config.config_name}
                        </option>
                      ))}
                    </select>
                    {errors.payslip_field_config_id && (
                      <div className="form-error">{errors.payslip_field_config_id}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Employee Details Section */}
              <div className="form-section">
                <h3 className="section-title">Employee Details</h3>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Employee Code</label>
                    <input
                      type="text"
                      name="employee_code"
                      className="form-control"
                      value={form.employee_code}
                      onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                      placeholder="Employee code"
                      maxLength="50"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      name="department"
                      className="form-control"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      placeholder="Department"
                      maxLength="100"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      className="form-control"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      placeholder="Designation/Job Title"
                      maxLength="100"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience (Years)</label>
                    <input
                      type="number"
                      name="experience_years"
                      className="form-control"
                      value={form.experience_years}
                      onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                      placeholder="Years of experience"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Joining Date</label>
                    <input
                      type="date"
                      name="joining_date"
                      className="form-control"
                      value={form.joining_date}
                      onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Banking Details Section */}
              <div className="form-section">
                <h3 className="section-title">Banking Details</h3>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Bank Account Number</label>
                    <input
                      type="text"
                      name="bank_account_number"
                      className="form-control"
                      value={form.bank_account_number}
                      onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                      placeholder="Account number"
                      maxLength="20"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      name="ifsc_code"
                      className="form-control"
                      value={form.ifsc_code}
                      onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })}
                      placeholder="IFSC code"
                      maxLength="11"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      className="form-control"
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      placeholder="Bank name"
                      maxLength="100"
                    />
                  </div>
                </div>
              </div>

              {/* Identification Section */}
              <div className="form-section">
                <h3 className="section-title">Government Identification</h3>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input
                      type="text"
                      name="pan_number"
                      className="form-control"
                      value={form.pan_number}
                      onChange={(e) => setForm({ ...form, pan_number: e.target.value })}
                      placeholder="PAN number"
                      maxLength="10"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aadhaar Number</label>
                    <input
                      type="text"
                      name="aadhaar_number"
                      className="form-control"
                      value={form.aadhaar_number}
                      onChange={(e) => setForm({ ...form, aadhaar_number: e.target.value })}
                      placeholder="Aadhaar number"
                      maxLength="12"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">UAN Number (PF)</label>
                    <input
                      type="text"
                      name="uan_number"
                      className="form-control"
                      value={form.uan_number}
                      onChange={(e) => setForm({ ...form, uan_number: e.target.value })}
                      placeholder="UAN number"
                      maxLength="12"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ESI Number</label>
                    <input
                      type="text"
                      name="esi_number"
                      className="form-control"
                      value={form.esi_number}
                      onChange={(e) => setForm({ ...form, esi_number: e.target.value })}
                      placeholder="ESI number"
                      maxLength="17"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="form-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone number"
                      maxLength="15"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label className="form-label">Address</label>
                    <textarea
                      name="address"
                      className="form-control"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Full address"
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default EmployeesPage;