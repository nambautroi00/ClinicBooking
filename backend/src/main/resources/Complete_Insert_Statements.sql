-- ===========================================================
-- COMPLETE INSERT STATEMENTS FOR CLINIC BOOKING DATABASE
-- ===========================================================

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

INSERT INTO Departments (DepartmentName, Description, Status) VALUES
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
('doctor5@clinic.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTV5DCi', N'Tuấn', N'Hoàng Văn', '0944444444', 'MALE', '1985-04-25', N'Hải Phòng', 2, 'ACTIVE', GETDATE());

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
INSERT INTO Doctors (DoctorID, DepartmentID, Specialty, Bio) VALUES 
(3, 1, N'Tim mạch', N'Bác sĩ chuyên khoa tim mạch với 15 năm kinh nghiệm'),
(4, 2, N'Thần kinh', N'Bác sĩ chuyên khoa thần kinh, chuyên điều trị đau đầu và động kinh'),
(5, 3, N'Chấn thương chỉnh hình', N'Bác sĩ chuyên khoa xương khớp, phẫu thuật chỉnh hình'),
(6, 4, N'Nhi khoa', N'Bác sĩ nhi khoa chuyên điều trị bệnh trẻ em'),
(7, 5, N'Nội tổng hợp', N'Bác sĩ nội khoa tổng quát, khám sức khỏe định kỳ');

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
(3, CAST(GETDATE() AS DATE), '08:00', '12:00', 'Available', N'Khung giờ sáng'),
(3, CAST(GETDATE() AS DATE), '13:00', '17:00', 'Available', N'Khung giờ chiều'),
(3, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '08:00', '12:00', 'Available', N'Ngày mai sáng'),
(3, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '13:00', '17:00', 'Available', N'Ngày mai chiều'),

-- Doctor 2 (Thần kinh)
(4, CAST(GETDATE() AS DATE), '09:00', '12:00', 'Available', N'Khung giờ sáng'),
(4, CAST(GETDATE() AS DATE), '14:00', '17:00', 'Available', N'Khung giờ chiều'),
(4, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '09:00', '12:00', 'Available', N'Ngày mai sáng'),

-- Doctor 3 (Chấn thương chỉnh hình)
(5, CAST(GETDATE() AS DATE), '08:30', '11:30', 'Available', N'Khung giờ sáng'),
(5, CAST(GETDATE() AS DATE), '14:30', '17:30', 'Available', N'Khung giờ chiều'),

-- Doctor 4 (Nhi khoa)
(6, CAST(GETDATE() AS DATE), '08:00', '11:00', 'Available', N'Khung giờ sáng'),
(6, CAST(GETDATE() AS DATE), '15:00', '18:00', 'Available', N'Khung giờ chiều'),

-- Doctor 5 (Nội tổng hợp)
(7, CAST(GETDATE() AS DATE), '09:30', '12:30', 'Available', N'Khung giờ sáng'),
(7, CAST(GETDATE() AS DATE), '14:00', '17:00', 'Available', N'Khung giờ chiều');

-- ===========================================================
-- 7. APPOINTMENTS (Cuộc hẹn)
-- ===========================================================

-- Insert appointments with new structure (StartTime, EndTime, Fee)
INSERT INTO Appointments (PatientID, DoctorID, ScheduleID, start_time, end_time, Fee, Status, Notes) VALUES 
(8, 3, 1, '09:00:00', '10:00:00', 500000.00, 'Completed', N'Khám tim mạch định kỳ'),
(9, 4, 5, '10:00:00', '11:00:00', 300000.00, 'Completed', N'Khám đau đầu'),
(10, 5, 9,  '11:00:00', '12:00:00', 400000.00, 'Scheduled', N'Khám xương khớp'),
(11, 6, 11, '14:00:00', '15:00:00', 250000.00, 'Scheduled', N'Khám nhi khoa'),
(12, 7, 13, '15:00:00', '16:00:00', 200000.00, 'Scheduled', N'Khám sức khỏe tổng quát'),
(13, 3, 2,'16:00:00', '17:00:00', 500000.00, 'Scheduled', N'Tái khám tim mạch'),
(8, 4, 6, '09:00:00', '10:00:00', 300000.00, 'Scheduled', N'Khám thần kinh'),
(9, 5, 10, '10:00:00', '11:00:00', 400000.00, 'Scheduled', N'Khám chấn thương');

