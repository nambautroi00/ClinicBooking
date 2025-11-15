# CLINIC BOOKING SYSTEM - FRONTEND

## 📖 Giới thiệu

Frontend của hệ thống quản lý phòng khám (Clinic Booking System), được xây dựng với React. Ứng dụng cung cấp giao diện người dùng cho:

### **Chức năng cho Bệnh nhân (Patient)**
- Xem danh sách 39+ khoa và bác sĩ theo chuyên khoa
- Đặt lịch khám bệnh online với bác sĩ
- Xem lịch sử khám bệnh và bệnh án điện tử
- Chat trực tiếp với bác sĩ (Real-time)
- Thanh toán online qua PayOS (QR Code)
- Xem và tải đơn thuốc (PDF)
- Đọc bài viết y tế
- Đánh giá và review bác sĩ

### **Chức năng cho Bác sĩ (Doctor)**
- Quản lý lịch làm việc và available slots
- Xem danh sách lịch hẹn (appointments)
- Quản lý bệnh nhân
- Tạo và quản lý bệnh án (medical records)
- Kê đơn thuốc (prescriptions)
- Chat với bệnh nhân
- Xem đánh giá từ bệnh nhân
- Quản lý chuyển tuyến (clinical referrals)

### **Chức năng cho Admin**
- Dashboard tổng quan hệ thống
- Quản lý người dùng (users)
- Quản lý khoa phòng (departments)
- Quản lý thuốc (medicines)
- Quản lý bài viết (articles)
- Quản lý thanh toán (payments)
- Quản lý đánh giá (reviews)
- Thống kê và báo cáo

Frontend giao tiếp với backend thông qua RESTful API và WebSocket.

---

## 🛠️ Công nghệ & Phiên bản

| Công nghệ | Phiên bản / Mô tả |
|-----------|-------------------|
| **React** | 19.1.1 - Thư viện UI chính |
| **React DOM** | 19.1.1 |
| **React Router DOM** | 7.9.3 - Điều hướng trang (routing) |
| **Axios** | 1.12.2 - HTTP client để gọi API |
| **Tailwind CSS** | 3.4.18 - Framework CSS utility-first |
| **Bootstrap** | 5.3.8 - UI components framework |
| **React Bootstrap** | 2.10.10 - Bootstrap components cho React |
| **Bootstrap Icons** | 1.13.1 - Icon library |
| **React Icons** | 5.5.0 - Icon library (Lucide) |
| **Lucide React** | 0.545.0 - Modern icon library |
| **PostCSS** | 8.5.6 - CSS processing |
| **STOMP.js** | 7.2.1 - WebSocket protocol cho real-time chat |
| **SockJS Client** | 1.6.1 - WebSocket fallback |
| **html2pdf.js** | 0.12.1 - Export PDF từ HTML |
| **js-cookie** | 3.0.5 - Cookie management |
| **React Google reCAPTCHA** | 3.1.0 - Bot protection |
| **Node.js** | Runtime environment (yêu cầu 16.x trở lên) |
| **npm** | Package manager |
| **React Scripts** | 5.0.1 - Create React App scripts |

---

## 🏗️ Kiến trúc & Cấu trúc thư mục

### Kiến trúc Component-Based

```
Components → Pages → API Layer → Backend REST API
     ↕          ↕
   Hooks    Utils/Config
```

### Cấu trúc thư mục

