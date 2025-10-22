 CREATE DATABASE CLINIC;
GO
USE CLINIC;
GO

/* ===========================================================
   1) QUYỀN NGƯỜI DÙNG
   =========================================================== */
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255)
);
GO

/* ===========================================================
   2) NGƯỜI DÙNG
   =========================================================== */
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Phone NVARCHAR(20),
    Gender CHAR(1) CHECK (Gender IN ('M','F','O')),
    DOB DATE,
    Address NVARCHAR(255),
    RoleID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
GO

/* ===========================================================
   3) KHOA
   =========================================================== */
CREATE TABLE Departments (
    DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    Status NVARCHAR(20) DEFAULT 'ACTIVE'
);
GO

/* ===========================================================
   4) BÁC SĨ
   =========================================================== */
CREATE TABLE Doctors (
    DoctorID INT PRIMARY KEY, -- = Users.UserID
    DepartmentID INT NOT NULL,
    Specialty NVARCHAR(100),
    Bio NVARCHAR(255),
    FOREIGN KEY (DoctorID) REFERENCES Users(UserID),
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);
GO

/* ===========================================================
   5) BỆNH NHÂN
   =========================================================== */
CREATE TABLE Patients (
    PatientID INT PRIMARY KEY,
    HealthInsuranceNumber NVARCHAR(50) NULL,
    MedicalHistory NVARCHAR(MAX) NULL,
    FOREIGN KEY (PatientID) REFERENCES Users(UserID) 
);
GO

/* ===========================================================
   6) LỊCH LÀM VIỆC BÁC SĨ
   =========================================================== */
CREATE TABLE DoctorSchedules (
    ScheduleID INT IDENTITY(1,1) PRIMARY KEY,
    DoctorID INT NOT NULL,
    WorkDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Available',
    Notes NVARCHAR(255),
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID) ON DELETE CASCADE
);
GO

/* ===========================================================
   7) CUỘC HẸN
   =========================================================== */
   CREATE TABLE Appointments (
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    DoctorID INT NOT NULL,
    ScheduleID INT NULL,                
    AppointmentTime DATETIME NOT NULL,
    Status NVARCHAR(30) DEFAULT 'Scheduled',
    Notes NVARCHAR(255),
    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID),
    FOREIGN KEY (ScheduleID) REFERENCES DoctorSchedules(ScheduleID)
);

/* ===========================================================
   8) BỆNH ÁN
   =========================================================== */
CREATE TABLE MedicalRecords (
    RecordID INT IDENTITY PRIMARY KEY,
    AppointmentID INT NOT NULL,
    Diagnosis NVARCHAR(255),
    Advice NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID) ON DELETE CASCADE
);
GO

/* ===========================================================
   9) THUỐC & ĐƠN THUỐC
   =========================================================== */
CREATE TABLE Medicines (
    MedicineID INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL UNIQUE,
    Strength NVARCHAR(50) NULL,
    UnitPrice DECIMAL(12,2) NULL,
    Note NVARCHAR(255) NULL
);
GO

CREATE TABLE Prescriptions (
    PrescriptionID INT IDENTITY PRIMARY KEY,
    RecordID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Notes NVARCHAR(255) NULL,
    FOREIGN KEY (RecordID) REFERENCES MedicalRecords(RecordID) ON DELETE CASCADE
);
GO

CREATE TABLE PrescriptionItems (
    ItemID INT IDENTITY PRIMARY KEY,
    PrescriptionID INT NOT NULL,
    MedicineID INT NOT NULL,
    Dosage NVARCHAR(50),
    Duration NVARCHAR(50),
    Note NVARCHAR(255) NULL,
    FOREIGN KEY (PrescriptionID) REFERENCES Prescriptions(PrescriptionID) ON DELETE CASCADE,
    FOREIGN KEY (MedicineID) REFERENCES Medicines(MedicineID)
);
GO

/* ===========================================================
   10) BÀI VIẾT
   =========================================================== */
CREATE TABLE Articles (
    ArticleID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NULL,
    ImageURL NVARCHAR(500) NULL,            
    AuthorID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (AuthorID) REFERENCES Users(UserID)
);

/* ===========================================================
   11) ĐÁNH GIÁ BÁC SĨ
   =========================================================== */
CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,
    DoctorID INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID)
);
GO

/* ===========================================================
   12) THANH TOÁN
   =========================================================== */
