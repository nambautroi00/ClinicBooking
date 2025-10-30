-- ===========================================================
-- COMPLETE INSERT STATEMENTS FOR CLINIC BOOKING DATABASE
-- ===========================================================
Create database CLINIC
USE CLINIC;
GO

-- ===========================================================
-- 1. ROLES (Quyền người dùng)
-- ===========================================================
INSERT INTO Roles (Name, Description) VALUES 
('Admin', N'Quản trị hệ thống'),
('Doctor', N'Bác sĩ có thể khám, tạo lịch trình, quản lý bệnh án'),
('Patient', N'Bệnh nhân có thể đặt lịch và trò chuyện với bác sĩ');

-- ===========================================================
-- 2. DEPARTMENTS (Khoa)
-- ===========================================================
-- Xóa các bản ghi liên quan trước
DELETE FROM Appointments WHERE DoctorID IN (SELECT DoctorID FROM Doctors);
DELETE FROM DoctorSchedules WHERE DoctorID IN (SELECT DoctorID FROM Doctors);
DELETE FROM Doctors;
DELETE FROM Departments;
DBCC CHECKIDENT ('Departments', RESEED, 0);

INSERT INTO Departments (department_name, Description, Status) VALUES
-- Nhóm Nội khoa
(N'Nội tổng hợp', N'Khoa Nội tổng hợp - Khám và điều trị các bệnh lý nội khoa thường gặp', 'ACTIVE'),
(N'Tim mạch', N'Khoa Tim mạch - Chuyên điều trị các bệnh về tim và mạch máu', 'ACTIVE'),
(N'Hô hấp', N'Khoa Hô hấp - Chuyên điều trị các bệnh lý phổi và đường hô hấp', 'ACTIVE'),
(N'Tiêu hóa', N'Khoa Tiêu hóa - Chuyên điều trị các bệnh về dạ dày, gan, mật và ruột', 'ACTIVE'),
(N'Thận - Tiết niệu', N'Khoa Thận - Tiết niệu - Điều trị bệnh thận và hệ tiết niệu', 'ACTIVE'),
(N'Nội tiết', N'Khoa Nội tiết - Điều trị bệnh đái tháo đường, tuyến giáp và rối loạn chuyển hóa', 'ACTIVE'),
(N'Thần kinh', N'Khoa Thần kinh - Điều trị các bệnh về thần kinh trung ương và ngoại biên', 'ACTIVE'),

-- Nhóm Ngoại khoa
(N'Ngoại tổng hợp', N'Khoa Ngoại tổng hợp - Thực hiện phẫu thuật các bệnh lý ngoại khoa', 'ACTIVE'),
(N'Chấn thương chỉnh hình', N'Khoa Chấn thương chỉnh hình - Điều trị gãy xương, trật khớp và phẫu thuật chỉnh hình', 'ACTIVE'),
(N'Ngoại thần kinh', N'Khoa Ngoại thần kinh - Phẫu thuật điều trị các bệnh lý hệ thần kinh', 'ACTIVE'),
(N'Ngoại tiêu hóa', N'Khoa Ngoại tiêu hóa - Phẫu thuật các bệnh dạ dày, ruột, gan, mật', 'ACTIVE'),
(N'Ngoại lồng ngực', N'Khoa Ngoại lồng ngực - Phẫu thuật tim, phổi và mạch máu lớn', 'ACTIVE'),

-- Nhóm Sản - Nhi - Phụ
(N'Sản phụ khoa', N'Khoa Sản phụ khoa - Chăm sóc sức khỏe sinh sản và thai sản', 'ACTIVE'),
(N'Nhi khoa', N'Khoa Nhi - Khám và điều trị cho trẻ em', 'ACTIVE'),

-- Nhóm Cận lâm sàng
(N'Chẩn đoán hình ảnh', N'Khoa Chẩn đoán hình ảnh - Siêu âm, X-quang, CT, MRI', 'ACTIVE'),
(N'Xét nghiệm', N'Khoa Xét nghiệm - Thực hiện các xét nghiệm máu, nước tiểu, sinh hóa', 'ACTIVE'),
(N'Giải phẫu bệnh', N'Khoa Giải phẫu bệnh - Phân tích mô bệnh học và tế bào học', 'ACTIVE'),

-- Nhóm Khám chuyên khoa sâu
(N'Da liễu', N'Khoa Da liễu - Điều trị các bệnh về da, tóc và móng', 'ACTIVE'),
(N'Tai - Mũi - Họng', N'Khoa Tai - Mũi - Họng - Khám và điều trị các bệnh đường hô hấp trên', 'ACTIVE'),
(N'Răng - Hàm - Mặt', N'Khoa Răng - Hàm - Mặt - Khám và điều trị răng miệng', 'ACTIVE'),
(N'Mắt', N'Khoa Mắt - Khám và điều trị bệnh lý về mắt', 'ACTIVE'),
(N'Cơ - Xương - Khớp', N'Khoa Cơ - Xương - Khớp - Điều trị thoái hóa khớp, viêm khớp, loãng xương', 'ACTIVE'),
(N'Ung bướu', N'Khoa Ung bướu - Điều trị ung thư và các khối u ác tính', 'ACTIVE'),

-- Nhóm Hỗ trợ điều trị
(N'Phục hồi chức năng', N'Khoa Phục hồi chức năng - Tập vật lý trị liệu, phục hồi sau phẫu thuật', 'ACTIVE'),
(N'Dinh dưỡng', N'Khoa Dinh dưỡng - Tư vấn và xây dựng chế độ ăn cho bệnh nhân', 'ACTIVE'),
(N'Tâm lý - Tâm thần', N'Khoa Tâm lý - Tâm thần - Hỗ trợ điều trị rối loạn tâm lý và tâm thần', 'ACTIVE'),

-- Nhóm Quản lý & Hành chính
(N'Cấp cứu', N'Khoa Cấp cứu - Tiếp nhận và xử lý bệnh nhân cấp cứu 24/7', 'ACTIVE'),
(N'Kiểm soát nhiễm khuẩn', N'Khoa Kiểm soát nhiễm khuẩn - Đảm bảo vệ sinh và an toàn trong bệnh viện', 'ACTIVE'),
(N'Dược', N'Khoa Dược - Quản lý thuốc và vật tư y tế', 'ACTIVE'),
(N'Hành chính', N'Phòng Hành chính - Quản lý hồ sơ, nhân sự và hành chính bệnh viện', 'ACTIVE');


