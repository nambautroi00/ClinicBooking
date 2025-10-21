import React, { useState, useEffect } from 'react';
import { Video, Clock, Star, User, Search, Filter, Phone, ArrowRight, MapPin, Users, Heart, Stethoscope, Baby, Shield, Brain, Eye, Bone, Activity, Zap, Pill } from 'lucide-react';
import useScrollToTop from '../hooks/useScrollToTop';

const VideoConsultation = () => {
  useScrollToTop(); // Scroll to top when component mounts

  const [doctors, setDoctors] = useState([
    {
      id: 1,
      name: "BS. Nguyễn Văn An",
      specialty: "Tim mạch",
      experience: "15 năm kinh nghiệm",
      rating: 4.9,
      reviews: 234,
      price: "500,000 VNĐ",
      available: true,
      nextAvailable: "14:30 hôm nay",
      avatar: "/api/placeholder/80/80",
      description: "Chuyên gia tim mạch với hơn 15 năm kinh nghiệm, từng làm việc tại Bệnh viện Chợ Rẫy"
    },
    {
      id: 2,
      name: "BS. Trần Thị Bình",
      specialty: "Nhi khoa",
      experience: "12 năm kinh nghiệm",
      rating: 4.8,
      reviews: 189,
      price: "450,000 VNĐ",
      available: false,
      nextAvailable: "09:00 ngày mai",
      avatar: "/api/placeholder/80/80",
      description: "Bác sĩ nhi khoa giàu kinh nghiệm, chuyên điều trị các bệnh lý trẻ em"
    },
    {
      id: 3,
      name: "BS. Lê Minh Cường",
      specialty: "Da liễu",
      experience: "10 năm kinh nghiệm",
      rating: 4.7,
      reviews: 156,
      price: "400,000 VNĐ",
      available: true,
      nextAvailable: "16:00 hôm nay",
      avatar: "/api/placeholder/80/80",
      description: "Chuyên gia da liễu, điều trị các vấn đề về da và thẩm mỹ"
    },
    {
      id: 4,
      name: "BS. Phạm Thị Dung",
      specialty: "Sản phụ khoa",
      experience: "18 năm kinh nghiệm",
      rating: 4.9,
      reviews: 267,
      price: "550,000 VNĐ",
      available: true,
      nextAvailable: "10:30 hôm nay",
      avatar: "/api/placeholder/80/80",
      description: "Bác sĩ sản phụ khoa với nhiều năm kinh nghiệm trong chăm sóc sức khỏe phụ nữ"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const specialties = ["Tim mạch", "Nhi khoa", "Da liễu", "Sản phụ khoa", "Thần kinh", "Tiêu hóa"];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price') return parseInt(a.price.replace(/,/g, '')) - parseInt(b.price.replace(/,/g, ''));
    if (sortBy === 'experience') return b.experience.localeCompare(a.experience);
    return 0;
  });

  const handleBookConsultation = (doctor) => {
    // Logic để đặt lịch tư vấn video
    alert(`Đặt lịch tư vấn video với ${doctor.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <Video className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Bác sĩ Tư vấn Qua Video</h1>
            <p className="text-xl mb-6 text-blue-100">
              Tư vấn sức khỏe trực tuyến với bác sĩ chuyên khoa hàng đầu
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 rounded-lg p-6">
                <Clock className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Tiết kiệm thời gian</h3>
                <p className="text-sm text-blue-100">Không cần di chuyển, tư vấn ngay tại nhà</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <Star className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Bác sĩ uy tín</h3>
                <p className="text-sm text-blue-100">Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <Phone className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Tư vấn 24/7</h3>
                <p className="text-sm text-blue-100">Hỗ trợ tư vấn sức khỏe mọi lúc, mọi nơi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Tìm bác sĩ hoặc chuyên khoa..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Specialty Filter */}
              <div className="md:w-48">
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                >
                  <option value="">Tất cả chuyên khoa</option>
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="md:w-48">
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="price">Giá thấp nhất</option>
                  <option value="experience">Kinh nghiệm</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Bác sĩ có sẵn cho tư vấn video ({filteredDoctors.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map(doctor => (
                <div key={doctor.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Doctor Info */}
                    <div className="flex items-center mb-4">
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        className="w-16 h-16 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{doctor.name}</h3>
                        <p className="text-blue-600 font-medium">{doctor.specialty}</p>
                        <p className="text-sm text-gray-500">{doctor.experience}</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(doctor.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {doctor.rating} ({doctor.reviews} đánh giá)
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {doctor.description}
                    </p>

                    {/* Availability */}
                    <div className="mb-4">
                      {doctor.available ? (
                        <div className="flex items-center text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium">Có sẵn ngay</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-orange-600">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          <span className="text-sm">Sẵn có: {doctor.nextAvailable}</span>
                        </div>
                      )}
                    </div>

                    {/* Price and Book Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-blue-600">{doctor.price}</span>
                        <span className="text-sm text-gray-500 ml-1">/lần tư vấn</span>
                      </div>
                      <button
                        onClick={() => handleBookConsultation(doctor)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          doctor.available
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!doctor.available}
                      >
                        {doctor.available ? 'Đặt tư vấn' : 'Không có sẵn'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDoctors.length === 0 && (
              <div className="text-center py-12">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy bác sĩ</h3>
                <p className="text-gray-600">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VideoConsultation;
