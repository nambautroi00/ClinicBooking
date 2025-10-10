# Doctor Management - Hướng dẫn sử dụng

## Tổng quan
Tính năng Doctor Management cho phép admin quản lý thông tin bác sĩ trong hệ thống ClinicBooking. Admin có thể tạo, chỉnh sửa, xóa và tìm kiếm bác sĩ từ danh sách users có role Doctor.

## Các chức năng chính

### 1. Xem danh sách bác sĩ
- Hiển thị tất cả bác sĩ với thông tin đầy đủ
- Hiển thị thông tin từ bảng Users và Doctors
- Trạng thái bác sĩ (Active, Inactive, Deleted)

### 2. Tạo bác sĩ mới
- Chọn user từ danh sách users có role Doctor
- Nhập thông tin chuyên khoa và khoa
- Thêm tiểu sử bác sĩ
- Validation đầy đủ

### 3. Chỉnh sửa thông tin bác sĩ
- Cập nhật chuyên khoa
- Thay đổi khoa
- Cập nhật tiểu sử
- Thay đổi trạng thái

### 4. Xóa bác sĩ
- Soft delete (đánh dấu DELETED)
- Xác nhận trước khi xóa
- Cập nhật trạng thái User thành DELETED

### 5. Tìm kiếm và lọc
- Tìm kiếm theo tên hoặc chuyên khoa
- Lọc theo khoa
- Kết hợp tìm kiếm và lọc

## Cách sử dụng

### Truy cập trang Doctor Management
```
http://localhost:3000/admin/doctors
```

### Tạo bác sĩ mới
1. Nhấn nút "Thêm Bác sĩ"
2. Chọn User từ danh sách (chỉ hiển thị users có role Doctor)
3. Chọn khoa
4. Nhập chuyên khoa
5. Nhập tiểu sử (tùy chọn)
6. Nhấn "Tạo Bác sĩ"

### Chỉnh sửa bác sĩ
1. Nhấn nút "Chỉnh sửa" (biểu tượng bút) trên dòng bác sĩ
2. Cập nhật thông tin cần thiết
3. Nhấn "Cập nhật"

### Xóa bác sĩ
1. Nhấn nút "Xóa" (biểu tượng thùng rác) trên dòng bác sĩ
2. Xác nhận xóa trong modal
3. Bác sĩ sẽ được đánh dấu DELETED

## Cấu trúc dữ liệu

### Bảng Users
- id: ID người dùng
- firstName, lastName: Họ tên
- email: Email
- phone: Số điện thoại
- role: Role (phải là Doctor - roleId = 2)
- status: Trạng thái (ACTIVE, INACTIVE, DELETED)

### Bảng Doctors
- doctorId: ID bác sĩ
- userId: Tham chiếu đến Users
- departmentId: ID khoa
- specialty: Chuyên khoa
- bio: Tiểu sử
- status: Trạng thái bác sĩ

### Bảng Departments
- departmentId: ID khoa
- name: Tên khoa
- description: Mô tả khoa

## API Endpoints được sử dụng

### Doctor APIs
- `GET /api/doctors` - Lấy tất cả bác sĩ
- `POST /api/doctors` - Tạo bác sĩ mới
- `PUT /api/doctors/{doctorId}` - Cập nhật bác sĩ
- `DELETE /api/doctors/{doctorId}` - Xóa bác sĩ (soft delete)
- `GET /api/doctors/search?keyword={keyword}` - Tìm kiếm bác sĩ

### User APIs
- `GET /api/users/role/2/with-roles-info` - Lấy users có role Doctor

### Department APIs
- `GET /api/departments` - Lấy tất cả khoa

## Lưu ý quan trọng

1. **Chỉ users có role Doctor mới có thể trở thành bác sĩ**
2. **Mỗi user chỉ có thể có một thông tin bác sĩ**
3. **Xóa bác sĩ sẽ soft delete cả User và Doctor**
4. **Tất cả thao tác đều có validation đầy đủ**
5. **Giao diện responsive và user-friendly**

## Xử lý lỗi

- Hiển thị thông báo lỗi rõ ràng
- Validation form đầy đủ
- Loading states cho tất cả thao tác
- Xử lý lỗi API gracefully

## Cải tiến có thể

1. Thêm chức năng import/export bác sĩ
2. Thêm phân trang cho danh sách lớn
3. Thêm chức năng bulk operations
4. Thêm thống kê bác sĩ
5. Thêm chức năng backup/restore
