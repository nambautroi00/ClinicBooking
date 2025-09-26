create database Clinic
-- Insert sample roles
INSERT INTO Roles (Name, Description) VALUES 
('ADMIN', 'System Administrator'),
('DOCTOR', 'Medical Doctor'),
('PATIENT', 'Patient User'),
('NURSE', 'Nursing Staff');

-- Insert sample departments
INSERT INTO Departments (Name, Description) VALUES 
('Tim mạch', 'Bệnh tim và hệ tim mạch'),
('Thần kinh', 'Rối loạn não và hệ thần kinh'),
('Nhi khoa', 'Chăm sóc y tế cho trẻ em'),
('Chấn thương chỉnh hình', 'Rối loạn xương và khớp'),
('Da liễu', 'Các bệnh về da, tóc và móng'),
('Nội khoa', 'Nội khoa tổng quát');


select * from users
select * from patients
select * from doctors