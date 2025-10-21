import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import departmentApi from '../../api/departmentApi';



// Image mapping for departments
const departmentImages = {
  "Nội tổng hợp": "/images/noitongquat.jpg",
  "Tim mạch": "/images/timmach.jpg",
  "Hô hấp": "/images/hohap.jpg",
  "Tiêu hóa": "/images/tieuhoa.jpg",
  "Nội thận": "/images/noithan.jpg",
  "Nội tiết": "/images/noitiet.jpg",
  "Nội thần kinh": "/images/noithankinh.jpg",
  "Huyết học": "/images/huyethoc.jpg",
  "Lao & Bệnh phổi": "/images/laobenhphoi.jpg",
  "Truyền nhiễm": "/images/truyennhiem.jpg",
  "Ngoại tổng hợp": "/images/ngoaitongquat.jpg",
  "Ngoại thần kinh": "/images/ngoaithankinh.jpg",
  "Ngoại niệu": "/images/ngoainieu.jpg",
  "Ngoại tiết niệu": "/images/ngoaitietnieu.jpg",
  "Chấn thương chỉnh hình": "/images/chanthuongchinhhinh.jpg",
  "Phẫu thuật tạo hình": "/images/phauthuattaohinh.jpg",
  "Cấp cứu": "/images/capcuu.jpg",
  "Da liễu": "/images/dalieu.jpg",
  "Nhi khoa": "/images/nhikhoa.jpg",
  "Sản phụ khoa": "/images/sanphukhoa.jpg",
  "Tai Mũi Họng": "/images/taimuihong.jpg",
  "Nhãn khoa": "/images/nhankhoa.jpg",
  "Răng Hàm Mặt": "/images/rang-ham-mat.jpg",
  "Lão khoa": "/images/laokhoa.jpg",
  "Nam khoa": "/images/namkhoa.jpg",
  "Vô sinh - Hiếm muộn": "/images/vosinhhiemmuon.jpg",
  "Cơ xương khớp": "/images/co-xuong-khop.jpg",
  "Chẩn đoán hình ảnh": "/images/chuandoanhinhanh.jpg",
  "Xét nghiệm": "/images/xetnguyen.jpg",
  "Gây mê hồi sức": "/images/gaymehoisuc.jpg",
  "Phục hồi chức năng - Vật lý trị liệu": "/images/phuchoichucnang-vatlytrilieu.jpg",
  "Dinh dưỡng": "/images/dinhduong.jpg",
  "Tâm lý": "/images/tamly.jpg",
  "Tâm thần": "/images/tamthan.jpg",
  "Ung bướu": "/images/ungbuou.jpg",
  "Y học cổ truyền": "/images/yhoccotruyen.jpg",
  "Y học dự phòng": "/images/yhocduphong.jpg",
  "Đa khoa": "/images/dakhoa.jpg",
  "Ngôn ngữ trị liệu": "/images/ngonngutrilieu.jpg"
};

const getImageByDepartmentName = (departmentName) => {
  return departmentImages[departmentName] || null;
};

export default function SpecialtiesSection() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      // Try to get departments with metadata first
      let response;
      try {
        response = await departmentApi.getDepartmentsWithMetadata();
      } catch (metadataError) {
        // Fallback to regular API if metadata endpoint doesn't exist
        console.log('Metadata endpoint not available, using regular API');
        response = await departmentApi.getAllDepartmentsList();
      }
      setDepartments(response.data?.content || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };


  const handleSpecialtyClick = (departmentId, departmentName) => {
    navigate(`/specialty/${departmentId}`, { 
      state: { departmentName } 
    });
  };

  const handleViewMore = () => {
    setShowAll(!showAll);
  };

  const displayedDepartments = showAll ? departments : departments.slice(0, 12);

  if (loading) {
    return (
      <section id="specialties" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách chuyên khoa...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="specialties" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Đặt lịch theo chuyên khoa</h2>
            <p className="text-gray-600">Đặt lịch với bác sĩ chuyên khoa hàng đầu</p>
          </div>
          {departments.length > 12 && (
            <button 
              onClick={handleViewMore}
              className="text-blue-600 font-medium hover:underline hidden md:block"
            >
              {showAll ? 'Thu gọn' : 'Xem thêm'} →
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {displayedDepartments.map((department) => {
            const imageUrl = getImageByDepartmentName(department.departmentName);
            return (
              <div
                key={department.id}
                onClick={() => handleSpecialtyClick(department.id, department.departmentName)}
                className="group relative overflow-hidden rounded-xl bg-white transition-all hover:shadow-lg cursor-pointer p-2 text-center"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={department.departmentName}
                        className="w-full h-full object-cover absolute inset-0 z-10"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center z-0" style={{display: imageUrl ? 'none' : 'flex'}}>
                      <span className="text-blue-600 font-bold text-xs">
                        {department.departmentName.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                      <h3 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                        {department.departmentName}
                      </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {departments.length > 12 && (
          <div className="text-center mt-8 md:hidden">
            <button 
              onClick={handleViewMore}
              className="text-blue-600 font-medium hover:underline"
            >
              {showAll ? 'Thu gọn' : 'Xem thêm'} →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