CREATE TABLE Payments (
    PaymentID INT IDENTITY PRIMARY KEY,
	OrderID NVARCHAR(100) NOT NULL UNIQUE,
    AppointmentID INT NOT NULL,
    Amount DECIMAL(12,2) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending',
	TransactionID NVARCHAR(100),
	CreatedAt DATETIME DEFAULT GETDATE(),
	UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID)
);
GO

/* ===========================================================
   13) TIN NHẮN
   =========================================================== */
CREATE TABLE Conversations (
    ConversationID INT IDENTITY(1,1) PRIMARY KEY,
    PatientID INT NOT NULL,                   -- Ví dụ: Bệnh nhân
    DoctorID INT NOT NULL,                   -- Ví dụ: Bác sĩ
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID)
);

CREATE TABLE Messages (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    ConversationID INT NOT NULL,
    SenderID INT NOT NULL,
    Content NVARCHAR(MAX),
    AttachmentURL NVARCHAR(500),
    SentAt DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (ConversationID) REFERENCES Conversations(ConversationID) ON DELETE CASCADE,
	FOREIGN KEY (SenderID) REFERENCES Users(UserID)
);
GO
/* ===========================================================
   14) THÔNG BÁO
   =========================================================== */
CREATE TABLE SystemNotifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,          
    Message NVARCHAR(MAX) NOT NULL,
    AppointmentID INT NULL,               
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID)
);


-- Insert Roles
INSERT INTO Roles (Name, Description) VALUES 
('Admin', N'Quản trị hệ thống'),
('Doctor', N'Bác sĩ có thể khám, tạo lịch trình, quản lý bệnh án'),
('Patient', N'Bệnh nhân có thể đặt lịch và trò chuyện với bác sĩ')

-- Insert Users
-- Admin
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID, Status, CreatedAt) 
VALUES ('admin@clinic.com', 'admin123', 'System', 'Admin', '0123456789', 'M', '1980-01-01', 'Hà N?i', 1, 'ACTIVE', GETDATE());

-- Doctors
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID, Status, CreatedAt) 
VALUES ('doctor1@clinic.com', 'doctor123', 'Hùng', 'Nguy?n', '0987654321', 'M', '1975-05-10', 'HCM', 2, 'ACTIVE', GETDATE());

INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID, Status, CreatedAt) 
VALUES ('doctor2@clinic.com', 'doctor123', 'Lan', 'Tr?n', '0977777777', 'F', '1982-08-15', 'Đà N?ng', 2, 'ACTIVE', GETDATE());

-- Patients
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID, Status, CreatedAt) 
VALUES ('patient1@clinic.com', 'patient123', 'An', 'Ph?m', '0911111111', 'M', '2000-03-20', 'Hà N?i', 3, 'ACTIVE', GETDATE());

INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID, Status, CreatedAt) 
VALUES ('patient2@clinic.com', 'patient123', 'Hoa', 'Ngô', '0922222222', 'F', '1995-07-12', 'HCM', 3, 'ACTIVE', GETDATE());

-- patient1
INSERT INTO Patients(PatientID, HealthInsuranceNumber, MedicalHistory)
SELECT u.UserID, NULL, NULL
FROM Users u
WHERE u.Email = 'patient1@clinic.com';

-- patient2
INSERT INTO Patients(PatientID, HealthInsuranceNumber, MedicalHistory)
SELECT u.UserID, NULL, NULL
FROM Users u
WHERE u.Email = 'patient2@clinic.com';

-- Link doctor users to Doctors table with Departments
INSERT INTO Doctors(DoctorID, DepartmentID, Specialty, Bio)
SELECT u.UserID, 1, N'Tim mạch', N'Bác sĩ chuyên khoa tim mạch'
FROM Users u WHERE u.Email = 'doctor1@clinic.com';

INSERT INTO Doctors(DoctorID, DepartmentID, Specialty, Bio)
SELECT u.UserID, 2, N'Thần kinh', N'Bác sĩ chuyên khoa thần kinh'
FROM Users u WHERE u.Email = 'doctor2@clinic.com';


-- Seed some DoctorSchedules for quick CRUD testing
-- Today schedules for doctor1
INSERT INTO doctor_schedules(doctorid, work_date, start_time, end_time, status, notes)
SELECT u.UserID, CAST(GETDATE() AS DATE), '09:00', '11:00', N'Available', N'Khung giờ sáng'
FROM Users u WHERE u.Email = 'doctor1@clinic.com';