-- Additional appointments for more comprehensive testing
INSERT INTO Appointments (PatientID, DoctorID, scheduleid, start_time, end_time, Fee, Status, Notes) VALUES 
(10, 6, 12, '08:00:00', '09:00:00', 250000.00, 'Scheduled', N'Khám nhi khoa cho trẻ'),
(11, 7, 13, '09:30:00', '10:30:00', 200000.00, 'Scheduled', N'Khám sức khỏe tổng quát'),
(12, 3, 3, '08:30:00', '09:30:00', 500000.00, 'Scheduled', N'Khám tim mạch'),
(13, 4, 7, '10:30:00', '11:30:00', 300000.00, 'Scheduled', N'Khám thần kinh'),
(8, 5, 11, '14:00:00', '15:00:00', 400000.00, 'Scheduled', N'Khám chấn thương'),
(9, 6, 12,  '15:00:00', '16:00:00', 250000.00, 'Scheduled', N'Khám nhi khoa'),
(10, 7, 13, '08:00:00', '09:00:00', 200000.00, 'Scheduled', N'Khám sức khỏe tổng quát'),
(11, 3, 4, '09:00:00', '10:00:00', 500000.00, 'Scheduled', N'Khám tim mạch');

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
(8, 3, 5, N'Bác sĩ rất tận tâm, chẩn đoán chính xác và điều trị hiệu quả. Tôi rất hài lòng với dịch vụ.', GETDATE(), 'ACTIVE'),
(9, 4, 4, N'Bác sĩ thân thiện, giải thích rõ ràng về tình trạng bệnh. Phòng khám sạch sẽ.', GETDATE(), 'ACTIVE'),
(10, 5, 5, N'Điều trị hiệu quả, bác sĩ có chuyên môn cao. Tôi đã khỏi bệnh nhanh chóng.', GETDATE(), 'ACTIVE'),
(11, 6, 4, N'Bác sĩ nhi khoa rất yêu trẻ, con tôi không sợ khi khám bệnh.', GETDATE(), 'ACTIVE'),
(12, 7, 5, N'Khám sức khỏe tổng quát rất chi tiết, bác sĩ tư vấn nhiệt tình.', GETDATE(), 'ACTIVE'),
(13, 3, 4, N'Bác sĩ tim mạch giỏi, theo dõi bệnh tình cẩn thận.', GETDATE(), 'ACTIVE'),
(8, 4, 3, N'Bác sĩ ok nhưng thời gian chờ hơi lâu.', GETDATE(), 'ACTIVE'),
(9, 5, 5, N'Điều trị chấn thương rất hiệu quả, bác sĩ có tay nghề cao.', GETDATE(), 'ACTIVE');

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
(8, 3, GETDATE()),
(9, 4, GETDATE()),
(10, 5, GETDATE()),
(11, 6, GETDATE()),
(12, 7, GETDATE()),
(13, 3, GETDATE()),
(8, 4, GETDATE()),
(9, 5, GETDATE());

-- ===========================================================
-- 16. MESSAGES (Tin nhắn)
-- ===========================================================
INSERT INTO Messages (ConversationID, SenderID, Content, AttachmentURL, sent_at) VALUES 
-- Conversation 1 (Patient 8 - Doctor 3)
(1, 8, N'Xin chào bác sĩ, tôi muốn hỏi về tình trạng huyết áp của mình', NULL, GETDATE()),
(1, 3, N'Chào bạn, huyết áp của bạn hiện tại ổn định. Bạn có triệu chứng gì bất thường không?', NULL, DATEADD(MINUTE, 5, GETDATE())),
(1, 8, N'Dạ không ạ, tôi chỉ muốn xác nhận lại thôi. Cảm ơn bác sĩ', NULL, DATEADD(MINUTE, 10, GETDATE())),

-- Conversation 2 (Patient 9 - Doctor 4)
(2, 9, N'Bác sĩ ơi, tôi vẫn còn đau đầu, có cần uống thêm thuốc không?', NULL, GETDATE()),
(2, 4, N'Bạn uống thuốc đúng liều chưa? Nếu vẫn đau có thể uống thêm 1 viên paracetamol', NULL, DATEADD(MINUTE, 3, GETDATE())),

-- Conversation 3 (Patient 10 - Doctor 5)
(3, 10, N'Bác sĩ cho tôi hỏi, sau khi uống thuốc bao lâu thì khớp gối sẽ đỡ đau?', NULL, GETDATE()),
(3, 5, N'Thông thường sau 3-5 ngày uống thuốc đều đặn, tình trạng đau sẽ giảm đáng kể', NULL, DATEADD(MINUTE, 2, GETDATE())),

-- Conversation 4 (Patient 11 - Doctor 6)
(4, 11, N'Bác sĩ ơi, con tôi bị sốt, có cần đưa đi khám ngay không?', NULL, GETDATE()),
(4, 6, N'Bạn đo nhiệt độ cho bé chưa? Nếu sốt trên 38.5 độ thì nên đưa đi khám ngay', NULL, DATEADD(MINUTE, 1, GETDATE())),

-- Conversation 5 (Patient 12 - Doctor 7)
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
	select * from doctors
	select * from patients
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



