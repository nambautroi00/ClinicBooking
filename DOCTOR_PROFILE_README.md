# Doctor Profile Frontend - Hướng dẫn sử dụng

## Tổng quan
Đã tạo frontend chi tiết hồ sơ bác sĩ với thông tin cá nhân dựa vào `userId`. Hệ thống hiển thị đầy đủ thông tin từ cả `User` và `Doctor` entities.

## Các Component đã tạo

### 1. DoctorProfileDetail.jsx
**Đường dẫn:** `/doctor/{doctorId}`

**Tính năng:**
- Hiển thị thông tin chi tiết bác sĩ dựa trên `doctorId`
- Thông tin cá nhân từ `User` entity (firstName, lastName, email, phone, gender, dateOfBirth, address, createdAt, status)
- Thông tin chuyên môn từ `Doctor` entity (specialty, department, bio, status, createdAt)
- Thống kê (số lịch hẹn, lịch làm việc, đánh giá)
- Các thao tác (chỉnh sửa, xem lịch, tạm khóa/kích hoạt)

### 2. DoctorList.jsx
**Đường dẫn:** `/doctor/list`

**Tính năng:**
- Danh sách tất cả bác sĩ với card layout
- Tìm kiếm theo tên, chuyên khoa
- Lọc theo khoa
- Hiển thị thông tin tóm tắt
- Link đến chi tiết từng bác sĩ

### 3. DoctorDemo.jsx
**Đường dẫn:** `/doctor/demo`

**Tính năng:**
- Demo component để test API
- Hiển thị tất cả thông tin bác sĩ
- Hướng dẫn sử dụng
- Thống kê API endpoints

### 4. doctorApi.js
**Đường dẫn:** `/src/api/doctorApi.js`

**Tính năng:**
- Service API để gọi backend
- Các method: getAllDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor, etc.
- Tích hợp với axiosClient

## API Endpoints sử dụng

### GET /api/doctors
- **Mô tả:** Lấy danh sách tất cả bác sĩ
- **Response:** Array of Doctor objects với User relationship

### GET /api/doctors/{doctorId}
- **Mô tả:** Lấy thông tin chi tiết bác sĩ theo ID
- **Response:** Doctor object với đầy đủ User và Department relationship

### GET /api/departments
- **Mô tả:** Lấy danh sách khoa để filter
- **Response:** Array of Department objects

## Dữ liệu hiển thị

### Thông tin User (từ userId)
```json
{
  "id": 1,
  "email": "doctor@example.com",
  "firstName": "Nguyễn Văn",
  "lastName": "Bác sĩ",
  "phone": "0987654321",
  "gender": "MALE",
  "dateOfBirth": "1985-01-01",
  "address": "Hà Nội",
  "createdAt": "2024-01-01T00:00:00",
  "status": "ACTIVE"
}
```

### Thông tin Doctor
```json
{
  "doctorId": 1,
  "specialty": "Tim mạch",
  "bio": "Bác sĩ chuyên khoa tim mạch với 10 năm kinh nghiệm",
  "status": "ACTIVE",
  "createdAt": "2024-01-01",
  "department": {
    "id": 1,
    "departmentName": "Tim mạch"
  },
  "appointments": [...],
  "schedules": [...],
  "reviews": [...]
}
```

## Cách sử dụng

### 1. Xem danh sách bác sĩ
```
http://localhost:3000/doctor/list
```

### 2. Xem chi tiết bác sĩ
```
http://localhost:3000/doctor/1
```
(Thay `1` bằng doctorId thực tế)

### 3. Demo component
```
http://localhost:3000/doctor/demo
```

## Navigation

Đã thêm vào DoctorSidebar:
- "Danh sách bác sĩ" - `/doctor/list`
- "Demo" - `/doctor/demo`

## Responsive Design

- **Mobile:** Grid 1 cột
- **Tablet:** Grid 2 cột  
- **Desktop:** Grid 3 cột
- Sử dụng Tailwind CSS classes

## Error Handling

- Loading states với spinner
- Error messages với alert components
- Empty states khi không có dữ liệu
- Try-catch cho tất cả API calls

## Status Badges

- **ACTIVE:** Xanh lá (Hoạt động)
- **INACTIVE:** Xám (Không hoạt động)  
- **DELETED:** Đỏ (Đã xóa)
- **SUSPENDED:** Vàng (Tạm khóa)

## Lưu ý kỹ thuật

1. **API Integration:** Sử dụng doctorApi service thay vì axios trực tiếp
2. **State Management:** useState và useEffect cho local state
3. **Routing:** React Router với dynamic routes
4. **Styling:** Tailwind CSS với responsive design
5. **Data Flow:** Component → API Service → Backend → Database

## Testing

Để test các tính năng:

1. **Khởi động backend:** `mvn spring-boot:run`
2. **Khởi động frontend:** `npm start`
3. **Truy cập:** `http://localhost:3000/doctor/demo`
4. **Test navigation:** Click vào "Xem chi tiết" của bất kỳ bác sĩ nào

## Troubleshooting

### Lỗi thường gặp:

1. **"Lỗi khi tải thông tin bác sĩ"**
   - Kiểm tra backend có chạy không
   - Kiểm tra doctorId có tồn tại không

2. **"Không tìm thấy thông tin bác sĩ"**
   - DoctorId không tồn tại trong database
   - Relationship User-Doctor bị lỗi

3. **"User ID trống"**
   - Doctor entity không có relationship với User
   - Lazy loading không hoạt động đúng

## Kết luận

Frontend đã được tạo hoàn chỉnh với:
- ✅ Hiển thị thông tin User dựa trên userId
- ✅ Hiển thị thông tin Doctor dựa trên doctorId  
- ✅ Responsive design
- ✅ Error handling
- ✅ API integration
- ✅ Navigation
- ✅ Demo component để test

Tất cả thông tin cá nhân của bác sĩ đều được lấy từ `User` entity thông qua relationship với `Doctor` entity.
