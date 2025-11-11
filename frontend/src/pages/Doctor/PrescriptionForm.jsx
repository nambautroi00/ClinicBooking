import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Form, Alert, Modal } from "react-bootstrap";
import { Pill, Plus, User, Search, ArrowLeft, Save, Clipboard } from "lucide-react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import prescriptionApi from "../../api/prescriptionApi";
import medicineApi from "../../api/medicineApi";
import patientApi from "../../api/patientApi";
import appointmentApi from "../../api/appointmentApi";
import referralApi from "../../api/referralApi";
import departmentApi from "../../api/departmentApi";
import Cookies from 'js-cookie';

const PrescriptionForm = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();
  
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchError, setSearchError] = useState(null);

  // Get appointment info from navigation state
  const appointmentInfo = location.state?.appointment;
  const patientInfo = location.state?.patientInfo;

  // Form state for new prescription
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    diagnosis: '',
    medicines: [],
    selectedAppointmentId: appointmentId || '' // Store selected appointment
  });

  // Current medicine being added
  const [currentMedicine, setCurrentMedicine] = useState({
    medicineId: '',
    quantity: 1,
    dosage: '',
    duration: '',
    instructions: ''
  });

  // Clinical Referral Modal State
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [referralData, setReferralData] = useState({
    toDepartmentId: '',
    notes: ''
  });

  useEffect(() => {
    loadMedicines();
    loadPatients();
    loadAppointments();
    loadDepartments();
  }, []);

  // Debug: Log why save button is disabled
  useEffect(() => {
    const isDisabled = 
      formData.medicines.length === 0 || 
      !formData.patientId || 
      !formData.diagnosis.trim() ||
      formData.medicines.some(med => !med.medicineId || !med.dosage || med.quantity === undefined || med.quantity === null || med.quantity <= 0);
    
    if (isDisabled) {
      console.log('🔍 Save button disabled because:');
      if (formData.medicines.length === 0) console.log('  - No medicines');
      if (!formData.patientId) console.log('  - No patientId');
      if (!formData.diagnosis.trim()) console.log('  - No diagnosis');
      const invalidMeds = formData.medicines.filter(med => !med.medicineId || !med.dosage || med.quantity === undefined || med.quantity === null || med.quantity <= 0);
      if (invalidMeds.length > 0) {
        console.log('  - Invalid medicines:', invalidMeds);
      }
    }
  }, [formData]);

  // Auto-fill patient info if coming from appointment
  useEffect(() => {
    if (appointmentInfo && patientInfo) {
      setFormData(prev => ({
        ...prev,
        // Normalize patient id/name coming from navigation state
        patientId: patientInfo.patientId || patientInfo.id || '',
        patientName: patientInfo.patientName || patientInfo.name || '',
        diagnosis: '' // Doctor will fill this
      }));
    }
  }, [appointmentInfo, patientInfo]);

  // If route has appointmentId but navigation state didn't include patientInfo,
  // try to fetch appointment and patient details so patientId is populated.
  useEffect(() => {
    const fetchAppointmentAndPatient = async () => {
      if (!appointmentId) return;
      if (patientInfo && patientInfo.patientId) return; // already have

      try {
        console.log('🔍 Fetching appointment because navigation state lacked patientInfo', appointmentId);
        const apptRes = await appointmentApi.getAppointmentById(appointmentId);
        const appt = apptRes.data || apptRes;
        const pid = appt.patientId || appt.patient?.id;
        if (pid) {
          // Try to fetch patient details
          try {
            const pRes = await patientApi.getPatientById(pid);
            const p = pRes.data || pRes;
            const resolvedPatientId = (p.patientId || p.id || pid)?.toString();
            const resolvedPatientName = (p.user?.lastName && p.user?.firstName) ? (p.user.lastName + ' ' + p.user.firstName) : (p.lastName && p.firstName ? (p.lastName + ' ' + p.firstName) : (p.name || ''));
            setFormData(prev => ({
              ...prev,
              patientId: resolvedPatientId,
              patientName: resolvedPatientName
            }));
          } catch (pErr) {
            console.warn('⚠️ Could not fetch patient by id from appointment:', pErr);
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch appointment by id:', err);
      }
    };

    fetchAppointmentAndPatient();
  }, [appointmentId, patientInfo]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
  console.log('🔍 Đang tải danh sách thuốc...');
  // use canonical medicineApi.getAll() from frontend/src/api/medicineApi.js
  const medicinesRes = await medicineApi.getAll();
      
      const medicinesData = medicinesRes.data.map(medicine => ({
        id: medicine.medicineId || medicine.id || Math.random(),
        medicineId: medicine.medicineId || medicine.id || 'N/A',
        name: medicine.name || 'Không rõ tên',
        strength: medicine.strength || '',
        category: medicine.note || medicine.category || 'Không phân loại',
        price: medicine.unit_price || medicine.unitPrice || medicine.price || 0,
        unit: medicine.unit || 'đơn vị',
        description: medicine.description || ''
      }));

      console.log('✅ Đã tải danh sách thuốc:', medicinesData);
      console.log('🔍 Raw medicine data từ backend:', medicinesRes.data);
      console.log('🔍 Sample medicine object:', medicinesRes.data[0]);
      setMedicines(medicinesData);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách thuốc từ backend:', error);
      
      if (error.response?.status === 401) {
        console.error('🔒 Không có quyền truy cập danh sách thuốc');
      } else {
        console.error('🔌 Không thể kết nối đến server backend');
      }
      
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      console.log('🔍 Đang tải danh sách bệnh nhân...');
      const patientsRes = await patientApi.getAllPatients();
      
      const patientsData = patientsRes.data.map(patient => ({
        id: patient.id || Math.random(),
        // Normalize patientId to string to avoid strict equality issues
        patientId: (patient.patientId || patient.id || '').toString(),
        name: (patient.user?.lastName && patient.user?.firstName) ? 
              (patient.user.lastName + " " + patient.user.firstName) :
              (patient.lastName && patient.firstName) ?
              (patient.lastName + " " + patient.firstName) :
              "Không rõ tên",
        phone: patient.user?.phone || patient.phone || "",
        email: patient.user?.email || patient.email || "",
        address: patient.user?.address || patient.address || "",
        healthInsuranceNumber: patient.healthInsuranceNumber || ""
      }));

      console.log('✅ Đã tải danh sách bệnh nhân:', patientsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách bệnh nhân từ backend:', error);
      
      if (error.response?.status === 401) {
        console.error('🔒 Không có quyền truy cập danh sách bệnh nhân');
      } else {
        console.error('🔌 Không thể kết nối đến server backend');
      }
      
      setPatients([]);
    }
  };

  const loadAppointments = async () => {
    try {
      console.log('🔍 Đang tải danh sách lịch hẹn...');
      
      // Lấy userId từ cookie để lấy appointments của doctor hiện tại
      const doctorId = Cookies.get('userId');
      console.log('👨‍⚕️ Doctor ID từ cookie:', doctorId);
      
      let appointmentsRes;
      if (doctorId) {
        // Lấy appointments theo doctor
        appointmentsRes = await appointmentApi.getAppointmentsByDoctor(doctorId);
        console.log('📡 API Response (by doctor):', appointmentsRes);
      } else {
        // Fallback: try to call getAllAppointments if it exists, otherwise fall back to a safe API
        if (typeof appointmentApi.getAllAppointments === 'function') {
          appointmentsRes = await appointmentApi.getAllAppointments();
          console.log('📡 API Response (all):', appointmentsRes);
        } else if (typeof appointmentApi.getAppointmentsByDate === 'function') {
          // As a safe fallback, request today's appointments (backend expects a date query param)
          const today = new Date().toISOString().split('T')[0];
          appointmentsRes = await appointmentApi.getAppointmentsByDate(today);
          console.log('📡 API Response (by date fallback):', appointmentsRes);
        } else {
          // If no suitable method exists, avoid throwing — return empty list
          console.warn('⚠️ appointmentApi missing getAllAppointments and getAppointmentsByDate; falling back to empty list');
          appointmentsRes = { data: [] };
        }
      }
      
      console.log('📊 Raw data:', appointmentsRes.data);
      
      const appointmentsData = appointmentsRes.data.map(appointment => ({
        id: appointment.appointmentId || appointment.id,
        appointmentId: (appointment.appointmentId || appointment.id)?.toString(),
        patientId: appointment.patientId || appointment.patient?.id,
        patientName: appointment.patientName || (appointment.patient?.user?.lastName && appointment.patient?.user?.firstName ? 
                    (appointment.patient.user.lastName + ' ' + appointment.patient.user.firstName) :
                    (appointment.patient?.lastName && appointment.patient?.firstName ?
                     (appointment.patient.lastName + ' ' + appointment.patient.firstName) : 'Không rõ tên')),
        startTime: appointment.startTime,
        status: appointment.status || 'Scheduled',
        notes: appointment.notes || ''
      }));

      console.log('✅ Đã tải danh sách lịch hẹn:', appointmentsData);
      console.log('📊 Status của các lịch hẹn:', appointmentsData.map(appt => ({ id: appt.id, status: appt.status, patientName: appt.patientName })));
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách lịch hẹn từ backend:', error);
      
      if (error.response?.status === 401) {
        console.error('🔒 Không có quyền truy cập danh sách lịch hẹn');
      } else {
        console.error('🔌 Không thể kết nối đến server backend');
      }
      
      setAppointments([]);
    }
  };

  // Load departments for clinical referral
  const loadDepartments = async () => {
    try {
      const response = await departmentApi.getAllDepartmentsList();
      console.log('✅ Loaded departments:', response.data);
      
      // Extract departments from paginated response
      const depts = response.data?.content || response.data || [];
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading departments:', error);
      // Fallback departments if API fails
      setDepartments([
        { id: 1, departmentId: 1, departmentName: 'Khoa Xét nghiệm' },
        { id: 2, departmentId: 2, departmentName: 'Khoa Chẩn đoán hình ảnh' },
        { id: 3, departmentId: 3, departmentName: 'Khoa X-quang' },
        { id: 4, departmentId: 4, departmentName: 'Khoa Siêu âm' },
      ]);
    }
  };

  // Handle creating clinical referral
  const handleCreateReferral = async () => {
    console.log('🔍 Starting referral creation...');
    console.log('🔍 Current formData:', formData);
    console.log('🔍 Current referralData:', referralData);
    console.log('🔍 appointmentId from params:', appointmentId);
    console.log('🔍 appointmentInfo from state:', appointmentInfo);

    if (!referralData.toDepartmentId) {
      alert('Vui lòng chọn khoa thực hiện');
      return;
    }

    if (!referralData.notes.trim()) {
      alert('Vui lòng nhập yêu cầu cận lâm sàng');
      return;
    }

    // Try to resolve appointmentId from multiple sources
    const resolvedAppointmentId = formData.selectedAppointmentId || 
                                   appointmentId || 
                                   appointmentInfo?.appointmentId || 
                                   appointmentInfo?.id;
    
    console.log('🔍 Resolved appointment ID:', resolvedAppointmentId);

    if (!resolvedAppointmentId) {
      alert('❌ Không tìm thấy thông tin lịch hẹn.\n\nVui lòng:\n1. Chọn lịch hẹn từ dropdown\n2. Hoặc mở form này từ trang "Lịch hẹn bệnh nhân"');
      return;
    }

    // Validate appointmentId is a valid number
    const parsedAppointmentId = parseInt(resolvedAppointmentId);
    if (isNaN(parsedAppointmentId) || parsedAppointmentId <= 0) {
      console.error('❌ Invalid appointment ID:', resolvedAppointmentId);
      alert(`❌ ID lịch hẹn không hợp lệ: ${resolvedAppointmentId}`);
      return;
    }

    // Validate departmentId
    const parsedDepartmentId = parseInt(referralData.toDepartmentId);
    if (isNaN(parsedDepartmentId) || parsedDepartmentId <= 0) {
      console.error('❌ Invalid department ID:', referralData.toDepartmentId);
      alert(`❌ ID khoa không hợp lệ: ${referralData.toDepartmentId}`);
      return;
    }

    try {
      const requestData = {
        appointmentId: parsedAppointmentId,
        toDepartmentId: parsedDepartmentId,
        notes: referralData.notes.trim()
      };

      console.log('📋 Creating referral with data:', requestData);
      console.log('📋 Request payload:', JSON.stringify(requestData, null, 2));

      const response = await referralApi.createReferral(requestData);
      console.log('✅ Referral created successfully:', response);
      
      alert('✅ Đã tạo chỉ định cận lâm sàng thành công!');
      setShowReferralModal(false);
      setReferralData({ toDepartmentId: '', notes: '' });
      
      // Update appointment status to REFERRED
      try {
        await appointmentApi.updateAppointment(parsedAppointmentId, { status: 'REFERRED' });
        console.log('✅ Appointment status updated to REFERRED');
      } catch (e) {
        console.warn('⚠️ Không thể cập nhật trạng thái appointment:', e);
        // Don't show error to user as referral was created successfully
      }
    } catch (error) {
      console.error('❌ Error creating referral:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorMessage = '❌ Không thể tạo chỉ định.\n\n';
      
      if (error.response?.data?.message) {
        errorMessage += `Lỗi: ${error.response.data.message}\n\n`;
      }
      
      if (error.response?.status === 400) {
        errorMessage += 'Có thể do:\n';
        errorMessage += '• Lịch hẹn không tồn tại hoặc đã bị xóa\n';
        errorMessage += '• Khoa được chỉ định không tồn tại\n';
        errorMessage += '• Bác sĩ chưa được xác thực\n\n';
        errorMessage += `AppointmentId: ${parsedAppointmentId}\n`;
        errorMessage += `DepartmentId: ${parsedDepartmentId}`;
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage += 'Bạn không có quyền tạo chỉ định.\nVui lòng đăng nhập lại.';
      } else {
        errorMessage += 'Vui lòng thử lại hoặc liên hệ IT hỗ trợ.';
      }
      
      alert(errorMessage);
    }
  };

  // Enhanced search filter with error handling
  const filteredMedicines = React.useMemo(() => {
    try {
      if (!medicines || medicines.length === 0) {
        console.log('🔍 No medicines to filter');
        return [];
      }

      if (!searchTerm || !searchTerm.trim()) {
        console.log('🔍 No search term, returning all medicines:', medicines.length);
        return medicines;
      }
      
      const searchLower = searchTerm.toLowerCase().trim();
      console.log('🔍 Filtering with search term:', searchLower);
      
      const filtered = medicines.filter(medicine => {
        try {
          if (!medicine) return false;
          
          const name = (medicine.name || '').toLowerCase();
          const medicineId = (medicine.medicineId || '').toLowerCase();
          const category = (medicine.category || '').toLowerCase();
          const strength = (medicine.strength || '').toLowerCase();
          
          return name.includes(searchLower) ||
                 medicineId.includes(searchLower) ||
                 category.includes(searchLower) ||
                 strength.includes(searchLower);
        } catch (error) {
          console.error('❌ Error filtering medicine:', medicine, error);
          return false;
        }
      });
      
      console.log('🔍 Filtered medicines:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('❌ Error in filteredMedicines:', error);
      return [];
    }
  }, [medicines, searchTerm]);

  // Safe search handler with error handling
  const handleSearchChange = (e) => {
    try {
      const value = e.target.value;
      console.log('🔍 Search input changed:', value);
      setSearchTerm(value);
      setSearchError(null);
    } catch (error) {
      console.error('❌ Error in search input:', error);
      setSearchError('Lỗi khi tìm kiếm. Vui lòng thử lại.');
    }
  };

  const handleSelectPatient = (patientId) => {
    if (!patientId) {
      setFormData(prev => ({ ...prev, patientId: '', patientName: '' }));
      return;
    }

    const patient = patients.find(p => (p.patientId?.toString() === patientId?.toString()) || (p.id?.toString() === patientId?.toString()));
    if (patient) {
      setFormData(prev => ({
        ...prev,
        // store patientId as string
        patientId: patient.patientId?.toString() || patient.id?.toString() || '',
        patientName: patient.name
      }));
    }
  };

  const handleAddMedicine = () => {
    console.log('🔍 Current medicine data:', currentMedicine);
    console.log('📋 Available medicines:', medicines.map(m => ({ id: m.id, name: m.name })));

    if (!currentMedicine.medicineId || !currentMedicine.quantity || !currentMedicine.dosage) {
      alert('Vui lòng điền đầy đủ thông tin thuốc');
      return;
    }

    console.log('🔍 Looking for medicine with ID:', currentMedicine.medicineId);
    console.log('🔍 Parsed ID:', parseInt(currentMedicine.medicineId));

    // Try multiple ways to find the medicine
    let selectedMedicine = medicines.find(m => m.id == currentMedicine.medicineId) || // Use loose equality
                          medicines.find(m => m.id === parseInt(currentMedicine.medicineId)) ||
                          medicines.find(m => m.id.toString() === currentMedicine.medicineId.toString());

    console.log('✅ Found medicine:', selectedMedicine);

    if (!selectedMedicine) {
      console.error('❌ Không tìm thấy thuốc với ID:', currentMedicine.medicineId);
      console.error('Available IDs:', medicines.map(m => `${m.id} (${typeof m.id})`));
      alert(`Thuốc không hợp lệ. ID: ${currentMedicine.medicineId} không tìm thấy trong danh sách.`);
      return;
    }

    // Ensure quantity is a valid number
    const quantity = parseInt(currentMedicine.quantity) || 1;
    
    const newMedicine = {
      ...currentMedicine,
      id: Date.now(),
      medicineId: selectedMedicine.medicineId || selectedMedicine.id,
      medicineName: selectedMedicine.name,
      quantity: quantity,
      price: (selectedMedicine.price || 0) * quantity,
      unitPrice: selectedMedicine.price || 0,
      unit: selectedMedicine.unit || 'đơn vị'
    };
    
    // Ensure medicineId is set
    if (!newMedicine.medicineId) {
      console.error('❌ medicineId is missing after adding medicine:', newMedicine);
      alert('Lỗi: Không thể xác định ID thuốc. Vui lòng thử lại.');
      return;
    }
    
    // Ensure dosage is set
    if (!newMedicine.dosage || !newMedicine.dosage.trim()) {
      console.error('❌ dosage is missing after adding medicine:', newMedicine);
      alert('Lỗi: Liều dùng không được để trống. Vui lòng thử lại.');
      return;
    }

    setFormData(prev => {
      const updatedMedicines = [...prev.medicines, newMedicine];
      console.log('✅ Added medicine:', newMedicine);
      console.log('📋 Updated medicines list:', updatedMedicines);
      return {
        ...prev,
        medicines: updatedMedicines
      };
    });

    // Reset current medicine
    setCurrentMedicine({
      medicineId: '',
      quantity: 1,
      dosage: '',
      duration: '',
      instructions: ''
    });
  };

  const handleRemoveMedicine = (medicineIndex) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, index) => index !== medicineIndex)
    }));
  };

  const handleSavePrescription = async () => {
    console.log('🔍 Checking form data before save:', formData);
    console.log('🔍 Current medicines:', formData.medicines);

    if (!formData.patientId || !formData.diagnosis || formData.medicines.length === 0) {
      alert('Vui lòng điền đầy đủ thông tin đơn thuốc');
      return;
    }

    try {
      // Validate medicine data
      const invalidMedicines = formData.medicines.filter(med => 
        !med.medicineId || isNaN(parseInt(med.medicineId)) || !med.dosage
      );

      if (invalidMedicines.length > 0) {
        console.error('❌ Có thuốc thiếu thông tin hoặc medicineId không hợp lệ:', invalidMedicines);
        alert('Có thuốc trong đơn chưa đầy đủ thông tin hoặc ID thuốc không hợp lệ. Vui lòng kiểm tra lại.');
        return;
      }

      // Prepare prescription data for backend
      const initialRecordId = location.state?.recordId || appointmentInfo?.recordId || '';
      const parsedRecordId = initialRecordId ? parseInt(initialRecordId) : null;

      // Resolve appointmentId from various sources
      const resolvedAppointmentId = formData.selectedAppointmentId || appointmentId || appointmentInfo?.appointmentId || location.state?.appointment?.appointmentId || null;
      
      // Build prescription payload
      const prescriptionData = {
        // Include recordId if available (backend will use it if present)
        ...(parsedRecordId && { recordId: parsedRecordId }),
        // Include appointmentId so backend can create MedicalRecord if recordId is missing
        ...(resolvedAppointmentId && { appointmentId: parseInt(resolvedAppointmentId) }),
        notes: formData.diagnosis,
        items: formData.medicines.map(med => {
          // Ensure medicineId is a number
          const medicineId = parseInt(med.medicineId);
          if (isNaN(medicineId)) {
            throw new Error(`Medicine ID không hợp lệ: ${med.medicineId}`);
          }
          return {
            medicineId: medicineId,
            quantity: med.quantity || 1,
            dosage: med.dosage || '',
            duration: med.duration || '',
            note: med.instructions || ''
          };
        })
      };

      // Validate: Must have either recordId or appointmentId
      if (!prescriptionData.recordId && !prescriptionData.appointmentId) {
        alert('Vui lòng chọn hoặc mở từ một lịch hẹn để hệ thống tự động tạo hồ sơ bệnh án.');
        return;
      }

      // Validate appointmentId if provided
      if (prescriptionData.appointmentId && isNaN(prescriptionData.appointmentId)) {
        alert(`Appointment ID không hợp lệ: ${resolvedAppointmentId}`);
        return;
      }

      console.log('💾 prescriptionData to send:', JSON.stringify(prescriptionData, null, 2));
      console.log('🔍 Backend will:', 
        prescriptionData.recordId 
          ? 'use existing MedicalRecord' 
          : 'create MedicalRecord from appointmentId');

      try {
        const result = await prescriptionApi.createPrescription(prescriptionData);
        console.log('✅ API response:', result);

        // Calculate total amount for display
        const totalAmount = formData.medicines.reduce((sum, med) => sum + (Number(med.price) || 0), 0);
        const formattedTotal = totalAmount.toLocaleString('vi-VN');

        // Show success message
        alert(`✅ Đã lưu đơn thuốc thành công!\n\n📋 Bệnh nhân: ${formData.patientName}\n💊 Số loại thuốc: ${formData.medicines.length}\n💰 Tổng tiền: ${formattedTotal} ₫`);

        // Update appointment status to Completed (if appointmentId available)
        if (prescriptionData.appointmentId) {
          try {
            await appointmentApi.updateAppointment(prescriptionData.appointmentId, { status: 'Completed' });
            console.log('✅ Appointment status updated to Completed for', prescriptionData.appointmentId);
          } catch (e) {
            console.warn('⚠️ Không thể cập nhật trạng thái appointment sau khi kê đơn:', e);
            // Don't block navigation if appointment update fails
          }
        }

        // Navigate back to prescriptions list
        console.log('🚀 Navigating to /doctor/prescriptions...');
        navigate('/doctor/prescriptions', {
          state: {
            message: 'Đã kê đơn thuốc thành công!',
            newPrescription: true
          }
        });
      } catch (apiError) {
        console.error('❌ Lỗi khi lưu đơn thuốc vào database:', apiError);
        console.error('❌ Error response:', apiError.response);
        console.error('❌ Error response data:', apiError.response?.data);
        console.error('❌ Prescription data sent:', JSON.stringify(prescriptionData, null, 2));

        // Build a detailed message including backend response body when available
        let errorMessage = '❌ Không thể lưu đơn thuốc vào hệ thống.\n\n';
        const resp = apiError.response;
        if (resp) {
          errorMessage += `Server trả về: ${resp.status} ${resp.statusText}\n`;
          if (resp.data) {
            try {
              // If backend provides validation errors, include them
              const body = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2);
              errorMessage += `Chi tiết: ${body}\n`;
            } catch (e) {
              errorMessage += 'Chi tiết lỗi không thể hiển thị.';
            }
          }
        } else if (apiError.request) {
          errorMessage += 'Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối.';
        } else {
          errorMessage += `Lỗi: ${apiError.message}`;
        }

        alert(errorMessage);
        return; // Don't navigate on error
      }

    } catch (error) {
      console.error('❌ Lỗi không mong đợi:', error);
      
      // More detailed error message
      let errorMessage = '❌ Không thể lưu đơn thuốc.\n\n';
      
      if (error.response) {
        errorMessage += `Lỗi server: ${error.response.status} - ${error.response.data?.message || 'Không rõ lý do'}`;
      } else if (error.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else {
        errorMessage += `Lỗi: ${error.message}`;
      }
      
      errorMessage += '\n\nVui lòng thử lại hoặc liên hệ quản trị viên.';
      
      alert(errorMessage);
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <Link to="/doctor/prescriptions" className="btn btn-outline-secondary me-3">
                      <ArrowLeft size={18} className="me-1" />
                      Quay lại
                    </Link>
                    <h4 className="mb-0">
                      <Pill className="me-2" size={24} />
                      {appointmentInfo ? 'Kê Đơn Thuốc - Khám Bệnh' : 'Kê Đơn Thuốc Mới'}
                    </h4>
                  </div>
                  {(appointmentInfo || formData.patientId) ? (
                    <div className="mb-2">
                      <small className="text-muted">Lịch hẹn: {appointmentInfo?.appointmentTime || appointmentInfo?.startTime || 'N/A'} - {appointmentInfo?.appointmentDate || 'N/A'}</small>
                      <br />
                      <small className="text-info">
                        Bệnh nhân: {formData.patientName || patientInfo?.name || 'Không rõ'} |
                        ID: {formData.patientId || patientInfo?.patientId || patientInfo?.id || appointmentInfo?.appointmentId || 'N/A'}
                      </small>
                    </div>
                  ) : (
                    <small className="text-muted">Tạo đơn thuốc cho bệnh nhân</small>
                  )}
                </div>
                <Button 
                  variant="success" 
                  onClick={handleSavePrescription}
                  disabled={
                    formData.medicines.length === 0 || 
                    !formData.patientId || 
                    !formData.diagnosis.trim() ||
                    formData.medicines.some(med => !med.medicineId || !med.dosage || med.quantity === undefined || med.quantity === null || med.quantity <= 0)
                  }
                >
                  <Save className="me-2" size={18} />
                  Lưu đơn thuốc
                </Button>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={7}>
          {/* Patient Selection */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Thông tin bệnh nhân</h6>
            </Card.Header>
            <Card.Body>
              {(appointmentInfo || formData.patientId || patientInfo) ? (
                <Alert variant="info">
                  <div><strong>Từ lịch hẹn:</strong> {formData.patientName || patientInfo?.name || 'Không rõ tên'}</div>
                  <div><strong>ID:</strong> {formData.patientId || patientInfo?.patientId || patientInfo?.id || 'N/A'}</div>
                  {patientInfo?.phone && <div><strong>SĐT:</strong> {patientInfo.phone}</div>}
                </Alert>
              ) : (
                <Form.Select 
                  value={formData.patientId}
                  onChange={(e) => handleSelectPatient(e.target.value)}
                >
                  <option value="">Chọn bệnh nhân...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.patientId}>
                      {patient.name} - {patient.patientId}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Card.Body>
          </Card>

          {/* Appointment Selection - only show if no appointment from URL/state */}
          {!appointmentInfo && !appointmentId && (
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">Chọn lịch hẹn (tùy chọn)</h6>
              </Card.Header>
              <Card.Body>
                <Form.Select 
                  value={formData.selectedAppointmentId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setFormData(prev => ({ ...prev, selectedAppointmentId: selectedId }));
                    
                    // Auto-fill patient info if appointment selected
                    if (selectedId) {
                      const selectedAppointment = appointments.find(appt => appt.appointmentId === selectedId);
                      if (selectedAppointment && selectedAppointment.patientId) {
                        console.log('👤 Selected appointment:', selectedAppointment);
                        console.log('👤 Patient ID:', selectedAppointment.patientId);
                        console.log('👤 Patient Name:', selectedAppointment.patientName);
                        setFormData(prev => ({
                          ...prev,
                          patientId: selectedAppointment.patientId.toString(),
                          patientName: selectedAppointment.patientName || 'Không rõ tên'
                        }));
                      }
                    } else {
                      // Clear patient info if no appointment selected
                      setFormData(prev => ({
                        ...prev,
                        patientId: '',
                        patientName: ''
                      }));
                    }
                  }}
                >
                  <option value="">Không chọn lịch hẹn cụ thể...</option>
                  {appointments
                    .filter(appt => {
                      // Tạm thời hiển thị tất cả appointments để debug
                      console.log('🔍 All appointments:', appointments.length);
                      console.log('🔍 Current appointment:', { id: appt.id, status: appt.status, hasPatient: !!appt.patientId, patientName: appt.patientName });
                      return true; // Hiển thị tất cả để debug
                    })
                    .map(appointment => (
                      <option key={appointment.id} value={appointment.appointmentId}>
                        {appointment.patientName || 'No name'} - {appointment.startTime ? new Date(appointment.startTime).toLocaleString('vi-VN') : 'No time'} ({appointment.status || 'No status'})
                      </option>
                    ))}
                </Form.Select>
                <small className="text-muted mt-1 d-block">
                  Chọn lịch hẹn để tự động điền thông tin bệnh nhân và tạo hồ sơ bệnh án
                </small>
              </Card.Body>
            </Card>
          )}

          {/* Diagnosis */}
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Chẩn đoán sơ bộ</h6>
                <Button 
                  variant="outline-info" 
                  size="sm"
                  onClick={() => setShowReferralModal(true)}
                  disabled={!formData.patientId && !patientInfo}
                >
                  <Clipboard size={16} className="me-1" />
                  Tạo Chỉ định CLS
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập chẩn đoán sơ bộ (triệu chứng, dấu hiệu lâm sàng...)&#10;Sau khi nhập chẩn đoán, bạn có thể tạo chỉ định cận lâm sàng nếu cần."
                value={formData.diagnosis}
                onChange={(e) => setFormData(prev => ({...prev, diagnosis: e.target.value}))}
              />
              <small className="text-muted mt-2 d-block">
                💡 <strong>Gợi ý:</strong> Nhập triệu chứng ban đầu. Nếu cần xét nghiệm/chẩn đoán hình ảnh, nhấn "Tạo Chỉ định CLS"
              </small>
            </Card.Body>
          </Card>

          {/* Add Medicine */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Thêm thuốc vào đơn</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Chọn thuốc</Form.Label>
                    <Form.Select
                      value={currentMedicine.medicineId}
                      onChange={(e) => {
                        console.log('📝 Selected medicine ID from select:', e.target.value, typeof e.target.value);
                        setCurrentMedicine(prev => ({...prev, medicineId: e.target.value}));
                      }}
                    >
                      <option value="">Chọn thuốc...</option>
                      {filteredMedicines.map(medicine => (
                        <option key={medicine.id} value={medicine.medicineId}>
                          {(medicine.name || 'Không rõ tên')} - {(medicine.category || 'Không rõ loại')}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số lượng</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={currentMedicine.quantity}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Liều dùng</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="VD: 1 viên x 3 lần/ngày"
                      value={currentMedicine.dosage}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, dosage: e.target.value}))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Thời gian sử dụng</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="VD: 7 ngày"
                      value={currentMedicine.duration}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, duration: e.target.value}))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Hướng dẫn sử dụng</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="VD: Uống sau ăn"
                  value={currentMedicine.instructions}
                  onChange={(e) => setCurrentMedicine(prev => ({...prev, instructions: e.target.value}))}
                />
              </Form.Group>

              <Button variant="primary" onClick={handleAddMedicine}>
                <Plus size={18} className="me-1" />
                Thêm thuốc
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          {/* Medicine Search */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">
                <Search size={18} className="me-2" />
                Tìm kiếm thuốc ({filteredMedicines.length} thuốc)
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="position-relative mb-3">
                <Search className="position-absolute" size={18} style={{left: "12px", top: "12px", color: "#6c757d"}} />
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên thuốc, mã thuốc, loại..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{paddingLeft: "45px"}}
                />
                {searchError && (
                  <small className="text-danger mt-1 d-block">{searchError}</small>
                )}
              </div>

              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="mt-2">Đang tải danh sách thuốc...</div>
                </div>
              ) : (
                <div style={{maxHeight: "350px", overflowY: "auto"}}>
                  {filteredMedicines.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <Search size={48} className="mb-3" style={{opacity: 0.3}} />
                      <div>Không tìm thấy thuốc nào</div>
                      <small>Thử từ khóa khác</small>
                    </div>
                  ) : (
                    <>
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map(medicine => {
                          try {
                            return (
                              <div 
                                key={medicine.id || `medicine-${Math.random()}`} 
                                className="border rounded p-3 mb-2 cursor-pointer hover-bg-light" 
                                onClick={() => {
                                  try {
                                    console.log('🖱️ Clicked medicine from search:', medicine.medicineId, typeof medicine.medicineId, medicine.name);
                                    setCurrentMedicine(prev => ({...prev, medicineId: medicine.medicineId}));
                                  } catch (error) {
                                    console.error('❌ Error clicking medicine:', error);
                                  }
                                }}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  border: currentMedicine.medicineId == medicine.medicineId ? '2px solid #007bff' : '1px solid #dee2e6'
                                }}
                                onMouseEnter={(e) => {
                                  try {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                  } catch (error) {
                                    console.error('❌ Error on mouse enter:', error);
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  try {
                                    e.target.style.backgroundColor = 'white';
                                  } catch (error) {
                                    console.error('❌ Error on mouse leave:', error);
                                  }
                                }}
                              >
                        <div className="d-flex justify-content-between">
                          <div style={{flex: 1}}>
                            <div className="fw-bold text-primary">{medicine.name || 'Không rõ tên'}</div>
                            <small className="text-muted d-block">
                              <span className="badge bg-secondary me-1">{medicine.medicineId || 'N/A'}</span>
                              {medicine.category || 'Không rõ loại'} • {medicine.strength || 'N/A'}
                            </small>
                            {medicine.description && (
                              <small className="text-info d-block mt-1">
                                {medicine.description}
                              </small>
                            )}
                          </div>
                          <div className="text-end ms-3">
                            <div className="fw-bold text-success">
                              {(medicine.price || 0).toLocaleString('vi-VN')} ₫
                            </div>
                            <small className="text-muted">/{medicine.unit || 'đơn vị'}</small>
                          </div>
                        </div>
                      </div>
                            );
                          } catch (error) {
                            console.error('❌ Error rendering medicine:', medicine, error);
                            return null;
                          }
                        })
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <Search size={48} className="mb-3" style={{opacity: 0.3}} />
                          <div>Không tìm thấy thuốc nào</div>
                          <small>Thử từ khóa khác</small>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Current Prescription */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <Pill size={18} className="me-2" />
                Đơn thuốc hiện tại ({formData.medicines.length} thuốc)
              </h6>
            </Card.Header>
            <Card.Body>
              {formData.medicines.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <Pill size={48} className="mb-3" style={{opacity: 0.3}} />
                  <div>Chưa có thuốc nào trong đơn</div>
                  <small>Thêm thuốc từ danh sách bên trái</small>
                </div>
              ) : (
                <div style={{maxHeight: "400px", overflowY: "auto"}}>
                  {formData.medicines.map((medicine, index) => (
                    <div key={index} className="border rounded p-2 mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{flex: 1}}>
                          <div className="fw-bold">{medicine.medicineName}</div>
                          <small className="text-muted d-block">
                            Số lượng: {medicine.quantity} {medicine.unit}
                          </small>
                          <small className="text-primary d-block">
                            {medicine.dosage}
                          </small>
                          {medicine.duration && (
                            <small className="text-info d-block">
                              Thời gian: {medicine.duration}
                            </small>
                          )}
                          {medicine.instructions && (
                            <small className="text-success d-block">
                              Hướng dẫn: {medicine.instructions}
                            </small>
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveMedicine(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-3 pt-3 border-top">
                    <div className="fw-bold text-end">
                      Tổng tiền: {formData.medicines.reduce((sum, med) => sum + (med.price || 0), 0).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Clinical Referral Modal */}
      <Modal show={showReferralModal} onHide={() => setShowReferralModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Clipboard size={24} className="me-2 text-info" />
            Tạo Chỉ định Cận Lâm Sàng
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>📋 Thông tin bệnh nhân:</strong> {formData.patientName || patientInfo?.name || 'N/A'}
          </Alert>

          <Form.Group className="mb-3">
            <Form.Label>Chọn khoa thực hiện <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={referralData.toDepartmentId}
              onChange={(e) => setReferralData(prev => ({...prev, toDepartmentId: e.target.value}))}
            >
              <option value="">-- Chọn khoa --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.departmentId || dept.id}>
                  {dept.departmentName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Yêu cầu cận lâm sàng <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Nhập chi tiết yêu cầu xét nghiệm hoặc chẩn đoán hình ảnh...&#10;Ví dụ:&#10;- Xét nghiệm công thức máu&#10;- Chụp X-quang phổi&#10;- Siêu âm bụng tổng quát"
              value={referralData.notes}
              onChange={(e) => setReferralData(prev => ({...prev, notes: e.target.value}))}
            />
          </Form.Group>

          <Alert variant="warning">
            <strong>⚠️ Lưu ý:</strong> Sau khi tạo chỉ định, trạng thái lịch hẹn sẽ chuyển sang "REFERRED". 
            Bệnh nhân sẽ đến khoa được chỉ định để thực hiện xét nghiệm/chẩn đoán.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReferralModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleCreateReferral}>
            <Clipboard size={18} className="me-1" />
            Tạo Chỉ Định
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PrescriptionForm;