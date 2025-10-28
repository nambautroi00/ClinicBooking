import React, { useState, useEffect } from "react";
import { Search, ArrowRight, Star, MapPin, Clock, Users, Heart, Stethoscope, Baby, Shield, Brain, Eye, Bone, Activity, Zap, Pill } from "lucide-react";
import { Link } from "react-router-dom";
import doctorApi from "../../api/doctorApi";
import departmentApi from "../../api/departmentApi";
import reviewApi from "../../api/reviewApi";

export default function PatientAppointmentBooking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]); // Store all doctors for filtering
  const [featuredDoctors, setFeaturedDoctors] = useState([]); // Store featured doctors
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("doctor");
  const [showAllDoctors, setShowAllDoctors] = useState(false); // Control whether to show all or featured

  // Mock data for specialties
  const specialties = [
    { name: "Nhi khoa", icon: Baby, color: "bg-blue-100 text-blue-600" },
    { name: "Sản phụ khoa", icon: Heart, color: "bg-pink-100 text-pink-600" },
    { name: "Da liễu", icon: Shield, color: "bg-green-100 text-green-600" },
    { name: "Tiêu hoá", icon: Stethoscope, color: "bg-yellow-100 text-yellow-600" },
    { name: "Cơ xương khớp", icon: Bone, color: "bg-purple-100 text-purple-600" },
    { name: "Dị ứng - miễn dịch", icon: Shield, color: "bg-indigo-100 text-indigo-600" },
    { name: "Gây mê hồi sức", icon: Activity, color: "bg-cyan-100 text-cyan-600" },
    { name: "Tai - mũi - họng", icon: Eye, color: "bg-orange-100 text-orange-600" },
    { name: "Ung bướu", icon: Activity, color: "bg-red-100 text-red-600" },
    { name: "Tim mạch", icon: Heart, color: "bg-pink-100 text-pink-600" },
    { name: "Lão khoa", icon: Users, color: "bg-gray-100 text-gray-600" },
    { name: "Chấn thương chỉnh hình", icon: Bone, color: "bg-purple-100 text-purple-600" }
  ];

  // Function to select featured doctors (top 6-8 doctors)
  const selectFeaturedDoctors = (allDoctorsList) => {
    // Priority specialties for featured doctors
    const prioritySpecialties = [
      'Noi tong hop', 'Tim mach', 'Ho hap', 'Tieu hoa', 
      'Than kinh', 'Ngoai tong hop', 'San phu khoa', 'Nhi khoa'
    ];
    
    // Sort doctors by priority specialty and rating
    const sortedDoctors = allDoctorsList.sort((a, b) => {
      const aPriority = prioritySpecialties.includes(a.specialty) ? 1 : 0;
      const bPriority = prioritySpecialties.includes(b.specialty) ? 1 : 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Priority specialties first
      }
      
      return b.rating - a.rating; // Higher rating first
    });
    
    // Take top 6 doctors as featured
    return sortedDoctors.slice(0, 6);
  };

  useEffect(() => {
    // Load doctors and departments from API
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch doctors from API
        const doctorsResponse = await doctorApi.getAllDoctors();
        if (doctorsResponse.data) {
          const rawDocs = doctorsResponse.data;

          // Fetch avg rating and review count for each doctor (best-effort)
          const ratingPromises = rawDocs.map(async (d) => {
            try {
              const avg = await reviewApi.getAverageRatingByDoctor(d.doctorId || d.id);
              const count = await reviewApi.getReviewCountByDoctor(d.doctorId || d.id);
              return { doctorId: d.doctorId || d.id, avg: Number(avg || 0), count: Number(count || 0) };
            } catch (e) {
              return { doctorId: d.doctorId || d.id, avg: 0, count: 0 };
            }
          });

          const ratings = await Promise.all(ratingPromises);
          const ratingMap = {};
          ratings.forEach(r => { ratingMap[r.doctorId] = r; });

          // Transform API data to match our component structure and include ratings
          const transformedDoctors = rawDocs.map(doctor => {
            const id = doctor.doctorId || doctor.id;
            const r = ratingMap[id] || { avg: 0, count: 0 };
            return {
              id,
              name: `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim(),
              specialty: doctor.specialty || 'Chưa cập nhật',
              rating: r.count > 0 ? r.avg : 0,
              reviewCount: r.count || 0,
              avatar: doctor.user?.avatarUrl || '/api/placeholder/150/150',
              experience: `${doctor.experience || 'Nhiều'} năm kinh nghiệm`,
              department: doctor.department?.departmentName || 'Chưa phân khoa'
            };
          });

          setAllDoctors(transformedDoctors); // Store all doctors

          // Select featured doctors
          const featured = selectFeaturedDoctors(transformedDoctors);
          setFeaturedDoctors(featured);

          // Display featured doctors initially
          setDoctors(featured);
        }
        
        // Set specialties (static data for now)
        setDepartments(specialties);
      } catch (error) {
        console.error("Error loading data:", error);
        setDepartments(specialties);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const searchResponse = await doctorApi.searchDoctors(searchQuery);
      if (searchResponse.data) {
        const transformedDoctors = searchResponse.data.map(doctor => ({
          id: doctor.doctorId || doctor.id,
          name: `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim(),
          specialty: doctor.specialty || 'Chưa cập nhật',
          rating: 4.5,
          avatar: doctor.user?.avatarUrl || '/api/placeholder/150/150',
          experience: `${doctor.experience || 'Nhiều'} năm kinh nghiệm`,
          department: doctor.department?.departmentName || 'Chưa phân khoa'
        }));
        setDoctors(transformedDoctors);
      }
    } catch (error) {
      console.error("Error searching doctors:", error);
      // Keep current doctors list on search error
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyClick = (specialtyName) => {
    // Filter doctors by specialty
    const filteredDoctors = allDoctors.filter(doctor => 
      doctor.specialty.toLowerCase().includes(specialtyName.toLowerCase())
    );
    setDoctors(filteredDoctors);
  };

  const handleShowAllDoctors = () => {
    if (showAllDoctors) {
      // If currently showing all, go back to featured
      setDoctors(featuredDoctors);
      setShowAllDoctors(false);
    } else {
      // If currently showing featured, show all
      setDoctors(allDoctors);
      setShowAllDoctors(true);
    }
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Content - 60% */}
            <div className="lg:col-span-3 space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Đặt khám bác sĩ
                </h1>
                <p className="text-lg md:text-xl text-blue-100 leading-relaxed">
                  Đặt khám với hơn 1000 bác sĩ đã kết nối chính thức với Medicare để có số thứ tự và khung giờ khám trước
                </p>
              </div>  
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Triệu chứng, bác sĩ, bệnh viện..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-lg"
                  />
                </div>
              </form>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>1000+ Bác sĩ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>50+ Chuyên khoa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>24/7 Hỗ trợ</span>
                </div>
              </div>
            </div>

            {/* Right Content - Family Image - 40% */}
            <div className="lg:col-span-2 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Main Family Image */}
                <div className="relative">
                  <div className="w-80 h-80 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20 overflow-hidden shadow-2xl group hover:shadow-3xl transition-all duration-300 hover:scale-105">
                    <img 
                      src="/images/family.jpg" 
                      alt="Gia đình khỏe mạnh" 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center text-8xl" style={{display: 'none'}}>
                      👨‍👩‍👧‍👦
                    </div>
                    
                    {/* Overlay gradient for better text readability if needed */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-white-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-2xl">💊</span>
                  </div>
                  
                </div>

                {/* Background decorative elements */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"></div>
                  <div className="absolute bottom-10 right-10 w-24 h-24 bg-green-500/20 rounded-full blur-xl"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Doctors Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {showAllDoctors ? 'Tất cả bác sĩ' : 'Bác sĩ tiêu biểu'}
              </h2>
              {!showAllDoctors && (
                <p className="text-gray-600 text-sm mt-1">
                  Chọn từ {featuredDoctors.length} bác sĩ được đánh giá cao nhất
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {showAllDoctors ? (
                <button 
                  onClick={handleShowAllDoctors}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors duration-200"
                >
                  Thu gọn
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 rotate-180" />
                </button>
              ) : (
                <Link
                  to="/patient/doctors"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors duration-200"
                >
                  Xem thêm
                  <ArrowRight className="h-4 w-4 transition-transform duration-200" />
                </Link>
              )}
            </div>
          </div>

          {/* Doctors Carousel */}
          <div className="relative">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Đang tải danh sách bác sĩ...</span>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">Không tìm thấy bác sĩ</div>
                <div className="text-gray-400">Vui lòng thử lại với từ khóa khác</div>
              </div>
            ) : (
              <div className={showAllDoctors ? 
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : 
                "flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
              }>
                {doctors.map((doctor) => (
                <div key={doctor.id} className={`${showAllDoctors ? 
                  "bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group" :
                  "flex-shrink-0 w-64 bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                }`}>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden relative flex items-center justify-center bg-gray-200 group-hover:bg-blue-100 transition-colors duration-300">
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.style.display = 'none'; // Hide the broken image
                          const fallbackSpan = e.target.nextElementSibling; // Get the sibling span
                          if (fallbackSpan) {
                            fallbackSpan.style.display = 'flex'; // Show the emoji
                          }
                        }}
                      />
                      {/* Fallback emoji, initially hidden if doctor.avatar exists */}
                      <span
                        className="text-2xl group-hover:scale-110 transition-transform duration-300 absolute"
                        style={{ display: doctor.avatar && doctor.avatar !== '/api/placeholder/150/150' ? 'none' : 'flex' }}
                      >
                        👨‍⚕️
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-sm group-hover:text-blue-600 transition-colors duration-300">{doctor.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 group-hover:text-gray-800 transition-colors duration-300">{doctor.specialty}</p>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{doctor.rating}</span>
                    </div>
                    <Link 
                      to={`/patient/booking/${doctor.id}`}
                      className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md no-underline hover:no-underline"
                    >
                      Đặt lịch ngay <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Specialties Section */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đa dạng chuyên khoa khám</h2>
            <p className="text-gray-600">Đặt khám dễ dàng và tiện lợi hơn với đầy đủ các chuyên khoa</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((specialty, index) => (
              <button
                key={index}
                onClick={() => handleSpecialtyClick(specialty.name)}
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow group w-full"
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-lg ${specialty.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <specialty.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-900">{specialty.name}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}