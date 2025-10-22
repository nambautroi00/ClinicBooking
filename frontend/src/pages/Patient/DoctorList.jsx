import React, { useState, useEffect } from "react";
import { Search, MapPin, Filter, Star, Calendar, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import doctorApi from "../../api/doctorApi";

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Available specialties
  const specialties = [
    "Noi tong hop", "Tim mach", "Ho hap", "Tieu hoa", "Than - Tiet nieu",
    "Noi tiet", "Than kinh", "Ngoai tong hop", "Chan thuong chinh hinh",
    "Ngoai than kinh", "Ngoai tieu hoa", "Ngoai long nguc", "San phu khoa",
    "Nhi khoa", "Chan doan hinh anh", "Xet nghiem", "Giai phau benh",
    "Da lieu", "Tai - Mui - Hong", "Rang - Ham - Mat", "Mat",
    "Co - Xuong - Khop", "Ung buou", "Phuc hoi chuc nang", "Dinh duong",
    "Tam ly - Tam than", "Cap cuu", "Kiem soat nhiem khuan", "Duoc", "Hanh chinh"
  ];

  // Mock areas (you can replace with real data)
  const areas = [
    "Quan 1", "Quan 2", "Quan 3", "Quan 4", "Quan 5", "Quan 6", "Quan 7", "Quan 8",
    "Quan 9", "Quan 10", "Quan 11", "Quan 12", "Thu Duc", "Binh Thanh", "Tan Binh",
    "Phu Nhuan", "Go Vap", "Tan Phu", "Hoc Mon", "Cu Chi", "Binh Chanh", "Nha Be", "Can Gio"
  ];

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, selectedSpecialty, selectedArea, sortBy, doctors]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getAllDoctors();
      if (response.data) {
        const transformedDoctors = response.data.map(doctor => ({
          id: doctor.doctorId || doctor.id,
          name: `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim(),
          specialty: doctor.specialty || 'Chưa cập nhật',
          rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
          avatar: doctor.user?.avatarUrl || '/api/placeholder/150/150',
          experience: doctor.experience || Math.floor(Math.random() * 20) + 5,
          department: doctor.department?.departmentName || 'Chưa phân khoa',
          address: generateMockAddress(), // Mock address for now
          degree: generateMockDegree(), // Mock degree
          availableSlots: Math.floor(Math.random() * 10) + 1,
          nextAvailable: generateNextAvailable()
        }));
        setDoctors(transformedDoctors);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAddress = () => {
    const streets = ["Nguyen Chi Thanh", "Nguyen Trai", "Nguyen Van Dau", "Le Van Viet", "Dien Bien Phu"];
    const districts = ["Quan 1", "Quan 2", "Quan 3", "Quan 10", "Quan Phu Nhuan"];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const number = Math.floor(Math.random() * 500) + 1;
    return `${number} ${street}, ${district}, Ho Chi Minh`;
  };

  const generateMockDegree = () => {
    const degrees = ["TS. BS", "PGS. TS. BS", "ThS. BS", "BS", "BS.CKII", "BS.CKI"];
    return degrees[Math.floor(Math.random() * degrees.length)];
  };

  const generateNextAvailable = () => {
    const days = ["Hôm nay", "Ngày mai", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"];
    return days[Math.floor(Math.random() * days.length)];
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by specialty
    if (selectedSpecialty) {
      filtered = filtered.filter(doctor =>
        doctor.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
      );
    }

    // Filter by area
    if (selectedArea) {
      filtered = filtered.filter(doctor =>
        doctor.address.toLowerCase().includes(selectedArea.toLowerCase())
      );
    }

    // Sort doctors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return b.rating - a.rating;
        case "experience":
          return b.experience - a.experience;
        case "available":
          return a.availableSlots - b.availableSlots;
        default:
          return 0;
      }
    });

    setFilteredDoctors(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterDoctors();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty("");
    setSelectedArea("");
    setSortBy("name");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
                ← Quay về trang chủ
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Danh sách bác sĩ</h1>
            </div>
            <div className="text-sm text-gray-600">
              Tìm thấy {filteredDoctors.length} kết quả
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm theo triệu chứng, bác sĩ, bệnh viện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Nơi khám:</span>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả chuyên khoa</option>
                {specialties.map((specialty, index) => (
                  <option key={index} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả khu vực</option>
                {areas.map((area, index) => (
                  <option key={index} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sắp xếp theo tên</option>
                <option value="rating">Sắp xếp theo đánh giá</option>
                <option value="experience">Sắp xếp theo kinh nghiệm</option>
                <option value="available">Sắp xếp theo lịch trống</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Doctors List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Đang tải danh sách bác sĩ...</span>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">Không tìm thấy bác sĩ</div>
              <div className="text-gray-400">Vui lòng thử lại với từ khóa khác</div>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-6">
                  {/* Doctor Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="text-3xl" style={{display: 'none'}}>
                        👨‍⚕️
                      </div>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {doctor.degree} {doctor.name}
                        </h3>
                        
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-gray-700">{doctor.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">{doctor.experience} năm kinh nghiệm</span>
                        </div>

                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {doctor.specialty.split(',').map((spec, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {spec.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{doctor.address}</span>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Có lịch {doctor.nextAvailable}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{doctor.availableSlots} khung giờ trống</span>
                          </div>
                        </div>
                      </div>

                      {/* Book Button */}
                      <div className="flex-shrink-0 ml-4">
                        <Link
                          to={`/patient/booking/${doctor.id}`}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          Đặt khám
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button (if needed) */}
        {filteredDoctors.length > 0 && filteredDoctors.length >= 20 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200">
              Xem thêm bác sĩ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