-- ===========================================================
-- 3. USERS (Người dùng)
-- ===========================================================

-- Admin users
INSERT INTO users (Email, password_hash, first_name, last_name, Phone, gender, DOB, Address, RoleID, Status, created_at) VALUES 
('admin@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'System', N'Admin', '0123456789', 'MALE', '1980-01-01', N'Hà Nội', 1, 'ACTIVE', GETDATE()),
('admin2@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Quản', N'Trị', '0123456788', 'FEMALE', '1985-03-15', N'TP.HCM', 1, 'ACTIVE', GETDATE());

-- Doctor users
INSERT INTO users(Email, password_hash, first_name, last_name, Phone, Gender, DOB, Address, RoleID, Status, created_at) VALUES 
('doctor1@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Hùng', N'Nguyễn Văn', '0987654321', 'MALE', '1975-05-10', N'TP.HCM', 2, 'ACTIVE', GETDATE()),
('doctor2@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Lan', N'Trần Thị', '0977777777', 'FEMALE', '1982-08-15', N'Đà Nẵng', 2, 'ACTIVE', GETDATE()),
('doctor3@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Minh', N'Lê Văn', '0966666666', 'MALE', '1980-12-20', N'Hà Nội', 2, 'ACTIVE', GETDATE()),
('doctor4@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Hoa', N'Phạm Thị', '0955555555', 'FEMALE', '1978-07-08', N'Cần Thơ', 2, 'ACTIVE', GETDATE()),
('doctor5@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Tuấn', N'Hoàng Văn', '0944444444', 'MALE', '1985-04-25', N'Hải Phòng', 2, 'ACTIVE', GETDATE()),
('doctor6@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Minh', N'Nguyễn Văn', '0987654006', 'MALE', '1975-03-15', N'Hà Nội', 2, 'ACTIVE', GETDATE()),
('doctor7@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Lan', N'Trần Thị', '0987654007', 'FEMALE', '1980-07-20', N'TP.HCM', 2, 'ACTIVE', GETDATE()),
('doctor8@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Hùng', N'Lê Văn', '0987654008', 'MALE', '1978-11-10', N'Đà Nẵng', 2, 'ACTIVE', GETDATE()),
('doctor9@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Hoa', N'Phạm Thị', '0987654009', 'FEMALE', '1982-05-25', N'Cần Thơ', 2, 'ACTIVE', GETDATE()),
('doctor10@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Tuấn', N'Hoàng Văn', '0987654010', 'MALE', '1976-09-12', N'Hải Phòng', 2, 'ACTIVE', GETDATE()),
('doctor11@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Mai', N'Nguyễn Thị', '0987654011', 'FEMALE', '1981-02-18', N'Vũng Tàu', 2, 'ACTIVE', GETDATE()),
('doctor12@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Nam', N'Trần Văn', '0987654012', 'MALE', '1979-08-30', N'Bình Dương', 2, 'ACTIVE', GETDATE()),
('doctor13@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Thu', N'Lê Thị', '0987654013', 'FEMALE', '1983-12-05', N'Đồng Nai', 2, 'ACTIVE', GETDATE()),
('doctor14@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Long', N'Phạm Văn', '0987654014', 'MALE', '1977-04-22', N'An Giang', 2, 'ACTIVE', GETDATE()),
('doctor15@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'An', N'Hoàng Thị', '0987654015', 'FEMALE', '1984-10-14', N'Kiên Giang', 2, 'ACTIVE', GETDATE()),
('doctor16@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Bình', N'Nguyễn Văn', '0987654016', 'MALE', '1980-06-08', N'Long An', 2, 'ACTIVE', GETDATE()),
('doctor17@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Chi', N'Trần Thị', '0987654017', 'FEMALE', '1978-01-16', N'Tiền Giang', 2, 'ACTIVE', GETDATE()),
('doctor18@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Dũng', N'Lê Văn', '0987654018', 'MALE', '1982-03-28', N'Bến Tre', 2, 'ACTIVE', GETDATE()),
('doctor19@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Em', N'Phạm Thị', '0987654019', 'FEMALE', '1985-07-11', N'Trà Vinh', 2, 'ACTIVE', GETDATE()),
('doctor20@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Giang', N'Hoàng Văn', '0987654020', 'MALE', '1979-11-03', N'Sóc Trăng', 2, 'ACTIVE', GETDATE()),
('doctor21@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Hạnh', N'Nguyễn Thị', '0987654021', 'FEMALE', '1981-09-19', N'Bạc Liêu', 2, 'ACTIVE', GETDATE()),
('doctor22@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Inh', N'Trần Văn', '0987654022', 'MALE', '1977-05-26', N'Cà Mau', 2, 'ACTIVE', GETDATE()),
('doctor23@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Khoa', N'Lê Thị', '0987654023', 'FEMALE', '1983-12-13', N'Bình Phước', 2, 'ACTIVE', GETDATE()),
('doctor24@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Lâm', N'Phạm Văn', '0987654024', 'MALE', '1980-08-07', N'Tây Ninh', 2, 'ACTIVE', GETDATE()),
('doctor25@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Minh', N'Hoàng Thị', '0987654025', 'FEMALE', '1984-04-21', N'Bình Thuận', 2, 'ACTIVE', GETDATE()),
('doctor26@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Nam', N'Nguyễn Văn', '0987654026', 'MALE', '1978-10-15', N'Ninh Thuận', 2, 'ACTIVE', GETDATE()),
('doctor27@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Oanh', N'Trần Thị', '0987654027', 'FEMALE', '1982-02-09', N'Khánh Hòa', 2, 'ACTIVE', GETDATE()),
('doctor28@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Phúc', N'Lê Văn', '0987654028', 'MALE', '1976-06-17', N'Phú Yên', 2, 'ACTIVE', GETDATE()),
('doctor29@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Quỳnh', N'Phạm Thị', '0987654029', 'FEMALE', '1985-01-24', N'Bình Định', 2, 'ACTIVE', GETDATE()),
('doctor30@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Rồng', N'Hoàng Văn', '0987654030', 'MALE', '1979-03-31', N'Quảng Nam', 2, 'ACTIVE', GETDATE()),
('doctor31@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Sơn', N'Nguyễn Văn', '0987654031', 'MALE', '1981-11-12', N'Quảng Ngãi', 2, 'ACTIVE', GETDATE()),
('doctor32@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Thảo', N'Trần Thị', '0987654032', 'FEMALE', '1983-08-25', N'Quảng Trị', 2, 'ACTIVE', GETDATE());

-- Patient users
INSERT INTO users (Email, password_hash, first_name, last_name, Phone, Gender, DOB, Address, RoleID, Status, created_at) VALUES 
('patient1@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'An', N'Phạm Văn', '0911111111', 'MALE', '2000-03-20', N'Hà Nội', 3, 'ACTIVE', GETDATE()),
('patient2@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Hoa', N'Ngô Thị', '0922222222', 'FEMALE', '1995-07-12', N'TP.HCM', 3, 'ACTIVE', GETDATE()),
('patient3@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Long', N'Trần Văn', '0933333333', 'MALE', '1992-11-05', N'Đà Nẵng', 3, 'ACTIVE', GETDATE()),
('patient4@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Mai', N'Lê Thị', '0944444444', 'FEMALE', '1988-09-18', N'Hải Phòng', 3, 'ACTIVE', GETDATE()),
('patient5@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Nam', N'Nguyễn Văn', '0955555555', 'MALE', '1990-01-30', N'Cần Thơ', 3, 'ACTIVE', GETDATE()),
('patient6@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Thu', N'Phạm Thị', '0966666666', 'FEMALE', '1993-06-14', N'Vũng Tàu', 3, 'ACTIVE', GETDATE());

-- ===========================================================
-- 4. DOCTORS (Bác sĩ)
-- ===========================================================
INSERT INTO Doctors (UserID, DepartmentID, Specialty, Bio) VALUES 
-- Doctor 1-5 (Nội khoa)
(3, 1, N'Nội tổng hợp', N'Bác sĩ chuyên khoa nội tổng hợp với 15 năm kinh nghiệm, chuyên khám và điều trị các bệnh lý nội khoa thường gặp'),
(4, 2, N'Tim mạch', N'Bác sĩ chuyên khoa tim mạch, chuyên điều trị các bệnh về tim và mạch máu, có kinh nghiệm 12 năm'),
(5, 3, N'Hô hấp', N'Bác sĩ chuyên khoa hô hấp, chuyên điều trị các bệnh lý phổi và đường hô hấp'),
(6, 4, N'Tiêu hóa', N'Bác sĩ chuyên khoa tiêu hóa, chuyên điều trị các bệnh về dạ dày, gan, mật và ruột'),
(7, 5, N'Thận - Tiết niệu', N'Bác sĩ chuyên khoa thận - tiết niệu, điều trị bệnh thận và hệ tiết niệu'),

-- Doctor 8-12 (Nội tiết, Thần kinh, Ngoại khoa)
(8, 6, N'Nội tiết', N'Bác sĩ chuyên khoa nội tiết, điều trị bệnh đái tháo đường, tuyến giáp và rối loạn chuyển hóa'),
(9, 7, N'Thần kinh', N'Bác sĩ chuyên khoa thần kinh, điều trị các bệnh về thần kinh trung ương và ngoại biên'),
(10, 8, N'Ngoại tổng hợp', N'Bác sĩ chuyên khoa ngoại tổng hợp, thực hiện phẫu thuật các bệnh lý ngoại khoa'),
(11, 9, N'Chấn thương chỉnh hình', N'Bác sĩ chuyên khoa chấn thương chỉnh hình, điều trị gãy xương, trật khớp và phẫu thuật chỉnh hình'),
(12, 10, N'Ngoại thần kinh', N'Bác sĩ chuyên khoa ngoại thần kinh, phẫu thuật điều trị các bệnh lý hệ thần kinh'),

-- Doctor 13-17 (Ngoại tiêu hóa, Ngoại lồng ngực, Sản phụ khoa, Nhi khoa, Chẩn đoán hình ảnh)
(13, 11, N'Ngoại tiêu hóa', N'Bác sĩ chuyên khoa ngoại tiêu hóa, phẫu thuật các bệnh dạ dày, ruột, gan, mật'),
(14, 12, N'Ngoại lồng ngực', N'Bác sĩ chuyên khoa ngoại lồng ngực, phẫu thuật tim, phổi và mạch máu lớn'),
(15, 13, N'Sản phụ khoa', N'Bác sĩ chuyên khoa sản phụ khoa, chăm sóc sức khỏe sinh sản và thai sản'),
(16, 14, N'Nhi khoa', N'Bác sĩ chuyên khoa nhi, khám và điều trị cho trẻ em'),
(17, 15, N'Chẩn đoán hình ảnh', N'Bác sĩ chuyên khoa chẩn đoán hình ảnh, siêu âm, X-quang, CT, MRI'),

-- Doctor 18-22 (Xét nghiệm, Giải phẫu bệnh, Da liễu, Tai Mũi Họng, Răng Hàm Mặt)
(18, 16, N'Xét nghiệm', N'Bác sĩ chuyên khoa xét nghiệm, thực hiện các xét nghiệm máu, nước tiểu, sinh hóa'),
(19, 17, N'Giải phẫu bệnh', N'Bác sĩ chuyên khoa giải phẫu bệnh, phân tích mô bệnh học và tế bào học'),
(20, 18, N'Da liễu', N'Bác sĩ chuyên khoa da liễu, điều trị các bệnh về da, tóc và móng'),
(21, 19, N'Tai - Mũi - Họng', N'Bác sĩ chuyên khoa tai - mũi - họng, khám và điều trị các bệnh đường hô hấp trên'),
(22, 20, N'Răng - Hàm - Mặt', N'Bác sĩ chuyên khoa răng - hàm - mặt, khám và điều trị răng miệng'),

-- Doctor 23-27 (Mắt, Cơ Xương Khớp, Ung bướu, Phục hồi chức năng, Dinh dưỡng)
(23, 21, N'Mắt', N'Bác sĩ chuyên khoa mắt, khám và điều trị bệnh lý về mắt'),
(24, 22, N'Cơ - Xương - Khớp', N'Bác sĩ chuyên khoa cơ - xương - khớp, điều trị thoái hóa khớp, viêm khớp, loãng xương'),
(25, 23, N'Ung bướu', N'Bác sĩ chuyên khoa ung bướu, điều trị ung thư và các khối u ác tính'),
(26, 24, N'Phục hồi chức năng', N'Bác sĩ chuyên khoa phục hồi chức năng, tập vật lý trị liệu, phục hồi sau phẫu thuật'),
(27, 25, N'Dinh dưỡng', N'Bác sĩ chuyên khoa dinh dưỡng, tư vấn và xây dựng chế độ ăn cho bệnh nhân'),

-- Doctor 28-32 (Tâm lý Tâm thần, Cấp cứu, Kiểm soát nhiễm khuẩn, Dược, Hành chính)
(28, 26, N'Tâm lý - Tâm thần', N'Bác sĩ chuyên khoa tâm lý - tâm thần, hỗ trợ điều trị rối loạn tâm lý và tâm thần'),
(29, 27, N'Cấp cứu', N'Bác sĩ chuyên khoa cấp cứu, tiếp nhận và xử lý bệnh nhân cấp cứu 24/7'),
(30, 28, N'Kiểm soát nhiễm khuẩn', N'Bác sĩ chuyên khoa kiểm soát nhiễm khuẩn, đảm bảo vệ sinh và an toàn trong bệnh viện'),
(31, 29, N'Dược', N'Bác sĩ chuyên khoa dược, quản lý thuốc và vật tư y tế'),
(32, 30, N'Hành chính', N'Bác sĩ chuyên khoa hành chính, quản lý hồ sơ, nhân sự và hành chính bệnh viện');

-- ===========================================================
-- 5. PATIENTS (Bệnh nhân)
-- ===========================================================
INSERT INTO Patients (PatientID, health_insurance_number, medical_history) VALUES 
(8, 'BH123456789', N'Tiền sử cao huyết áp, đái tháo đường type 2'),
(9, 'BH987654321', N'Dị ứng với penicillin, hen suyễn nhẹ'),
(10, 'BH456789123', N'Không có tiền sử bệnh lý đặc biệt'),
(11, 'BH789123456', N'Viêm dạ dày mãn tính'),
(12, 'BH321654987', N'Gãy xương tay trái năm 2018'),
(13, 'BH654987321', N'Tiền sử phẫu thuật cắt túi mật');

-- ===========================================================
-- 6. DOCTOR SCHEDULES (Lịch làm việc bác sĩ)
-- ===========================================================
INSERT INTO doctor_schedules(DoctorID, work_date, start_time, end_time, Status, Notes) VALUES 
-- Doctor 1 (Tim mạch) - Tuần này
(1, CAST(GETDATE() AS DATE), '08:00', '12:00', 'Available', N'Khung giờ sáng'),
(1, CAST(GETDATE() AS DATE), '13:00', '17:00', 'Available', N'Khung giờ chiều'),
(1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '08:00', '12:00', 'Available', N'Ngày mai sáng'),
(1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '13:00', '17:00', 'Available', N'Ngày mai chiều'),

-- Doctor 2 (Thần kinh)
(2, CAST(GETDATE() AS DATE), '09:00', '12:00', 'Available', N'Khung giờ sáng'),
(2, CAST(GETDATE() AS DATE), '14:00', '17:00', 'Available', N'Khung giờ chiều'),
(2, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '09:00', '12:00', 'Available', N'Ngày mai sáng'),

-- Doctor 3 (Chấn thương chỉnh hình)
(3, CAST(GETDATE() AS DATE), '08:30', '11:30', 'Available', N'Khung giờ sáng'),
(3, CAST(GETDATE() AS DATE), '14:30', '17:30', 'Available', N'Khung giờ chiều'),

-- Doctor 4 (Nhi khoa)
(4, CAST(GETDATE() AS DATE), '08:00', '11:00', 'Available', N'Khung giờ sáng'),
(4, CAST(GETDATE() AS DATE), '15:00', '18:00', 'Available', N'Khung giờ chiều'),

-- Doctor 5 (Nội tổng hợp)
(5, CAST(GETDATE() AS DATE), '09:30', '12:30', 'Available', N'Khung giờ sáng'),
(5, CAST(GETDATE() AS DATE), '14:00', '17:00', 'Available', N'Khung giờ chiều');

-- ===========================================================
-- 7. APPOINTMENTS (Cuộc hẹn)
-- ===========================================================

-- Insert appointments with new structure (StartTime, EndTime, Fee)
INSERT INTO Appointments (PatientID, DoctorID, ScheduleID, start_time, end_time, Fee, Status, Notes) VALUES 
(8, 1, 1, '09:00:00', '10:00:00', 500000.00, 'Completed', N'Khám tim mạch định kỳ'),
(9, 2, 5, '10:00:00', '11:00:00', 300000.00, 'Completed', N'Khám đau đầu'),
(10, 3, 9,  '11:00:00', '12:00:00', 400000.00, 'Scheduled', N'Khám xương khớp'),
(11, 4, 11, '14:00:00', '15:00:00', 250000.00, 'Scheduled', N'Khám nhi khoa'),
(12, 5, 13, '15:00:00', '16:00:00', 200000.00, 'Scheduled', N'Khám sức khỏe tổng quát'),
(13, 1, 2,'16:00:00', '17:00:00', 500000.00, 'Scheduled', N'Tái khám tim mạch'),
(8, 2, 6, '09:00:00', '10:00:00', 300000.00, 'Scheduled', N'Khám thần kinh'),
(9, 3, 10, '10:00:00', '11:00:00', 400000.00, 'Scheduled', N'Khám chấn thương');

-- Additional appointments for more comprehensive testing
INSERT INTO Appointments (PatientID, DoctorID, scheduleid, start_time, end_time, Fee, Status, Notes) VALUES 
(10, 4, 12, '08:00:00', '09:00:00', 250000.00, 'Scheduled', N'Khám nhi khoa cho trẻ'),
(11, 5, 13, '09:30:00', '10:30:00', 200000.00, 'Scheduled', N'Khám sức khỏe tổng quát'),
(12, 1, 3, '08:30:00', '09:30:00', 500000.00, 'Scheduled', N'Khám tim mạch'),
(13, 2, 7, '10:30:00', '11:30:00', 300000.00, 'Scheduled', N'Khám thần kinh'),
(8, 3, 11, '14:00:00', '15:00:00', 400000.00, 'Scheduled', N'Khám chấn thương'),
(9, 4, 12,  '15:00:00', '16:00:00', 250000.00, 'Scheduled', N'Khám nhi khoa'),
(10, 5, 13, '08:00:00', '09:00:00', 200000.00, 'Scheduled', N'Khám sức khỏe tổng quát'),
(11, 1, 4, '09:00:00', '10:00:00', 500000.00, 'Scheduled', N'Khám tim mạch');

-- ===========================================================
-- 8. MEDICAL RECORDS (Bệnh án)
-- ===========================================================
INSERT INTO medical_records(appointmentid, Diagnosis, Advice, created_at) VALUES 
(1, N'Tăng huyết áp nhẹ, cần theo dõi định kỳ', N'Giảm muối trong ăn uống, tập thể dục nhẹ nhàng, đo huyết áp hàng ngày. Tái khám sau 2 tuần để điều chỉnh thuốc nếu cần.', GETDATE()),
(2, N'Đau đầu do căng thẳng, không có tổn thương thần kinh', N'Nghỉ ngơi đầy đủ, tránh căng thẳng, uống đủ nước. Tái khám nếu đau đầu tăng hoặc có triệu chứng khác.', GETDATE()),
(3, N'Viêm khớp gối nhẹ', N'Tránh vận động mạnh, chườm lạnh khi đau, tập vật lý trị liệu nhẹ nhàng.', DATEADD(HOUR, 1, GETDATE())),
(4, N'Cảm cúm thông thường', N'Nghỉ ngơi, uống nhiều nước, ăn thức ăn dễ tiêu. Tái khám nếu sốt cao hoặc khó thở.', DATEADD(HOUR, 2, GETDATE())),
(5, N'Sức khỏe tốt, cần duy trì chế độ ăn uống lành mạnh', N'Tiếp tục chế độ ăn uống cân bằng, tập thể dục đều đặn, khám sức khỏe định kỳ 6 tháng/lần.', DATEADD(HOUR, 3, GETDATE()));




-- ===========================================================
-- 9. MEDICINES (Thuốc)
-- ===========================================================
INSERT INTO Medicines (Name, Strength, unit_price, Note) VALUES 
(N'Paracetamol', '500mg', 2000.00, N'Thuốc giảm đau hạ sốt'),
(N'Ibuprofen', '400mg', 3500.00, N'Thuốc chống viêm'),
(N'Amoxicillin', '250mg', 15000.00, N'Thuốc kháng sinh'),
(N'Vitamin C', '1000mg', 1500.00, N'Bổ sung vitamin'),
(N'Aspirin', '325mg', 2500.00, N'Thuốc giảm đau chống viêm'),
(N'Metformin', '500mg', 5000.00, N'Thuốc điều trị tiểu đường'),
(N'Loratadine', '10mg', 4000.00, N'Thuốc chống dị ứng'),
(N'Omeprazole', '20mg', 6500.00, N'Thuốc điều trị loét dạ dày'),
(N'Atorvastatin', '10mg', 8000.00, N'Thuốc hạ cholesterol'),
(N'Lisinopril', '10mg', 7500.00, N'Thuốc hạ huyết áp'),
(N'Cetirizine', '10mg', 3000.00, N'Thuốc chống dị ứng'),
(N'Diclofenac', '50mg', 4500.00, N'Thuốc giảm đau chống viêm'),
(N'Metronidazole', '250mg', 12000.00, N'Thuốc kháng sinh'),
(N'Furosemide', '40mg', 6000.00, N'Thuốc lợi tiểu'),
(N'Prednisolone', '5mg', 7000.00, N'Thuốc chống viêm steroid');

-- ===========================================================
-- 10. PRESCRIPTIONS (Đơn thuốc)
-- ===========================================================
INSERT INTO Prescriptions (RecordID, created_at, Notes) VALUES 
(1, GETDATE(), N'Thuốc hạ huyết áp, uống đúng giờ. Theo dõi huyết áp hàng ngày và ghi chép lại.'),
(2, GETDATE(), N'Thuốc giảm đau và thư giãn cho đau đầu do căng thẳng.'),
(3, DATEADD(HOUR, 1, GETDATE()), N'Thuốc chống viêm và giảm đau cho viêm khớp.'),
(4, DATEADD(HOUR, 2, GETDATE()), N'Thuốc điều trị cảm cúm và tăng cường sức đề kháng.'),
(5, DATEADD(HOUR, 3, GETDATE()), N'Vitamin và khoáng chất bổ sung cho sức khỏe tổng quát.');

-- ===========================================================
-- 11. PRESCRIPTION ITEMS (Chi tiết đơn thuốc)
-- ===========================================================
INSERT INTO prescription_items(PrescriptionID, MedicineID, Dosage, Duration, Note) VALUES 
-- Prescription 1 (Tăng huyết áp)
(1, 1, N'1 viên/ngày, uống sau ăn', N'7 ngày', N'Theo dõi tác dụng phụ'),
(1, 10, N'1 viên/ngày, uống vào buổi sáng', N'30 ngày', N'Uống cùng với thức ăn để giảm kích ứng dạ dày'),
(1, 9, N'1 viên/ngày, uống vào buổi tối', N'30 ngày', N'Theo dõi tác dụng phụ'),


-- Prescription 2 (Đau đầu)
(2, 1, N'1-2 viên khi đau, tối đa 4 lần/ngày', N'7 ngày', N'Không uống quá liều'),
(2, 11, N'1 viên/ngày', N'7 ngày', N'Uống vào buổi tối'),

-- Prescription 3 (Viêm khớp)
(3, 2, N'1 viên x 3 lần/ngày sau ăn', N'10 ngày', N'Uống sau ăn để tránh kích ứng dạ dày'),
(3, 12, N'1 viên x 2 lần/ngày', N'7 ngày', N'Thuốc giảm đau mạnh'),

-- Prescription 4 (Cảm cúm)
(4, 3, N'1 viên x 3 lần/ngày', N'7 ngày', N'Uống đủ liệu trình kể cả khi đã hết triệu chứng'),
(4, 4, N'1 viên/ngày', N'14 ngày', N'Tăng cường sức đề kháng'),

-- Prescription 5 (Sức khỏe tổng quát)
(5, 4, N'1 viên/ngày', N'30 ngày', N'Bổ sung vitamin C'),
(5, 1, N'1 viên khi cần', N'30 ngày', N'Dự phòng giảm đau hạ sốt');

-- ===========================================================
-- 12. ARTICLES (Bài viết)
-- ===========================================================
INSERT INTO Articles (Title, Content, image_url, AuthorID, created_at, Status) VALUES 
(N'Cách phòng ngừa bệnh tim mạch', N'Bệnh tim mạch là một trong những nguyên nhân gây tử vong hàng đầu. Để phòng ngừa bệnh tim mạch, bạn cần duy trì chế độ ăn uống lành mạnh, tập thể dục đều đặn, không hút thuốc lá và kiểm tra sức khỏe định kỳ...', '/images/heart-health.jpg', 4, GETDATE(), 'ACTIVE'),

(N'Dấu hiệu cảnh báo đau đầu nguy hiểm', N'Đau đầu có thể là dấu hiệu của nhiều bệnh lý khác nhau. Một số dấu hiệu cảnh báo đau đầu nguy hiểm bao gồm: đau đầu đột ngột và dữ dội, đau đầu kèm theo sốt cao, đau đầu sau chấn thương...', '/images/headache-warning.jpg', 4, GETDATE(), 'ACTIVE'),

(N'Chăm sóc sức khỏe xương khớp', N'Xương khớp khỏe mạnh là nền tảng cho một cuộc sống năng động. Để chăm sóc sức khỏe xương khớp, bạn cần bổ sung đủ canxi và vitamin D, tập thể dục phù hợp, duy trì cân nặng hợp lý...', '/images/bone-health.jpg', 5, GETDATE(), 'ACTIVE'),

(N'Dinh dưỡng cho trẻ em', N'Dinh dưỡng đúng cách trong những năm đầu đời rất quan trọng cho sự phát triển của trẻ. Trẻ em cần được cung cấp đầy đủ các chất dinh dưỡng thiết yếu, vitamin và khoáng chất...', '/images/child-nutrition.jpg', 6, GETDATE(), 'ACTIVE'),

(N'Khám sức khỏe định kỳ - Tại sao quan trọng?', N'Khám sức khỏe định kỳ giúp phát hiện sớm các bệnh lý, từ đó có thể điều trị kịp thời và hiệu quả. Người lớn nên khám sức khỏe tổng quát ít nhất 1 lần/năm...', '/images/health-checkup.jpg', 7, GETDATE(), 'ACTIVE');

-- ===========================================================
-- 13. REVIEWS (Đánh giá bác sĩ)
-- ===========================================================
INSERT INTO Reviews (PatientID, DoctorID, Rating, Comment, created_at, Status) VALUES 
(8, 1, 5, N'Bác sĩ rất tận tâm, chẩn đoán chính xác và điều trị hiệu quả. Tôi rất hài lòng với dịch vụ.', GETDATE(), 'ACTIVE'),
(9, 2, 4, N'Bác sĩ thân thiện, giải thích rõ ràng về tình trạng bệnh. Phòng khám sạch sẽ.', GETDATE(), 'ACTIVE'),
(10, 3, 5, N'Điều trị hiệu quả, bác sĩ có chuyên môn cao. Tôi đã khỏi bệnh nhanh chóng.', GETDATE(), 'ACTIVE'),
(11, 4, 4, N'Bác sĩ nhi khoa rất yêu trẻ, con tôi không sợ khi khám bệnh.', GETDATE(), 'ACTIVE'),
(12, 5, 5, N'Khám sức khỏe tổng quát rất chi tiết, bác sĩ tư vấn nhiệt tình.', GETDATE(), 'ACTIVE'),
(13, 1, 4, N'Bác sĩ tim mạch giỏi, theo dõi bệnh tình cẩn thận.', GETDATE(), 'ACTIVE'),
(8, 2, 3, N'Bác sĩ ok nhưng thời gian chờ hơi lâu.', GETDATE(), 'ACTIVE'),
(9, 3, 5, N'Điều trị chấn thương rất hiệu quả, bác sĩ có tay nghề cao.', GETDATE(), 'ACTIVE');

-- ===========================================================
-- 14. PAYMENTS (Thanh toán)
-- ===========================================================
INSERT INTO Payments (OrderID, AppointmentID, Amount, Status, created_at, paid_at , updated_at) VALUES 
('ORD001', 1, 500000.00, 'Completed', GETDATE(), GETDATE(), GETDATE()),
('ORD002', 2, 300000.00, 'Completed', GETDATE(), GETDATE(), GETDATE()),
('ORD003', 3, 400000.00, 'Pending', GETDATE(), GETDATE(), GETDATE()),
('ORD004', 4, 250000.00, 'Pending',  GETDATE(), GETDATE(), GETDATE()),
('ORD005', 5, 200000.00, 'Completed', GETDATE(), GETDATE(), GETDATE()),
('ORD006', 6, 500000.00, 'Pending',  GETDATE(), GETDATE(), GETDATE()),
('ORD007', 7, 300000.00, 'Pending', GETDATE(), GETDATE(), GETDATE()),
('ORD008', 8, 400000.00, 'Pending', GETDATE(), GETDATE(), GETDATE());

-- ===========================================================
-- 15. CONVERSATIONS (Cuộc trò chuyện)
-- ===========================================================
INSERT INTO Conversations (PatientID, DoctorID, created_at) VALUES 
(8, 1, GETDATE()),
(9, 2, GETDATE()),
(10, 3, GETDATE()),
(11, 4, GETDATE()),
(12, 5, GETDATE()),
(13, 1, GETDATE()),
(8, 2, GETDATE()),
(9, 3, GETDATE());

-- ===========================================================
-- 16. MESSAGES (Tin nhắn)
-- ===========================================================
INSERT INTO Messages (ConversationID, SenderID, Content, AttachmentURL, sent_at) VALUES 
-- Conversation 1 (Patient 8 - Doctor 1)
(1, 8, N'Xin chào bác sĩ, tôi muốn hỏi về tình trạng huyết áp của mình', NULL, GETDATE()),
(1, 3, N'Chào bạn, huyết áp của bạn hiện tại ổn định. Bạn có triệu chứng gì bất thường không?', NULL, DATEADD(MINUTE, 5, GETDATE())),
(1, 8, N'Dạ không ạ, tôi chỉ muốn xác nhận lại thôi. Cảm ơn bác sĩ', NULL, DATEADD(MINUTE, 10, GETDATE())),

-- Conversation 2 (Patient 9 - Doctor 2)
(2, 9, N'Bác sĩ ơi, tôi vẫn còn đau đầu, có cần uống thêm thuốc không?', NULL, GETDATE()),
(2, 4, N'Bạn uống thuốc đúng liều chưa? Nếu vẫn đau có thể uống thêm 1 viên paracetamol', NULL, DATEADD(MINUTE, 3, GETDATE())),

-- Conversation 3 (Patient 10 - Doctor 3)
(3, 10, N'Bác sĩ cho tôi hỏi, sau khi uống thuốc bao lâu thì khớp gối sẽ đỡ đau?', NULL, GETDATE()),
(3, 5, N'Thông thường sau 3-5 ngày uống thuốc đều đặn, tình trạng đau sẽ giảm đáng kể', NULL, DATEADD(MINUTE, 2, GETDATE())),

-- Conversation 4 (Patient 11 - Doctor 4)
(4, 11, N'Bác sĩ ơi, con tôi bị sốt, có cần đưa đi khám ngay không?', NULL, GETDATE()),
(4, 6, N'Bạn đo nhiệt độ cho bé chưa? Nếu sốt trên 38.5 độ thì nên đưa đi khám ngay', NULL, DATEADD(MINUTE, 1, GETDATE())),

-- Conversation 5 (Patient 12 - Doctor 5)
(5, 12, N'Bác sĩ cho tôi hỏi về kết quả xét nghiệm máu', NULL, GETDATE()),
(5, 7, N'Kết quả xét nghiệm của bạn bình thường, chỉ cần duy trì chế độ ăn uống lành mạnh', NULL, DATEADD(MINUTE, 4, GETDATE()));

-- ===========================================================
-- 17. SYSTEM NOTIFICATIONS (Thông báo hệ thống)
-- ===========================================================
INSERT INTO system_notifications(Title, Message, AppointmentID, created_at) VALUES 
(N'Lịch hẹn sắp tới', N'Bạn có lịch hẹn khám bệnh vào ngày mai lúc 9:00. Vui lòng đến đúng giờ.', 3, GETDATE()),
(N'Thanh toán chưa hoàn tất', N'Bạn có hóa đơn chưa thanh toán. Vui lòng thanh toán để hoàn tất dịch vụ.', 4, GETDATE()),
(N'Lịch hẹn đã hoàn thành', N'Cảm ơn bạn đã sử dụng dịch vụ. Vui lòng đánh giá bác sĩ để chúng tôi cải thiện chất lượng.', 1, GETDATE()),
(N'Nhắc nhở uống thuốc', N'Đừng quên uống thuốc theo đơn của bác sĩ. Sức khỏe của bạn là ưu tiên hàng đầu.', 2, GETDATE()),
(N'Thông báo khuyến mãi', N'Phòng khám có chương trình khuyến mãi khám sức khỏe tổng quát giảm 20%. Liên hệ để biết thêm chi tiết.', NULL, GETDATE());

-- ===========================================================
-- VERIFICATION QUERIES
-- ===========================================================
-- Uncomment these queries to verify the data insertion
	select * from users
	--select * from doctors
	select * from patients
	select * from departments
	delete from doctors

UPDATE Departments 
SET image_url = '/uploads/departments/noi_tong_hop.jpg'
WHERE DepartmentID = 1;
GO

-- Khoa ID 2: Tim mạch
UPDATE Departments 
SET image_url = '/uploads/departments/tim_mach.jpg'
WHERE DepartmentID = 2;
GO

-- Khoa ID 3: Hô hấp
UPDATE Departments 
SET image_url = '/uploads/departments/ho_hap.jpg'
WHERE DepartmentID = 3;
GO

-- Khoa ID 4: Tiêu hóa
UPDATE Departments 
SET image_url = '/uploads/departments/tieu_hoa.jpg'
WHERE DepartmentID = 4;
GO

-- Khoa ID 5: Nội thận
UPDATE Departments 
SET image_url = '/uploads/departments/noi_than.jpg'
WHERE DepartmentID = 5;
GO

-- Khoa ID 6: Nội tiết
UPDATE Departments 
SET image_url = '/uploads/departments/noi_tiet.jpg'
WHERE DepartmentID = 6;
GO

-- Khoa ID 7: Nội thần kinh
UPDATE Departments 
SET image_url = '/uploads/departments/noi_than_kinh.jpg'
WHERE DepartmentID = 7;
GO

-- Khoa ID 8: Huyết học
UPDATE Departments 
SET image_url = '/uploads/departments/huyet_hoc.jpg'
WHERE DepartmentID = 8;
GO

-- Khoa ID 9: Lao & Bệnh phổi
UPDATE Departments 
SET image_url = '/uploads/departments/lao_benh_phoi.jpg'
WHERE DepartmentID = 9;
GO

-- Khoa ID 10: Truyền nhiễm
UPDATE Departments 
SET image_url = '/uploads/departments/truyen_nhiem.jpg'
WHERE DepartmentID = 10;
GO

-- Khoa ID 11: Ngoại tổng hợp
UPDATE Departments 
SET image_url = '/uploads/departments/ngoai_tong_hop.jpg'
WHERE DepartmentID = 11;
GO

-- Khoa ID 12: Ngoại thần kinh
UPDATE Departments 
SET image_url = '/uploads/departments/ngoai_than_kinh.jpg'
WHERE DepartmentID = 12;
GO

-- Khoa ID 13: Ngoại niệu
UPDATE Departments 
SET image_url = '/uploads/departments/ngoai_nieu.jpg'
WHERE DepartmentID = 13;
GO

-- Khoa ID 14: Ngoại tiết niệu
UPDATE Departments 
SET image_url = '/uploads/departments/ngoai_tiet_nieu.jpg'
WHERE DepartmentID = 14;
GO

-- Khoa ID 15: Chấn thương chỉnh hình
UPDATE Departments 
SET image_url = '/uploads/departments/chan_thuong_chinh_hinh.jpg'
WHERE DepartmentID = 15;
GO

-- Khoa ID 16: Phẫu thuật tạo hình
UPDATE Departments 
SET image_url = '/uploads/departments/phau_thuat_tao_hinh.jpg'
WHERE DepartmentID = 16;
GO

-- Khoa ID 17: Cấp cứu
UPDATE Departments 
SET image_url = '/uploads/departments/cap_cuu.jpg'
WHERE DepartmentID = 17;
GO

-- Khoa ID 18: Da liễu
UPDATE Departments 
SET image_url = '/uploads/departments/da_lieu.jpg'
WHERE DepartmentID = 18;
GO

-- Khoa ID 19: Nhi khoa
UPDATE Departments 
SET image_url = '/uploads/departments/nhi_khoa.jpg'
WHERE DepartmentID = 19;
GO

-- Khoa ID 20: Sản phụ khoa
UPDATE Departments 
SET image_url = '/uploads/departments/san_phu_khoa.jpg'
WHERE DepartmentID = 20;
GO

-- Khoa ID 21: Tai Mũi Họng
UPDATE Departments 
SET image_url = '/uploads/departments/tai_mui_hong.jpg'
WHERE DepartmentID = 21;
GO

-- Khoa ID 22: Nhãn khoa
UPDATE Departments 
SET image_url = '/uploads/departments/nhan_khoa.jpg'
WHERE DepartmentID = 22;
GO

-- Khoa ID 23: Răng Hàm Mặt
UPDATE Departments 
SET image_url = '/uploads/departments/rang_ham_mat.jpg'
WHERE DepartmentID = 23;
GO

-- Khoa ID 24: Lão khoa
UPDATE Departments 
SET image_url = '/uploads/departments/lao_khoa.jpg'
WHERE DepartmentID = 24;
GO

-- Khoa ID 25: Nam khoa
UPDATE Departments 
SET image_url = '/uploads/departments/nam_khoa.jpg'
WHERE DepartmentID = 25;
GO

-- Khoa ID 26: Vô sinh - Hiếm muộn
UPDATE Departments 
SET image_url = '/uploads/departments/vo_sinh_hiem_muon.jpg'
WHERE DepartmentID = 26;
GO

-- Khoa ID 27: Cơ xương khớp
UPDATE Departments 
SET image_url = '/uploads/departments/co_xuong_khop.jpg'
WHERE DepartmentID = 27;
GO

-- Khoa ID 28: Chẩn đoán hình ảnh
UPDATE Departments 
SET image_url = '/uploads/departments/chan_doan_hinh_anh.jpg'
WHERE DepartmentID = 28;
GO

-- Khoa ID 29: Xét nghiệm
UPDATE Departments 
SET image_url = '/uploads/departments/xet_nghiem.jpg'
WHERE DepartmentID = 29;
GO

-- Khoa ID 30: Gây mê hồi sức
UPDATE Departments 
SET image_url = '/uploads/departments/gay_me_hoi_suc.jpg'
WHERE DepartmentID = 30;
GO

-- Khoa ID 31: Phục hồi chức năng - Vật lý trị liệu
UPDATE Departments 
SET image_url = '/uploads/departments/phuc_hoi_chuc_nang_vat_ly_tri_lieu.jpg'
WHERE DepartmentID = 31;
GO

-- Khoa ID 32: Dinh dưỡng
UPDATE Departments 
SET image_url = '/uploads/departments/dinh_duong.jpg'
WHERE DepartmentID = 32;
GO

-- Khoa ID 33: Tâm lý
UPDATE Departments 
SET image_url = '/uploads/departments/tam_ly.jpg'
WHERE DepartmentID = 33;
GO

-- Khoa ID 34: Tâm thần
UPDATE Departments 
SET image_url = '/uploads/departments/tam_than.jpg'
WHERE DepartmentID = 34;
GO

-- Khoa ID 35: Ung bướu
UPDATE Departments 
SET image_url = '/uploads/departments/ung_buou.jpg'
WHERE DepartmentID = 35;
GO

-- Khoa ID 36: Y học cổ truyền
UPDATE Departments 
SET image_url = '/uploads/departments/y_hoc_co_truyen.jpg'
WHERE DepartmentID = 36;
GO

-- Khoa ID 37: Y học dự phòng
UPDATE Departments 
SET image_url = '/uploads/departments/y_hoc_du_phong.jpg'
WHERE DepartmentID = 37;
GO

-- Khoa ID 38: Đa khoa (đã có file .webp)
UPDATE Departments 
SET image_url = '/uploads/departments/da_khoa.webp'
WHERE DepartmentID = 38;
GO

-- Khoa ID 39: Ngôn ngữ trị liệu
UPDATE Departments 
SET image_url = '/uploads/departments/ngon_ngu_tri_lieu.jpg'
WHERE DepartmentID = 39;
GO

-- Khoa ID 40: Khoa đang phát triển (CLOSED)
UPDATE Departments 
SET image_url = '/uploads/departments/khoa_dang_phat_trien.jpg'
WHERE DepartmentID = 40;
GO
--Thêm số lượng đơn thuốc
ALTER TABLE prescription_items
ADD quantity INT DEFAULT 1;

UPDATE prescription_items
SET quantity = 1
WHERE quantity IS NULL;


-- SELECT 'Roles' as TableName, COUNT(*) as RecordCount FROM Roles
-- UNION ALL
-- SELECT 'Departments', COUNT(*) FROM Departments
-- UNION ALL
-- SELECT 'Users', COUNT(*) FROM Users
-- UNION ALL
-- SELECT 'Doctors', COUNT(*) FROM Doctors
-- UNION ALL
-- SELECT 'Patients', COUNT(*) FROM Patients
-- UNION ALL
-- SELECT 'DoctorSchedules', COUNT(*) FROM DoctorSchedules
-- UNION ALL
-- SELECT 'Appointments', COUNT(*) FROM Appointments
-- UNION ALL
-- SELECT 'MedicalRecords', COUNT(*) FROM MedicalRecords
-- UNION ALL
-- SELECT 'Medicines', COUNT(*) FROM Medicines
-- UNION ALL
-- SELECT 'Prescriptions', COUNT(*) FROM Prescriptions
-- UNION ALL
-- SELECT 'PrescriptionItems', COUNT(*) FROM PrescriptionItems
-- UNION ALL
-- SELECT 'Articles', COUNT(*) FROM Articles
-- UNION ALL
-- SELECT 'Reviews', COUNT(*) FROM Reviews
-- UNION ALL
-- SELECT 'Payments', COUNT(*) FROM Payments
-- UNION ALL
-- SELECT 'Conversations', COUNT(*) FROM Conversations
-- UNION ALL
-- SELECT 'Messages', COUNT(*) FROM Messages
-- UNION ALL
-- SELECT 'SystemNotifications', COUNT(*) FROM SystemNotifications;

PRINT N'Đã hoàn thành việc chèn dữ liệu mẫu cho tất cả các bảng trong cơ sở dữ liệu Clinic Booking!';