```
frontend/
├── public/                      # Static files
│   ├── index.html              # HTML template chính
│   ├── manifest.json           # PWA manifest
│   ├── robots.txt              # SEO robots
│   └── images/                 # Hình ảnh tĩnh
│
├── src/
│   ├── api/                    # API Layer - xử lý HTTP requests (21 files)
│   │   ├── axiosClient.js      # Axios instance với config chung
│   │   ├── userApi.js          # API calls cho User
│   │   ├── departmentApi.js    # API calls cho Department
│   │   ├── appointmentApi.js   # API calls cho Appointment
│   │   ├── doctorApi.js        # API calls cho Doctor
│   │   ├── doctorScheduleApi.js # API calls cho Doctor Schedule
│   │   ├── patientApi.js       # API calls cho Patient
│   │   ├── medicalRecordApi.js # API calls cho Medical Record
│   │   ├── prescriptionApi.js  # API calls cho Prescription
│   │   ├── medicineApi.js      # API calls cho Medicine
│   │   ├── paymentApi.js       # API calls cho Payment
│   │   ├── chatApi.js          # API calls cho Gemini AI Chat
│   │   ├── messageApi.js       # API calls cho Messages
│   │   ├── conversationApi.js  # API calls cho Conversations
│   │   ├── articleApi.js       # API calls cho Articles
│   │   ├── reviewApi.js        # API calls cho Reviews
│   │   ├── referralApi.js      # API calls cho Clinical Referrals
│   │   ├── notificationApi.js  # API calls cho Notifications
│   │   ├── fileUploadApi.js    # API calls cho File Upload
│   │   ├── addressApi.js       # API calls cho Address
│   │   └── exportPdf.js/ts     # Export PDF utilities
│   │
│   ├── components/             # Reusable Components
│   │   │
│   │   ├── admin/              # Components dành cho Admin
│   │   │   └── PrescriptionPdf.jsx     # PDF prescription for admin
│   │   │
│   │   ├── article/            # Components cho bài viết
│   │   │   ├── ArticleList.jsx
│   │   │   ├── ArticleDetail.jsx
│   │   │   └── admin/          # Admin article management components
│   │   │
│   │   ├── auth/               # Components xác thực
│   │   │   └── RoleProtectedRoute.jsx  # Protected route by role
│   │   │
│   │   ├── chatbot/            # AI Chatbot component
│   │   │   └── ChatBot.jsx     # Gemini AI chatbot
│   │   │
│   │   ├── common/             # Components dùng chung
│   │   │   ├── ExportAllPdfButton.jsx/tsx
│   │   │   ├── UserSelector.jsx
│   │   │   └── icons/          # Icon components
│   │   │
│   │   ├── home/               # Components cho trang chủ
│   │   │   ├── ArticlesSection.jsx
│   │   │   ├── DoctorCarousel.jsx
│   │   │   ├── HeroSection.jsx
│   │   │   ├── SecuritySection.jsx
│   │   │   ├── ServicesSection.jsx
│   │   │   └── SpecialtiesSection.jsx
│   │   │
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── admin-layout/   # Admin layout wrapper
│   │   │   ├── doctors-layout/ # Doctor layout wrapper
│   │   │   └── patient-layout/ # Patient layout wrapper
│   │   │
│   │   ├── patient/            # Components dành cho bệnh nhân
│   │   │   └── MedicalRecordPdf.jsx    # PDF medical record
│   │   │
│   │   ├── payment/            # Components thanh toán
│   │   │
│   │   └── ReferralResults.jsx # Clinical referral results
│   │
│   ├── pages/                  # Page Components - từng trang của ứng dụng
│   │   │
│   │   ├── Admin/              # Trang quản trị (11 pages)
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminProfile.jsx
│   │   │   ├── UsersManagement.jsx
│   │   │   ├── DepartmentsManagement.jsx
│   │   │   ├── DepartmentSelect.jsx
│   │   │   ├── AppointmentsManagement.jsx
│   │   │   ├── PrescriptionsManagement.jsx
│   │   │   ├── MedicinesManagement.jsx
│   │   │   ├── PaymentsManagement.jsx
│   │   │   ├── ArticleManagement.jsx
│   │   │   └── ReviewsManagement.jsx
│   │   │
│   │   ├── Auth/               # Trang đăng nhập/đăng ký
│   │   │
│   │   ├── Doctor/             # Trang dành cho bác sĩ (16 pages)
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── DoctorProfile.jsx
│   │   │   ├── DoctorAppointmentList.jsx
│   │   │   ├── DoctorScheduleManagement.jsx
│   │   │   ├── DoctorScheduleForm.jsx
│   │   │   ├── DoctorAvailableSlotManagement.jsx
│   │   │   ├── DoctorPatientManagement.jsx
│   │   │   ├── MedicalRecords.jsx
│   │   │   ├── PrescriptionForm.jsx
│   │   │   ├── DoctorPrescriptions.jsx
│   │   │   ├── DoctorMessages.jsx
│   │   │   ├── DoctorReviews.jsx
│   │   │   ├── DoctorReferrals.jsx
│   │   │   ├── DepartmentReferrals.jsx
│   │   │   ├── ReferralDetail.jsx
│   │   │   └── UpdateReferralResult.jsx
│   │   │
│   │   ├── Patient/            # Trang dành cho bệnh nhân (7 pages)
│   │   │   ├── PatientDashboardPage.jsx
│   │   │   ├── DoctorList.jsx
│   │   │   ├── PatientAppointmentBooking.jsx
│   │   │   ├── PatientAppointmentHistory.jsx
│   │   │   ├── PatientBookingDetail.jsx
│   │   │   ├── PatientMedicalRecords.jsx
│   │   │   └── PatientMessages.jsx
│   │   │
│   │   ├── Payment/            # Trang thanh toán
│   │   │
│   │   ├── Home/               # Trang chủ
│   │   ├── ArticleDetail.jsx   # Chi tiết bài viết
│   │   ├── Articles.jsx        # Danh sách bài viết
│   │   ├── Booking.jsx         # Đặt lịch khám
│   │   ├── DoctorDetail.jsx    # Chi tiết bác sĩ
│   │   ├── NotFound.jsx        # Trang 404
│   │   ├── Notifications.jsx   # Thông báo
│   │   ├── SpecialtyDoctors.jsx # Danh sách bác sĩ theo chuyên khoa
│   │   └── TestAuth.jsx        # Test authentication
│   │
│   ├── routes/                 # Routing configuration
│   │   └── AppRoutes.js        # Định nghĩa routes của app
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   └── useScrollToTop.js   # Hook scroll to top
│   │
│   ├── services/               # Business logic & services
│   │   └── WebRTCService.js    # WebRTC service cho video call
│   │
│   ├── utils/                  # Utility functions
│   │   ├── avatarUtils.js      # Xử lý avatar
│   │   ├── imageUtils.js       # Xử lý hình ảnh
│   │   └── toast.js            # Toast notifications
│   │
│   ├── config/                 # Configuration files
│   │   └── config.js           # App configuration
│   │
│   ├── tests/                  # Test files
│   │   └── PrescriptionSeleniumTests.js
│   │
│   ├── App.js                  # Root component
│   ├── App.css                 # Global App styles
│   ├── index.js                # Entry point
│   ├── index.css               # Global styles với Tailwind
│   └── reportWebVitals.js      # Performance monitoring
│
├── package.json                # Dependencies & scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
└── README.md                   # Documentation
```