INSERT INTO doctor_schedules(doctorid, work_date, start_time, end_time, status, notes)
SELECT u.UserID, CAST(GETDATE() AS DATE), '13:00', '15:00', N'Available', N'Khung giờ chiều'
FROM Users u WHERE u.Email = 'doctor1@clinic.com';

-- Tomorrow schedule for doctor2
INSERT INTO doctor_schedules(doctorid, work_date, start_time, end_time, status, notes)
SELECT u.UserID, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '10:00', '12:00', N'Available', N'Lịch ngày mai'
FROM Users u WHERE u.Email = 'doctor2@clinic.com';

select * from users
select * from doctors
select * from patients
select * from doctor_schedules
select * from appointments

insert into appointments(patientid, doctorid, scheduleid, start_time, end_time, notes, fee)

delete from appointments
delete from doctor_schedules

-- 1. MEDICINES (Thuốc) - Dữ liệu chính để test
-- ===============================================  
INSERT INTO medicines(name, strength, unit_price, note) VALUES
(N'Paracetamol', '500mg', 2000.00, N'Thuốc giảm đau hạ sốt'),
(N'Ibuprofen', '400mg', 3500.00, N'Thuốc chống viêm'),
(N'Amoxicillin', '250mg', 15000.00, N'Thuốc kháng sinh'),
(N'Vitamin C', '1000mg', 1500.00, N'Bổ sung vitamin'),
(N'Aspirin', '325mg', 2500.00, N'Thuốc giảm đau chống viêm'),
(N'Metformin', '500mg', 5000.00, N'Thuốc điều trị tiểu đường'),
(N'Loratadine', '10mg', 4000.00, N'Thuốc chống dị ứng'),
(N'Omeprazole', '20mg', 6500.00, N'Thuốc điều trị loét dạ dày'),
(N'Atorvastatin', '10mg', 8000.00, N'Thuốc hạ cholesterol'),
(N'Lisinopril', '10mg', 7500.00, N'Thuốc hạ huyết áp');


-- 2. MEDICAL RECORDS (Bệnh án) dữ liệu mẫu cho MedicalRecords dựa trên appointments có sẵn
INSERT INTO medical_records (appointmentid, diagnosis, advice, created_at) VALUES
(1, 'Tăng huyết áp nhẹ, cần theo dõi định kỳ', 'Giảm muối trong ăn uống, tập thể dục nhẹ nhàng, đo huyết áp hàng ngày. Tái khám sau 2 tuần để điều chỉnh thuốc nếu cần.', '2025-10-07 09:35:00'),
(2, 'Viêm họng cấp do nhiễm khuẩn', 'Uống kháng sinh theo đơn đầy đủ, nghỉ ngơi nhiều, uống nước ấm. Tránh thức ăn cay nóng. Tái khám nếu triệu chứng không giảm sau 3 ngày.', '2025-10-07 15:35:00');

select * from medicines
select * from medical_records
select * from prescriptions
select * from prescription_items

-- 3. Thêm prescriptions cho 2 medical records
-- Prescription cho Medical Record ID = 1 (Tăng huyết áp)
INSERT INTO prescriptions (recordid, created_at, notes) VALUES
(1, '2025-10-07 09:40:00', 'Thuốc hạ huyết áp, uống đúng giờ. Theo dõi huyết áp hàng ngày và ghi chép lại.'),
(2, '2025-10-07 15:40:00', 'Thuốc kháng sinh và chống viêm cho viêm họng. Uống đủ liệu trình.');

-- 4. Thêm prescription items (chi tiết từng loại thuốc trong đơn) - ĐÃ SỬA
-- Prescription Items cho Prescription ID = 1 (Tăng huyết áp - cần thuốc hạ huyết áp)
INSERT INTO prescription_items (prescriptionid, medicineid, dosage, duration, note) VALUES
(3, 10, '1 viên/ngày, uống vào buổi sáng', '30 ngày', 'Uống cùng với thức ăn để giảm kích ứng dạ dày'),
(4, 3, '1 viên x 3 lần/ngày, uống trước ăn 30 phút', '7 ngày', 'Uống đủ liệu trình kể cả khi đã hết triệu chứng');



