create database clinic

INSERT INTO Roles (Name, Description)
VALUES 
('Admin', 'Quản trị hệ thống'),
('Doctor', 'Bác sĩ có thể khám, tạo lịch trình, quản lý bệnh án'),
('Patient', 'Bệnh nhân có thể đặt lịch và trò chuyện với bác sĩ');


SELECT * from users