---

## 📋 Yêu cầu hệ thống (Prerequisites)

### Bắt buộc cài đặt:

1. **Node.js** (phiên bản 16.x trở lên, khuyến nghị 18.x hoặc 20.x)
   - Download: [Node.js Official](https://nodejs.org/)
   - Kiểm tra: `node -v`

2. **npm** (đi kèm với Node.js, phiên bản 8.x trở lên)
   - Kiểm tra: `npm -v`

3. **Git**
   - Download: [Git SCM](https://git-scm.com/downloads)

### Khuyến nghị:

- **IDE/Editor**: VS Code với các extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
- **Browser**: Chrome/Firefox (có DevTools mạnh)
- **Extension trình duyệt**: React Developer Tools

---

## ⚙️ Cấu hình môi trường

### File cấu hình: `src/config/config.js`

```javascript
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export const config = {
  apiUrl: API_BASE_URL,
  timeout: 30000, // 30 seconds
  // Các config khác...
};
```

### Biến môi trường (Environment Variables)

Tạo file `.env` trong thư mục `frontend/`:

```env
# Backend API URL
REACT_APP_API_BASE_URL=http://localhost:8080/api

# Các biến môi trường khác (nếu có)
REACT_APP_ENABLE_CHATBOT=true
```

**Lưu ý:**
- File `.env` không nên commit lên Git (đã có trong `.gitignore`)
- Tạo file `.env.example` để làm template cho team
- Biến môi trường phải bắt đầu bằng `REACT_APP_` để React nhận diện

---

## 🚀 Hướng dẫn cài đặt & chạy Frontend

### Bước 1: Clone project

```bash
git clone <repository-url>
cd ClinicBooking
```

### Bước 2: Di chuyển vào thư mục frontend

```bash
cd frontend
```

### Bước 3: Cài đặt dependencies

```bash
npm install
```

**Lưu ý:** Nếu gặp lỗi, thử:
```bash
npm install --legacy-peer-deps
```

### Bước 4: Cấu hình môi trường

1. Tạo file `.env` (copy từ `.env.example` nếu có)
2. Cập nhật `REACT_APP_API_BASE_URL` nếu backend chạy ở port khác

### Bước 5: Chạy ứng dụng

#### **Development mode (khuyến nghị khi phát triển)**

```bash
npm start
```

- Ứng dụng sẽ chạy ở: `http://localhost:3000`
- Auto-reload khi có thay đổi code
- Hiển thị lỗi và cảnh báo trong console

#### **Production build**

```bash
# Build ứng dụng cho production
npm run build

# Serve build folder (cần cài `serve` global)
npx serve -s build
```

Build output sẽ nằm trong thư mục `build/`

### Bước 6: Kiểm tra ứng dụng đã chạy

- Mở trình duyệt: `http://localhost:3000`
- Kiểm tra console không có lỗi
- Test đăng nhập và các chức năng cơ bản

---

## 🧪 Chạy Test

### Chạy test cases

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm test -- --coverage

# Chạy tests trong watch mode
npm test -- --watch
```

### Framework test:
- **Jest**: Test runner
- **React Testing Library**: Test React components
- **Selenium** (nếu có): E2E testing

**Lưu ý:** Test suite có thể chưa đầy đủ, cần bổ sung thêm trong quá trình phát triển.

---

## 📚 Scripts có sẵn

Trong `package.json`, có các scripts sau:

| Script | Command | Mô tả |
|--------|---------|-------|
| **start** | `npm start` | Chạy app ở development mode |
| **build** | `npm run build` | Build app cho production |
| **test** | `npm test` | Chạy test suite |
| **eject** | `npm run eject` | Eject CRA config (⚠️ không thể revert) |

---

## 🔄 Luồng hoạt động của ứng dụng

### 1. User Authentication Flow
```
Login Page → API Call (userApi.js) → Backend Auth → Store Token (localStorage) → Redirect to Dashboard
```

### 2. Booking Appointment Flow (Patient)
```
Patient Login → Browse Departments → Select Specialty → 
Choose Doctor → View Doctor Schedule → Pick Available Time Slot → 
Fill Booking Form → Confirm Booking → Payment (PayOS)
```

### 3. Doctor Workflow
```
Doctor Login → View Dashboard → 
Check Appointments List → Review Patient Info → 
Examine Patient → Create Medical Record → 
Write Prescription → Save & Export PDF
```

### 4. Admin Management Flow
```
Admin Login → Dashboard Overview → 
Select Management Section (Users/Departments/Medicines/etc.) → 
CRUD Operations → View Statistics
```

### 5. Real-time Chat Flow
```
User/Doctor Login → Open Messages → 
Select Conversation → WebSocket Connection → 
Send/Receive Messages in Real-time
```

---

## ✨ Tính năng đặc biệt

### 1. **Real-time Chat với WebSocket**
- Sử dụng **STOMP.js** và **SockJS** để kết nối WebSocket
- Chat realtime giữa bác sĩ và bệnh nhân
- Notification khi có tin nhắn mới
- Lưu lịch sử chat
- Files: `messageApi.js`, `conversationApi.js`

### 2. **AI Chatbot (Gemini Integration)**
- Component: `ChatBot.jsx`
- Tích hợp Google Gemini AI
- Tư vấn sức khỏe tự động 24/7
- Trả lời câu hỏi y tế thường gặp
- API: `chatApi.js`

### 3. **Thanh toán PayOS**
- Thanh toán online qua QR Code
- Tích hợp PayOS payment gateway
- Hiển thị lịch sử thanh toán
- Xác nhận thanh toán realtime
- Files: `paymentApi.js`, pages trong `Payment/`

### 4. **Export PDF**
- Export đơn thuốc: `PrescriptionPdf.jsx`
- Export bệnh án: `MedicalRecordPdf.jsx`
- Export hóa đơn
- Sử dụng thư viện **html2pdf.js**
- Button: `ExportAllPdfButton.jsx/tsx`

### 5. **Multi-role Dashboard**
- **Patient Dashboard**: Lịch hẹn, bệnh án, thanh toán
- **Doctor Dashboard**: Appointments, patients, schedules
- **Admin Dashboard**: Quản lý toàn hệ thống, thống kê

### 6. **Responsive Design**
- Mobile-first approach với **Tailwind CSS**
- Responsive trên mọi thiết bị
- Bootstrap grid system
- Adaptive components

### 7. **Protected Routes**
- Component: `RoleProtectedRoute.jsx`
- Bảo vệ routes theo vai trò (Admin, Doctor, Patient)
- Redirect nếu không có quyền truy cập
- JWT token validation

### 8. **File Upload**
- Upload avatar người dùng
- Upload ảnh khoa phòng
- Upload tài liệu đính kèm
- API: `fileUploadApi.js`

### 9. **Review & Rating System**
- Bệnh nhân đánh giá bác sĩ (1-5 sao)
- Comment và feedback chi tiết
- Hiển thị rating trung bình
- API: `reviewApi.js`

### 10. **Clinical Referral (Chuyển tuyến)**
- Component: `ReferralResults.jsx`
- Bác sĩ tạo phiếu chuyển tuyến
- Theo dõi trạng thái chuyển tuyến
- Cập nhật kết quả chuyển tuyến
- Pages: `DoctorReferrals.jsx`, `DepartmentReferrals.jsx`

### 11. **Notification System**
- Thông báo realtime
- Đánh dấu đã đọc/chưa đọc
- Badge số lượng thông báo chưa đọc
- Page: `Notifications.jsx`

### 12. **Article Management**
- Đọc bài viết y tế
- Admin quản lý bài viết
- Rich text editor
- Categories và tags

### 13. **Advanced Search & Filter**
- Tìm kiếm bác sĩ theo tên, khoa
- Filter lịch hẹn theo trạng thái
- Search trong danh sách user
- Pagination cho tất cả list

### 14. **Doctor Schedule Management**
- Bác sĩ tự quản lý lịch làm việc
- Available slots system
- Recurring schedules (lặp lại hàng tuần)
- Block time slots

### 15. **Medical Records System**
- Lưu trữ bệnh án điện tử
- Lịch sử khám bệnh
- Đính kèm kết quả xét nghiệm
- Export PDF

---

## 🔄 Luồng hoạt động của ứng dụng (chi tiết)

### 1. User Authentication Flow
```
Login Page → API Call (userApi.js) → Backend Auth → Store Token → Redirect to Dashboard
```

### 2. Booking Appointment Flow
```
Patient Login → Select Department → Choose Doctor → Pick Time Slot → Confirm Booking → Payment
```

### 3. Doctor Workflow
```
Doctor Login → View Appointments → Examine Patient → Create Prescription → Save Medical Record
```

### 4. Admin Management
```
Admin Login → Manage Users/Departments → View Statistics → Generate Reports
```

---

## 🔗 Tích hợp với Backend

### API Client Configuration (`src/api/axiosClient.js`)

```javascript
import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor (thêm token)
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (xử lý lỗi chung)
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle 401, 403, 500...
    return Promise.reject(error);
  }
);

