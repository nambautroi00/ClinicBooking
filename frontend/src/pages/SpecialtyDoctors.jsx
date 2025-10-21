import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Calendar, Clock, User, Search, Filter, Users, Heart, Stethoscope, Baby, Shield, Brain, Eye, Bone, Activity, Zap, Pill } from 'lucide-react';
import doctorApi from '../api/doctorApi';
import departmentApi from '../api/departmentApi';
import { getFullAvatarUrl } from '../utils/avatarUtils';
import useScrollToTop from '../hooks/useScrollToTop';

const SpecialtyDoctors = () => {
  useScrollToTop(); // Scroll to top when component mounts
  
  const { departmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Mock data for specialties with images - matching database department names
  const specialties = [
    { name: "Nội tổng hợp", image: "/images/noitongquat.jpg", color: "bg-blue-100 text-blue-600" },
    { name: "Tim mạch", image: "/images/timmach.jpg", color: "bg-pink-100 text-pink-600" },
    { name: "Hô hấp", image: "/images/hohap.jpg", color: "bg-cyan-100 text-cyan-600" },
    { name: "Tiêu hóa", image: "/images/tieuhoa.jpg", color: "bg-green-100 text-green-600" },
    { name: "Nội thận", image: "/images/noithan.jpg", color: "bg-purple-100 text-purple-600" },
    { name: "Nội tiết", image: "/images/noitiet.jpg", color: "bg-yellow-100 text-yellow-600" },
    { name: "Nội thần kinh", image: "/images/noithankinh.jpg", color: "bg-indigo-100 text-indigo-600" },
    { name: "Huyết học", image: "/images/huyethoc.jpg", color: "bg-red-100 text-red-600" },
    { name: "Lao & Bệnh phổi", image: "/images/laobenhphoi.jpg", color: "bg-orange-100 text-orange-600" },
    { name: "Truyền nhiễm", image: "/images/truyennhiem.jpg", color: "bg-red-100 text-red-600" },
    { name: "Ngoại tổng hợp", image: "/images/ngoaitongquat.jpg", color: "bg-cyan-100 text-cyan-600" },
    { name: "Ngoại thần kinh", image: "/images/ngoaithankinh.jpg", color: "bg-indigo-100 text-indigo-600" },
    { name: "Ngoại niệu", image: "/images/ngoainieu.jpg", color: "bg-blue-100 text-blue-600" },
    { name: "Ngoại tiết niệu", image: "/images/ngoaitietnieu.jpg", color: "bg-blue-100 text-blue-600" },
    { name: "Chấn thương chỉnh hình", image: "/images/chanthuongchinhhinh.jpg", color: "bg-purple-100 text-purple-600" },
    { name: "Phẫu thuật tạo hình", image: "/images/phauthuattaohinh.jpg", color: "bg-pink-100 text-pink-600" },
    { name: "Cấp cứu", image: "/images/capcuu.jpg", color: "bg-red-100 text-red-600" },
    { name: "Da liễu", image: "/images/dalieu.jpg", color: "bg-green-100 text-green-600" },
    { name: "Nhi khoa", image: "/images/nhikhoa.jpg", color: "bg-blue-100 text-blue-600" },
    { name: "Sản phụ khoa", image: "/images/sanphukhoa.jpg", color: "bg-pink-100 text-pink-600" },
    { name: "Tai Mũi Họng", image: "/images/taimuihong.jpg", color: "bg-orange-100 text-orange-600" },
    { name: "Nhãn khoa", image: "/images/nhankhoa.jpg", color: "bg-indigo-100 text-indigo-600" },
    { name: "Răng Hàm Mặt", image: "/images/rang-ham-mat.jpg", color: "bg-white-100 text-gray-600" },
    { name: "Lão khoa", image: "/images/laokhoa.jpg", color: "bg-gray-100 text-gray-600" },
    { name: "Nam khoa", image: "/images/namkhoa.jpg", color: "bg-blue-100 text-blue-600" },
    { name: "Vô sinh - Hiếm muộn", image: "/images/vosinhhiemmuon.jpg", color: "bg-pink-100 text-pink-600" },
    { name: "Cơ xương khớp", image: "/images/co-xuong-khop.jpg", color: "bg-purple-100 text-purple-600" },
    { name: "Chẩn đoán hình ảnh", image: "/images/chuandoanhinhanh.jpg", color: "bg-indigo-100 text-indigo-600" },
    { name: "Xét nghiệm", image: "/images/xetnguyen.jpg", color: "bg-green-100 text-green-600" },
    { name: "Gây mê hồi sức", image: "/images/gaymehoisuc.jpg", color: "bg-cyan-100 text-cyan-600" },
    { name: "Phục hồi chức năng - Vật lý trị liệu", image: "/images/phuchoichucnang-vatlytrilieu.jpg", color: "bg-blue-100 text-blue-600" },
    { name: "Dinh dưỡng", image: "/images/dinhuong.jpg", color: "bg-yellow-100 text-yellow-600" },
    { name: "Tâm lý", image: "/images/tamly.jpg", color: "bg-purple-100 text-purple-600" },
    { name: "Tâm thần", image: "/images/tamthan.jpg", color: "bg-indigo-100 text-indigo-600" },
    { name: "Ung bướu", image: "/images/ungbuou.jpg", color: "bg-red-100 text-red-600" },
    { name: "Y học cổ truyền", image: "/images/yhoccotruyen.jpg", color: "bg-orange-100 text-orange-600" },
    { name: "Y học dự phòng", image: "/images/yhocduphong.jpg", color: "bg-green-100 text-green-600" },
    { name: "Đa khoa", image: "/images/dakhoa.jpg", color: "bg-blue-100 text-blue-600" },
    { name: "Ngôn ngữ trị liệu", image: "/images/ngonngutrilieu.jpg", color: "bg-cyan-100 text-cyan-600" }
  ];

  useEffect(() => {
    fetchDepartmentDetails();
    fetchDoctorsByDepartment();
  }, [departmentId]);

  const fetchDepartmentDetails = async () => {
    try {
      const response = await departmentApi.getDepartmentById(departmentId);
      setDepartment(response.data);
    } catch (error) {
      console.error('Error fetching department:', error);
    }
  };

  const fetchDoctorsByDepartment = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getDoctorsByDepartment(departmentId);
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchTerm.toLowerCase();
    const doctorName = doctor.name || 
      (doctor.user?.firstName && doctor.user?.lastName ? 
        `${doctor.user.firstName} ${doctor.user.lastName}` : '');
    const specialty = doctor.specialty || '';
    
    return doctorName.toLowerCase().includes(searchLower) ||
           specialty.toLowerCase().includes(searchLower);
  });

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        const nameA = a.name || `${a.user?.firstName || ''} ${a.user?.lastName || ''}`;
        const nameB = b.name || `${b.user?.firstName || ''} ${b.user?.lastName || ''}`;
        return nameA.localeCompare(nameB);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const handleBookAppointment = (doctorId) => {
    navigate(`/doctor/${doctorId}`);
  };

  const departmentName = department?.departmentName || location.state?.departmentName || 'Chuyên khoa';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách bác sĩ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay lại
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bác sĩ chuyên khoa {departmentName}
            </h1>
            <p className="text-gray-600">
              {department?.description || `Danh sách bác sĩ chuyên khoa ${departmentName}`}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Tìm thấy {sortedDoctors.length} bác sĩ
            </p>
          </div>
        </div>
      </div>

      {/* Specialties Section - Only show when no specific department is selected */}
      {!departmentId && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Chuyên khoa</h2>
                  <p className="text-gray-600 text-lg">Đặt lịch với bác sĩ chuyên khoa hàng đầu</p>
                </div>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Xem thêm →</a>
              </div>

              {/* Specialties Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {specialties.map((specialty, index) => {
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                      onClick={() => navigate(`/specialty/${specialty.name.toLowerCase().replace(/\s+/g, '-')}`)}
                    >
                      {/* Image */}
                      <div className="relative w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-gray-100">
                        <img 
                          src={specialty.image} 
                          alt={specialty.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">
                            {specialty.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Name */}
                      <h3 className="font-semibold text-gray-900 text-center mb-2 text-sm">
                        {specialty.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-500 text-xs text-center leading-relaxed">
                        Khoa {specialty.name} - Chuyên điều trị...
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search and Filter */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bác sĩ theo tên hoặc chuyên khoa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sắp xếp theo tên</option>
                <option value="rating">Sắp xếp theo đánh giá</option>
              </select>
            </div>
          </div>
        </div>

        {/* Doctors List */}
        {sortedDoctors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy bác sĩ
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Không có bác sĩ nào khớp với từ khóa tìm kiếm của bạn.'
                : 'Hiện tại chưa có bác sĩ nào thuộc chuyên khoa này.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:underline"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDoctors.map((doctor) => {
              const doctorName = doctor.name || 
                (doctor.user?.firstName && doctor.user?.lastName ? 
                  `${doctor.user.firstName} ${doctor.user.lastName}` : 'Bác sĩ');
              const avatarUrl = getFullAvatarUrl(doctor.user?.avatarUrl);
              
              return (
                <div
                  key={doctor.doctorId}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  {/* Doctor Avatar */}
                  <div className="p-6 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
                      <img
                        src={avatarUrl}
                        alt={doctorName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=3b82f6&color=fff&size=96`;
                        }}
                      />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {doctorName}
                    </h3>
                    
                    <p className="text-blue-600 font-medium mb-2">
                      {doctor.specialty || departmentName}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-700">
                        {doctor.rating ? doctor.rating.toFixed(1) : 'Chưa có đánh giá'}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({doctor.reviewCount || 0} đánh giá)
                      </span>
                    </div>

                    {/* Experience */}
                    {doctor.experience && (
                      <p className="text-sm text-gray-600 mb-3">
                        {doctor.experience} năm kinh nghiệm
                      </p>
                    )}

                    {/* Bio */}
                    {doctor.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {doctor.bio}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => handleBookAppointment(doctor.doctorId)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Đặt lịch khám
                    </button>
                    
                    <button
                      onClick={() => navigate(`/doctor/${doctor.doctorId}`)}
                      className="w-full mt-2 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialtyDoctors;
