CREATE DATABASE ClinicBooking;
GO
USE ClinicBooking;
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
    AppointmentID INT NOT NULL,
    Amount DECIMAL(12,2) NOT NULL,
    PaymentMethod NVARCHAR(30) NOT NULL,      -- Cash, Card, VNPay...
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending',
    PaidAt DATETIME NULL,
    Notes NVARCHAR(255),
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


INSERT INTO Roles (Name, Description)
VALUES 
('Admin', 'Quản trị hệ thống'),
('Doctor', 'Bác sĩ có thể khám, tạo lịch trình, quản lý bệnh án'),
('Patient', 'Bệnh nhân có thể đặt lịch và trò chuyện với bác sĩ'),
('Staff', 'Nhân viên hỗ trợ quản lý lịch hẹn và thanh toán');

-- Admin
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID)
VALUES ('admin@clinic.com', 'admin123', 'System', 'Admin', '0123456789', 'M', '1980-01-01', 'Hà Nội', 1);

-- Bác sĩ
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID)
VALUES ('doctor1@clinic.com', 'doctor123', 'Hùng', 'Nguyễn', '0987654321', 'M', '1975-05-10', 'HCM', 2);

INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID)
VALUES ('doctor2@clinic.com', 'doctor123', 'Lan', 'Trần', '0977777777', 'F', '1982-08-15', 'Đà Nẵng', 2);

-- Bệnh nhân
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID)
VALUES ('patient1@clinic.com', 'patient123', 'An', 'Phạm', '0911111111', 'M', '2000-03-20', 'Hà Nội', 3);

INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID)
VALUES ('patient2@clinic.com', 'patient123', 'Hoa', 'Ngô', '0922222222', 'F', '1995-07-12', 'HCM', 3);

-- Nhân viên
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Gender, DOB, Address, RoleID)
VALUES ('staff1@clinic.com', 'staff123', 'Thảo', 'Lê', '0933333333', 'F', '1990-12-01', 'Hà Nội', 4);