export default axiosClient;
```

### Gọi API từ component

```javascript
import { getUsers, createUser } from '../api/userApi';

// Trong component
const fetchUsers = async () => {
  try {
    const users = await getUsers();
    setUsers(users);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};
```

---

## 🎨 Styling với Tailwind CSS

### Cấu hình: `tailwind.config.js`

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors, spacing, etc.
    },
  },
  plugins: [],
}
```

### Sử dụng trong component

```jsx
<div className="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold">Clinic Booking</h1>
</div>
```

---

## 🐛 Troubleshooting & Lỗi thường gặp

### 1. **Port 3000 đã bị chiếm**
```
Error: Port 3000 is already in use
```
**Giải pháp:**
- Tắt ứng dụng đang dùng port 3000
- Hoặc chạy với port khác: `PORT=3001 npm start` (Linux/Mac) hoặc `set PORT=3001 && npm start` (Windows)

### 2. **Không kết nối được Backend**
```
Error: Network Error / CORS Error
```
**Giải pháp:**
- Kiểm tra Backend đã chạy chưa (`http://localhost:8080`)
- Kiểm tra `REACT_APP_API_BASE_URL` trong `.env`
- Kiểm tra CORS đã được enable ở Backend

### 3. **npm install failed**
```
Error: Unable to resolve dependency tree
```
**Giải pháp:**
```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Cài lại với legacy peer deps
npm install --legacy-peer-deps
```

### 4. **Module not found**
```
Error: Cannot find module 'xyz'
```
**Giải pháp:**
```bash
# Cài lại dependencies
npm install

# Hoặc cài module cụ thể
npm install xyz
```

### 5. **Blank page sau khi build**
**Giải pháp:**
- Kiểm tra console browser có lỗi không
- Kiểm tra routes configuration
- Kiểm tra `homepage` trong `package.json` (nếu deploy lên subdirectory)

---

## 📦 Deployment

### Build cho Production

```bash
npm run build
```

Build output: `build/` folder

### Deploy lên các platform:

#### **Vercel**
```bash
npm install -g vercel
vercel --prod
```

#### **Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

#### **Nginx (Server riêng)**
1. Build app: `npm run build`
2. Copy folder `build/` lên server
3. Configure Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔐 Bảo mật

### Best Practices đang áp dụng:
- ✅ JWT token lưu trong localStorage (có thể cải thiện bằng httpOnly cookie)
- ✅ Protected routes với `RoleProtectedRoute`
- ✅ Input validation trước khi gửi lên server
- ✅ XSS protection (React tự động escape)
- ✅ HTTPS cho production

### Cần cải thiện:
- ⚠️ Implement refresh token mechanism
- ⚠️ Rate limiting cho API calls
- ⚠️ Content Security Policy (CSP)

---

## 📈 Performance Optimization

### Đã áp dụng:
- Code splitting với React.lazy()
- Image optimization
- Minification & compression khi build

### Gợi ý cải thiện:
- Implement React.memo cho components hay re-render
- Sử dụng useMemo, useCallback cho expensive operations
- Lazy load images
- PWA với Service Worker

---

## 🧭 Routing

Routes được định nghĩa trong `src/routes/AppRoutes.js`

### Public Routes (không cần đăng nhập):
- `/` - Trang chủ
- `/login` - Đăng nhập
- `/register` - Đăng ký
- `/articles` - Danh sách bài viết y tế
- `/articles/:id` - Chi tiết bài viết
- `/doctors` - Danh sách bác sĩ
- `/doctors/:id` - Chi tiết bác sĩ
- `/specialty/:specialtyId/doctors` - Bác sĩ theo chuyên khoa

### Protected Routes - Patient:
- `/patient/dashboard` - Dashboard bệnh nhân
- `/patient/doctors` - Tìm kiếm bác sĩ
- `/patient/booking` - Đặt lịch khám
- `/patient/appointments` - Lịch sử lịch hẹn
- `/patient/appointments/:id` - Chi tiết lịch hẹn
- `/patient/medical-records` - Bệnh án điện tử
- `/patient/messages` - Chat với bác sĩ
- `/patient/profile` - Thông tin cá nhân

### Protected Routes - Doctor:
- `/doctor/dashboard` - Dashboard bác sĩ
- `/doctor/profile` - Thông tin cá nhân
- `/doctor/appointments` - Danh sách lịch hẹn
- `/doctor/schedule` - Quản lý lịch làm việc
- `/doctor/schedule/form` - Form tạo lịch làm việc
- `/doctor/available-slots` - Quản lý available slots
- `/doctor/patients` - Quản lý bệnh nhân
- `/doctor/medical-records` - Bệnh án
- `/doctor/prescriptions` - Đơn thuốc
- `/doctor/prescriptions/form` - Form kê đơn
- `/doctor/messages` - Chat với bệnh nhân
- `/doctor/reviews` - Đánh giá từ bệnh nhân
- `/doctor/referrals` - Chuyển tuyến
- `/doctor/department-referrals` - Chuyển tuyến khoa
- `/doctor/referrals/:id` - Chi tiết chuyển tuyến

### Protected Routes - Admin:
- `/admin/dashboard` - Dashboard admin
- `/admin/profile` - Thông tin cá nhân
- `/admin/users` - Quản lý người dùng
- `/admin/departments` - Quản lý khoa phòng
- `/admin/medicines` - Quản lý thuốc
- `/admin/appointments` - Quản lý lịch hẹn
- `/admin/prescriptions` - Quản lý đơn thuốc
- `/admin/payments` - Quản lý thanh toán
- `/admin/articles` - Quản lý bài viết
- `/admin/reviews` - Quản lý đánh giá

### Special Routes:
- `/notifications` - Thông báo hệ thống
- `/payment/success` - Thanh toán thành công
- `/payment/cancel` - Thanh toán hủy
- `/404` hoặc `*` - Trang Not Found

---

## 👥 Vai trò người dùng (User Roles) - Chi tiết

### 1. **Patient (Bệnh nhân)**

#### Quyền và Chức năng:
- ✅ Xem danh sách 39+ khoa và bác sĩ theo chuyên khoa
- ✅ Xem thông tin chi tiết bác sĩ và đánh giá
- ✅ Đặt lịch khám theo khoa và bác sĩ
- ✅ Xem lịch sử lịch hẹn
- ✅ Hủy lịch hẹn (trước giờ khám)
- ✅ Xem bệnh án cá nhân
- ✅ Xem và tải đơn thuốc (PDF)
- ✅ Chat với bác sĩ đã khám
- ✅ Thanh toán online (PayOS)
- ✅ Đánh giá bác sĩ sau khám
- ✅ Đọc bài viết y tế
- ✅ Cập nhật thông tin cá nhân

### 2. **Doctor (Bác sĩ)**

#### Quyền và Chức năng:
- ✅ Xem dashboard với thống kê cá nhân
- ✅ Quản lý lịch làm việc (schedule)
- ✅ Tạo và quản lý available time slots
- ✅ Xem danh sách lịch hẹn
- ✅ Xác nhận/Hủy lịch hẹn
- ✅ Xem danh sách bệnh nhân
- ✅ Tạo và cập nhật bệnh án
- ✅ Kê đơn thuốc
- ✅ Export đơn thuốc PDF
- ✅ Chat với bệnh nhân
- ✅ Xem đánh giá của bệnh nhân
- ✅ Tạo phiếu chuyển tuyến
- ✅ Cập nhật kết quả chuyển tuyến

### 3. **Admin (Quản trị viên)**

#### Quyền và Chức năng:
- ✅ Full access toàn hệ thống
- ✅ Quản lý người dùng (CRUD) - Admin, Doctor, Patient
- ✅ Quản lý khoa phòng (CRUD)
- ✅ Quản lý thuốc (CRUD)
- ✅ Quản lý lịch hẹn
- ✅ Quản lý đơn thuốc
- ✅ Quản lý thanh toán và thống kê doanh thu
- ✅ Quản lý bài viết y tế
- ✅ Quản lý đánh giá
- ✅ Xem thống kê và báo cáo tổng quan
- Thanh toán online

### 2. **Doctor (Bác sĩ)**
- Xem lịch hẹn
- Quản lý bệnh án
- Kê đơn thuốc
- Chat với bệnh nhân
- Video call (WebRTC)

### 3. **Admin (Quản trị viên)**
- Quản lý người dùng
- Quản lý khoa phòng
- Quản lý bài viết
- Xem thống kê
- Export báo cáo


---

## 🔧 Công cụ phát triển (Development Tools)

### Recommended VS Code Extensions:
- **ESLint**: Linting JavaScript/React
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: Autocomplete cho Tailwind
- **ES7+ React/Redux snippets**: Code snippets
- **Auto Rename Tag**: Tự động rename paired tags

### Browser DevTools:
- **React Developer Tools**: Debug React components
- **Redux DevTools**: Debug Redux state (nếu dùng Redux)

---

## 📞 Thông tin liên hệ

- **Nhóm phát triển:** Frontend Team - Clinic Booking System
- **Repository:** [ClinicBooking](https://github.com/nambautroi00/ClinicBooking)
- **Backend README:** [Backend Documentation](../backend/README.md)

---

## 📝 Ghi chú thêm

### Các tính năng chính đã triển khai:

#### **Patient Features (11 tính năng)**
- ✅ Đặt lịch khám trực tuyến với 39+ khoa
- ✅ Xem lịch sử khám bệnh và bệnh án điện tử
- ✅ Chat realtime giữa bác sĩ và bệnh nhân (WebSocket)
- ✅ Thanh toán online qua PayOS (QR Code)
- ✅ Xem và tải đơn thuốc (PDF)
- ✅ Đánh giá và review bác sĩ
- ✅ Thông báo realtime
- ✅ Tìm bác sĩ theo khoa
- ✅ Xem thông tin chi tiết bác sĩ
- ✅ Hủy lịch hẹn
- ✅ Responsive design (mobile-friendly)

#### **Doctor Features (16 tính năng)**
- ✅ Dashboard với thống kê cá nhân (appointments, patients)
- ✅ Quản lý lịch làm việc tự động (Recurring schedule)
- ✅ Tạo và quản lý available time slots
- ✅ Quản lý danh sách lịch hẹn
- ✅ Xác nhận/Hủy lịch hẹn
- ✅ Xem danh sách bệnh nhân
- ✅ Tạo và quản lý bệnh án điện tử (Medical Records)
- ✅ Kê đơn thuốc với database medicines
- ✅ Export PDF cho đơn thuốc và bệnh án
- ✅ Chat với bệnh nhân
- ✅ Xem đánh giá từ bệnh nhân
- ✅ Quản lý chuyển tuyến (Clinical Referrals)
- ✅ Tạo phiếu chuyển tuyến
- ✅ Xem chuyển tuyến theo khoa
- ✅ Cập nhật kết quả chuyển tuyến
- ✅ Form kê đơn thuốc nâng cao

#### **Admin Features (11 modules)**
- ✅ Dashboard tổng quan hệ thống
- ✅ Quản lý user (Admin, Doctor, Patient) - CRUD
- ✅ Quản lý 39+ khoa phòng với ảnh - CRUD
- ✅ Quản lý medicines database - CRUD
- ✅ Quản lý tất cả appointments
- ✅ Quản lý prescriptions
- ✅ Quản lý payments & revenue statistics
- ✅ Quản lý articles (bài viết y tế) - CRUD
- ✅ Quản lý reviews (đánh giá)
- ✅ Department selector component
- ✅ Thống kê tổng quan

#### **Technical Features (20+ tính năng kỹ thuật)**
- ✅ JWT Authentication & Authorization
- ✅ Role-based Access Control (RBAC) - 3 roles
- ✅ Protected Routes với `RoleProtectedRoute`
- ✅ Real-time Chat (STOMP.js + SockJS)
- ✅ AI Chatbot (Google Gemini Integration)
- ✅ Payment Gateway Integration (PayOS)
- ✅ PDF Export (html2pdf.js)
- ✅ File Upload (Avatar, Images, Documents)
- ✅ Responsive UI (Tailwind CSS + Bootstrap 5)
- ✅ Toast Notifications
- ✅ Form Validation
- ✅ Global Error Handling
- ✅ Loading States & Spinners
- ✅ Pagination & Filtering
- ✅ Search functionality
- ✅ Google reCAPTCHA v3
- ✅ Cookie Management (js-cookie)
- ✅ Axios Interceptors (Request/Response)
- ✅ Environment Variables (.env)
- ✅ Code Splitting với React.lazy()
- ✅ Custom Hooks (useScrollToTop)
- ✅ Service Layer Architecture
- ✅ Utils & Helpers (avatar, image, toast)

### Tech Stack Summary:
| Category | Technologies |
|----------|-------------|
| **Core** | React 19.1.1, React DOM 19.1.1 |
| **Routing** | React Router DOM 7.9.3 |
| **HTTP Client** | Axios 1.12.2 |
| **UI Frameworks** | Tailwind CSS 3.4.18, Bootstrap 5.3.8, React Bootstrap 2.10.10 |
| **Icons** | React Icons 5.5.0, Lucide React 0.545.0, Bootstrap Icons 1.13.1 |
| **Real-time** | STOMP.js 7.2.1, SockJS Client 1.6.1 |
| **PDF** | html2pdf.js 0.12.1 |
| **Utilities** | js-cookie 3.0.5, autoprefixer 10.4.21 |
| **Security** | React Google reCAPTCHA 3.1.0 |
| **Build Tool** | React Scripts 5.0.1 (Create React App) |
| **Testing** | Jest, React Testing Library |

### Roadmap:
- 🔄 PWA (Progressive Web App) với Service Worker
- 🔄 Multi-language support (i18n) - Tiếng Việt/English
- 🔄 Dark mode theme switcher
- 🔄 Advanced analytics dashboard
- 🔄 Video call integration (WebRTC) cho tele-medicine
- 🔄 Push notifications cho mobile
- 🔄 Offline mode support
- 🔄 Advanced search với Elasticsearch

---

**Cập nhật lần cuối:** 15/11/2025
