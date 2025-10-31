import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Phone, Mail, Calendar, MessageCircle, Award, GraduationCap, Stethoscope } from 'lucide-react';
import doctorApi from '../api/doctorApi';

const DoctorDetail = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getDoctorById(doctorId);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      setError('Không thể tải thông tin bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    navigate(`/patient/booking/${doctorId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin bác sĩ...</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bác sĩ</h2>
          <p className="text-gray-600 mb-4">{error || 'Bác sĩ không tồn tại'}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const doctorName = doctor.name || 
    (doctor.user?.firstName && doctor.user?.lastName ? 
      `${doctor.user.firstName} ${doctor.user.lastName}` : 'Bác sĩ');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Quay lại</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">Chi tiết bác sĩ</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Doctor Info */}
          <div className="lg:col-span-2">
            {/* Doctor Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {doctorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{doctorName}</h2>
                  <p className="text-blue-600 text-lg font-medium mb-4">{doctor.specialty || 'Chuyên khoa'}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (doctor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {doctor.rating ? `${doctor.rating.toFixed(1)} (${doctor.reviewCount || 0} đánh giá)` : 'Chưa có đánh giá'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {doctor.user?.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{doctor.user.phone}</span>
                      </div>
                    )}
                    {doctor.user?.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{doctor.user.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* About Doctor */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Giới thiệu
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {doctor.description || 'Bác sĩ chuyên khoa có nhiều năm kinh nghiệm trong việc chẩn đoán và điều trị các bệnh lý chuyên khoa. Với kiến thức chuyên sâu và tận tâm trong công việc, bác sĩ luôn đặt sức khỏe và sự hài lòng của bệnh nhân lên hàng đầu.'}
              </p>
            </div>

            {/* Education & Experience */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Học vấn & Kinh nghiệm
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Học vấn</h4>
                  <p className="text-gray-600">Tốt nghiệp Đại học Y Hà Nội</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Kinh nghiệm</h4>
                  <p className="text-gray-600">Hơn 10 năm kinh nghiệm trong lĩnh vực chuyên khoa</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Chứng chỉ</h4>
                  <p className="text-gray-600">Chứng chỉ hành nghề y khoa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Book Appointment Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Đặt lịch khám</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Thời gian khám: 30 phút</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Khám tại phòng khám</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="h-4 w-4" />
                  <span>Phí khám: Liên hệ</span>
                </div>
              </div>
              
              <button
                onClick={handleBookAppointment}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Calendar className="h-5 w-5" />
                Đặt lịch khám
              </button>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Liên hệ</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  Nhắn tin
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Phone className="h-4 w-4" />
                  Gọi điện
                </button>
              </div>
            </div>

            {/* Reviews Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Đánh giá</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {doctor.rating ? doctor.rating.toFixed(1) : '0.0'}
                </div>
                <div className="flex items-center justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (doctor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600">
                  {doctor.reviewCount || 0} đánh giá
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;
