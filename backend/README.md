# CLINIC BOOKING SYSTEM - BACKEND API

## 📖 Giới thiệu

Backend API cho hệ thống quản lý phòng khám (Clinic Booking System), cung cấp các REST API để xử lý:
- **Quản lý người dùng & Vai trò**: Admin, Doctor, Patient với phân quyền rõ ràng
- **Quản lý khoa phòng**: 39+ khoa chuyên môn (Tim mạch, Nhi khoa, Sản phụ khoa, v.v.)
- **Đặt lịch khám**: Booking appointments với bác sĩ theo khoa và lịch trình
- **Quản lý bệnh án điện tử**: Medical records, prescriptions, clinical referrals
- **Chat & Tin nhắn**: Real-time messaging giữa bác sĩ và bệnh nhân (WebSocket)
- **Thanh toán**: Tích hợp PayOS cho thanh toán online
- **Email & Thông báo**: Gửi email OTP, nhắc hẹn, thông báo hệ thống
- **AI Chatbot**: Tích hợp Gemini AI cho tư vấn sức khỏe
- **Review & Đánh giá**: Bệnh nhân đánh giá bác sĩ sau khám
- **Export PDF**: Xuất đơn thuốc, hóa đơn dạng PDF

Backend chạy độc lập với frontend, giao tiếp qua RESTful API.

---

## 🛠️ Công nghệ & Phiên bản

| Công nghệ | Phiên bản / Mô tả |
|-----------|-------------------|
| **Java** | 21 |
| **Spring Boot** | 3.5.6 |
| **Spring Data JPA** | 3.5.6 - ORM framework |
| **Spring Security** | 6.x - Authentication & Authorization |
| **Spring Validation** | 3.5.6 - Bean Validation |
| **Spring WebSocket** | Real-time messaging |
| **Spring Mail** | Email service (SMTP) |
| **Hibernate ORM** | 6.x (đi kèm Spring Boot 3.5.6) |
| **Lombok** | Latest - Giảm boilerplate code |
| **SQL Server JDBC Driver** | Latest - Database connectivity |
| **JWT (jjwt)** | JSON Web Token cho authentication |
| **BCrypt** | Password hashing |
| **PayOS SDK** | Tích hợp thanh toán PayOS |
| **Google Gemini AI SDK** | AI Chatbot integration |
| **Apache PDFBox / iText** | PDF generation cho đơn thuốc, hóa đơn |
| **Build Tool** | Maven 3.9+ |
| **Database** | Microsoft SQL Server (khuyến nghị: 2019+) |

---

## 🗄️ Database Schema
- **Database**: SQL Server
- **Schema**: ClinicBooking
- **Tables**: Users, Roles, Departments, và các bảng khác theo thiết kế ban đầu

## 🏗️ Kiến trúc & Cấu trúc thư mục

### Kiến trúc Layered Architecture

```
Controller (REST API) → Service (Business Logic) → Repository (Data Access) → Database
                  ↕                    ↕
               DTO/Mapper           Entity/Model
```

### Cấu trúc thư mục

```
backend/
├── src/main/java/com/example/backend/
│   ├── controller/              # REST Controllers - xử lý HTTP requests/responses
│   │   ├── UserController.java
│   │   ├── DepartmentController.java
│   │   ├── DoctorController.java
│   │   ├── PatientController.java
│   │   ├── AppointmentController.java
│   │   ├── MedicalRecordController.java
│   │   ├── PrescriptionController.java
│   │   ├── PaymentController.java
│   │   ├── MessageController.java
│   │   ├── ConversationController.java
│   │   ├── ArticleController.java
│   │   ├── ReviewController.java
│   │   ├── AuthController.java
│   │   ├── GeminiChatController.java      # AI Chatbot
│   │   ├── ClinicalReferralController.java
│   │   ├── SystemNotificationController.java
│   │   ├── FileUploadController.java
│   │   └── PayOSWebhookController.java    # Payment webhook
│   │
│   ├── web/                     # Web-related utilities
│   │   ├── PdfExportController.java       # Export PDF
│   │   ├── ExportRequest.java
│   │   └── PingController.java            # Health check
│   │
│   ├── service/                 # Business Logic Layer - xử lý nghiệp vụ
│   │   ├── UserService.java
│   │   ├── DepartmentService.java
│   │   ├── DoctorService.java
│   │   ├── PatientService.java
│   │   ├── AppointmentService.java
│   │   ├── MedicalRecordService.java
│   │   ├── PrescriptionService.java
│   │   ├── PrescriptionItemService.java
│   │   ├── PaymentService.java
│   │   ├── PayOSService.java              # PayOS integration
│   │   ├── MessageService.java
│   │   ├── ConversationService.java
│   │   ├── ArticleService.java
│   │   ├── ReviewService.java
│   │   ├── AuthService.java
│   │   ├── GeminiService.java             # Gemini AI integration
│   │   ├── ClinicalReferralService.java
│   │   ├── SystemNotificationService.java
│   │   ├── EmailService.java
│   │   ├── EmailOtpService.java
│   │   ├── EmailTemplateService.java
│   │   ├── PdfExportService.java
│   │   ├── MedicineService.java
│   │   ├── DoctorScheduleService.java
│   │   ├── ReminderScheduler.java         # Scheduled tasks
│   │   ├── RoleService.java
│   │   └── WebhookService.java
│   │
│   ├── repository/              # Data Access Layer - truy vấn database
│   │   ├── UserRepository.java
│   │   ├── RoleRepository.java
│   │   ├── DepartmentRepository.java
│   │   ├── DoctorRepository.java
│   │   ├── PatientRepository.java
│   │   ├── AppointmentRepository.java
│   │   ├── MedicalRecordRepository.java
│   │   ├── PrescriptionRepository.java
│   │   ├── PrescriptionItemRepository.java
│   │   ├── PaymentRepository.java
│   │   ├── MessageRepository.java
│   │   ├── ConversationRepository.java
│   │   ├── ArticleRepository.java
│   │   ├── ReviewRepository.java
│   │   ├── ClinicalReferralRepository.java
│   │   ├── SystemNotificationRepository.java
│   │   ├── MedicineRepository.java
│   │   └── DoctorScheduleRepository.java
│   │
│   ├── model/                   # Entity Classes - ánh xạ với bảng database
│   │   ├── User.java
│   │   ├── Role.java
│   │   ├── Department.java
│   │   ├── Doctor.java
│   │   ├── Patient.java
│   │   ├── Appointment.java
│   │   ├── MedicalRecord.java
│   │   ├── Prescription.java
│   │   ├── PrescriptionItem.java
│   │   ├── Payment.java
│   │   ├── Message.java
│   │   ├── Conversation.java
│   │   ├── Article.java
│   │   ├── Review.java
│   │   ├── ClinicalReferral.java
│   │   ├── ClinicalReferralStatus.java    # Enum
│   │   ├── SystemNotification.java
│   │   ├── Medicine.java
│   │   └── DoctorSchedule.java
│   │
│   ├── dto/                     # Data Transfer Objects - định nghĩa request/response
│   │   ├── AuthDTO.java
│   │   ├── AppointmentDTO.java
│   │   ├── ArticleDTO.java
│   │   ├── ConversationDTO.java
│   │   ├── ClinicalReferralDTO.java
│   │   ├── ChatbotResponseDto.java
│   │   └── ...                           # Các DTO khác
│   │
│   ├── mapper/                  # Entity-DTO Mappers - chuyển đổi giữa Entity và DTO
│   │   ├── UserMapper.java
│   │   ├── DepartmentMapper.java
│   │   ├── DoctorMapper.java
│   │   ├── PatientMapper.java
│   │   ├── MedicalRecordMapper.java
│   │   ├── PrescriptionMapper.java
│   │   ├── PrescriptionItemMapper.java
│   │   ├── PaymentMapper.java
│   │   ├── MessageMapper.java
│   │   ├── ConversationMapper.java
│   │   ├── ReviewMapper.java
│   │   ├── MedicineMapper.java
│   │   ├── DoctorScheduleMapper.java
│   │   └── SystemNotificationMapper.java
│   │
│   ├── security/                # Security - xác thực & phân quyền
│   │   └── JwtAuthenticationFilter.java  # JWT filter
│   │
│   ├── config/                  # Configuration Classes - cấu hình Spring Boot
│   │   ├── SecurityConfig.java           # Spring Security config
│   │   ├── WebConfig.java                # CORS config
│   │   ├── WebSocketConfig.java          # WebSocket config cho chat
│   │   ├── MailConfig.java               # Email config
│   │   ├── PayOSConfig.java              # PayOS payment config
│   │   └── RestTemplateConfig.java       # HTTP client config
│   │
│   ├── exception/               # Exception Classes - xử lý lỗi tập trung
│   │   ├── NotFoundException.java
│   │   └── GlobalExceptionHandler.java   # Global exception handler
│   │
│   ├── constant/                # Application Constants - các hằng số dùng chung
│   │   └── AppConstants.java
│   │
│   └── BackendApplication.java  # Main Application Class
│
└── src/main/resources/
    ├── application.yml              # Cấu hình chính của ứng dụng
    ├── ClinicBooking.sql           # Schema SQL
    ├── Complete_Insert_Statements.sql # Dữ liệu mẫu đầy đủ
    ├── fonts/                       # Fonts cho PDF export
    └── META-INF/
```

---

## 📋 Yêu cầu hệ thống (Prerequisites)

### Bắt buộc cài đặt:

1. **JDK 21** (hoặc cao hơn)
   - Download: [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#java21) hoặc [OpenJDK 21](https://adoptium.net/)
   - Kiểm tra: `java -version`

2. **Maven 3.9+**
   - Download: [Apache Maven](https://maven.apache.org/download.cgi)
   - Kiểm tra: `mvn -version`

3. **SQL Server 2019+**
   - Download: [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
   - Tool quản lý: SQL Server Management Studio (SSMS)

4. **Git**
   - Download: [Git SCM](https://git-scm.com/downloads)

### Khuyến nghị:

- **IDE**: IntelliJ IDEA / Eclipse / VS Code với Extension Pack for Java
- **Docker** (nếu muốn chạy database bằng container)
- **Postman** hoặc **Thunder Client** để test API

---

## ⚙️ Cấu hình môi trường

### File cấu hình chính: `src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=ClinicBooking;encrypt=false
    username: sa              # Thay đổi username của bạn
    password: 123             # Thay đổi password của bạn
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
  
  jpa:
    hibernate:
      ddl-auto: update        # Tự động tạo/cập nhật schema
    show-sql: true            # Hiển thị SQL queries trong console
    properties:
      hibernate:
        format_sql: true

server:
  port: 8080                  # Port chạy backend
```

### Các bước cấu hình:

1. **Tạo database trong SQL Server:**
   ```sql
   CREATE DATABASE ClinicBooking;
   ```

2. **Cập nhật thông tin kết nối database:**
   - Mở file `application.yml`
   - Sửa `username` và `password` theo tài khoản SQL Server của bạn
   - Nếu SQL Server chạy trên port khác 1433, sửa trong `url`

3. **Biến môi trường (nếu cần):**
   - Có thể dùng environment variables thay vì hard-code:
     ```yaml
     spring:
       datasource:
         username: ${DB_USERNAME:sa}
         password: ${DB_PASSWORD:123}
     ```

4. **Profile môi trường (nếu có):**
   - Development: `application-dev.yml`
   - Production: `application-prod.yml`
   - Chạy với profile: `mvn spring-boot:run -Dspring-boot.run.profiles=dev`

---

## 🚀 Hướng dẫn cài đặt & chạy Backend

### Bước 1: Clone project

```bash
git clone <repository-url>
cd ClinicBooking
```

### Bước 2: Di chuyển vào thư mục backend

```bash
cd backend
```

### Bước 3: Cấu hình database

1. Đảm bảo SQL Server đang chạy
2. Tạo database `ClinicBooking`
3. Cập nhật `application.yml` với thông tin kết nối chính xác

### Bước 4: Build & Run

#### **Cách 1: Sử dụng Maven Wrapper (khuyến nghị)**

```bash
# Trên Windows
.\mvnw.cmd clean install
.\mvnw.cmd spring-boot:run

# Trên Linux/Mac
./mvnw clean install
./mvnw spring-boot:run
```

#### **Cách 2: Sử dụng Maven global**

```bash
mvn clean install
mvn spring-boot:run
```

#### **Cách 3: Chạy từ IDE**

1. Mở project trong IntelliJ IDEA / Eclipse / VS Code
2. Tìm file `BackendApplication.java` (hoặc main class)
3. Right-click → Run 'BackendApplication'

#### **Cách 4: Chạy file JAR**

```bash
# Build JAR file
mvn clean package

# Chạy JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Bước 5: Kiểm tra backend đã chạy thành công

- Mở trình duyệt truy cập: `http://localhost:8080`
- Hoặc test API bằng Postman: `GET http://localhost:8080/api/users`

## 📡 API Endpoints

### 👥 User Management API

#### Base URL: `/api/users`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all users with pagination | - | Page<UserResponseDTO> |
| GET | `/{id}` | Get user by ID | - | UserResponseDTO |
| GET | `/email/{email}` | Get user by email | - | UserResponseDTO |
| GET | `/search` | Search users with filters | Query params | Page<UserResponseDTO> |
| POST | `/` | Create new user | UserCreateDTO | UserResponseDTO |
| PUT | `/{id}` | Update user | UserUpdateDTO | UserResponseDTO |
| DELETE | `/{id}` | Soft delete user | - | 204 No Content |
| DELETE | `/{id}/hard` | Hard delete user | - | 204 No Content |

#### Search Parameters:
- `email` (optional): Filter by email
- `firstName` (optional): Filter by first name
- `lastName` (optional): Filter by last name
- `status` (optional): Filter by status (ACTIVE, INACTIVE, SUSPENDED, DELETED)
- `roleId` (optional): Filter by role ID
- `page` (default: 0): Page number
- `size` (default: 20): Page size
- `sort` (default: createdAt): Sort field

### 🏢 Department Management API

#### Base URL: `/api/departments`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all departments with pagination | - | Page<DepartmentResponseDTO> |
| GET | `/{id}` | Get department by ID | - | DepartmentResponseDTO |
| GET | `/name/{departmentName}` | Get department by name | - | DepartmentResponseDTO |
| GET | `/active` | Get active departments only | - | Page<DepartmentResponseDTO> |
| GET | `/search` | Search departments with filters | Query params | Page<DepartmentResponseDTO> |
| GET | `/count/active` | Get count of active departments | - | Long |
| POST | `/` | Create new department | DepartmentCreateDTO | DepartmentResponseDTO |
| PUT | `/{id}` | Update department | DepartmentUpdateDTO | DepartmentResponseDTO |
| DELETE | `/{id}` | Soft delete department | - | 204 No Content |
| DELETE | `/{id}/hard` | Hard delete department | - | 204 No Content |

#### Search Parameters:
- `departmentName` (optional): Filter by department name
- `status` (optional): Filter by status (ACTIVE, INACTIVE)
- `page` (default: 0): Page number
- `size` (default: 20): Page size
- `sort` (default: departmentName): Sort field

## 📝 Data Models

### User Entity
```json
{
  "id": "Long",
  "email": "String (max 100, unique)",
  "passwordHash": "String (max 255)",
  "firstName": "String (max 50)",
  "lastName": "String (max 50)",
  "phone": "String (max 20)",
  "gender": "Enum (M, F, O)",
  "dateOfBirth": "LocalDate",
  "address": "String (max 255)",
  "roleId": "Long",
  "status": "Enum (ACTIVE, INACTIVE, SUSPENDED, DELETED)",
  "createdAt": "LocalDateTime"
}
```

### Department Entity
```json
{
  "id": "Long",
  "departmentName": "String (max 100, unique)",
  "description": "String (max 255)",
  "status": "Enum (ACTIVE, INACTIVE)"
}
```

### Role Entity
```json
{
  "id": "Long",
  "name": "String (max 50, unique)",
  "description": "String (max 255)"
}
```

## 🧪 Chạy Test

### Chạy tất cả test cases

```bash
# Sử dụng Maven Wrapper
.\mvnw.cmd test        # Windows
./mvnw test            # Linux/Mac

# Sử dụng Maven global
mvn test
```

### Framework test sử dụng:
- **JUnit 5**: Framework test chính
- **Spring Boot Test**: Integration testing cho Spring Boot
- **MockMvc**: Test REST Controllers
- **@DataJpaTest**: Test Repository layer

### Cấu trúc test:
- Unit test cho Service layer
- Integration test cho Controller layer
- Repository test với in-memory database

**Lưu ý:** Nếu test chưa được implement đầy đủ, có thể bổ sung dần trong quá trình phát triển.

## � Tài liệu API

### Swagger UI (nếu đã tích hợp)

Hiện tại project chưa tích hợp Swagger/OpenAPI. Để sử dụng Swagger, cần thêm dependencies:

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

Sau khi thêm, truy cập: `http://localhost:8080/swagger-ui/index.html`

### API Endpoints đang có sẵn

Chi tiết đầy đủ xem phần **API Endpoints** bên dưới.

---

## 🔄 Luồng khởi động hệ thống Fullstack

### Thứ tự chạy:

1. **Bật SQL Server**
   ```bash
   # Kiểm tra SQL Server đang chạy
   # Windows: Services → SQL Server (MSSQLSERVER) → Start
   ```

2. **Chạy Backend**
   ```bash
   cd backend
   .\mvnw.cmd spring-boot:run
   ```
   - Đợi cho đến khi thấy log: `Started BackendApplication in X seconds`
   - Backend chạy ở: `http://localhost:8080`

3. **Chạy Frontend** (sau khi backend đã sẵn sàng)
   ```bash
   cd frontend
   npm install
   npm start
   ```
   - Frontend chạy ở: `http://localhost:3000` (hoặc port khác)

**Lưu ý:** Backend PHẢI chạy trước để Frontend có thể gọi API.

---

## 🐛 Troubleshooting & Lưu ý

### Lỗi thường gặp:

#### 1. **Không kết nối được database**
```
Error: Cannot create PoolableConnectionFactory
```
**Giải pháp:**
- Kiểm tra SQL Server đã bật chưa
- Kiểm tra username/password trong `application.yml`
- Kiểm tra database `ClinicBooking` đã được tạo chưa
- Kiểm tra firewall có chặn port 1433 không

#### 2. **Sai version JDK**
```
Error: class file has wrong version XX
```
**Giải pháp:**
- Kiểm tra JDK version: `java -version`
- Project yêu cầu JDK 21, cài đặt đúng version
- Trong IDE: File → Project Structure → SDK → Chọn JDK 21

#### 3. **Port 8080 đã bị chiếm**
```
Error: Port 8080 is already in use
```
**Giải pháp:**
- Tắt ứng dụng đang dùng port 8080
- Hoặc đổi port trong `application.yml`: `server.port: 8081`

#### 4. **Maven build failed**
```
Error: Cannot resolve dependencies
```
**Giải pháp:**
- Xóa thư mục `.m2/repository`
- Chạy lại: `mvn clean install -U`
- Kiểm tra kết nối internet (Maven download dependencies từ Maven Central)

### Lưu ý khi deploy:

- **Development:** Dùng `ddl-auto: update`, `show-sql: true`
- **Production:** 
  - Đổi `ddl-auto: validate` hoặc `none`
  - Tắt `show-sql: false`
  - Sử dụng biến môi trường cho sensitive data
  - Enable HTTPS
  - Cấu hình CORS đúng với domain frontend

---

##  Dữ liệu mặc định (Default Data)

### Vai trò (Roles)
1. **Admin** - Quản trị hệ thống
2. **Doctor** - Bác sĩ có thể khám, tạo lịch trình, quản lý bệnh án
3. **Patient** - Bệnh nhân có thể đặt lịch và trò chuyện với bác sĩ

### Khoa phòng (Departments) - 39 Khoa

#### Nhóm Nội khoa (10 khoa)
1. **Nội tổng hợp** - Khám và điều trị các bệnh lý nội khoa thường gặp
2. **Tim mạch** - Chuyên điều trị cao huyết áp, suy tim, rối loạn nhịp tim, bệnh mạch vành
3. **Hô hấp** - Chuyên điều trị viêm phổi, hen suyễn, COPD, bệnh phổi tắc nghẽn mãn tính
4. **Tiêu hóa** - Chuyên điều trị viêm loét dạ dày, viêm gan, sỏi mật, viêm đại tràng
5. **Nội thận** - Điều trị suy thận, lọc máu, ghép thận, bệnh thận mạn tính
6. **Nội tiết** - Điều trị đái tháo đường, bệnh tuyến giáp, béo phì, loãng xương
7. **Nội thần kinh** - Điều trị đột quỵ, động kinh, Parkinson, đau đầu migraine
8. **Huyết học** - Chuyên điều trị các bệnh về máu, tủy xương, thiếu máu, bạch cầu
9. **Lao & Bệnh phổi** - Điều trị bệnh lao, bệnh phổi mãn tính, viêm phế quản
10. **Truyền nhiễm** - Cách ly và điều trị các bệnh nhiễm trùng, truyền nhiễm

#### Nhóm Ngoại khoa và Cấp cứu (7 khoa)
11. **Ngoại tổng hợp** - Phẫu thuật viêm ruột thừa, thoát vị, u nang, cắt amidan
12. **Ngoại thần kinh** - Phẫu thuật u não, chấn thương sọ não, thoát vị đĩa đệm
13. **Ngoại niệu** - Phẫu thuật sỏi thận, ung thư bàng quang, phì đại tuyến tiền liệt
14. **Ngoại tiết niệu** - Điều trị sỏi thận, sỏi bàng quang, ung thư tiết niệu
15. **Chấn thương chỉnh hình** - Điều trị gãy xương, trật khớp, phẫu thuật thay khớp
16. **Phẫu thuật tạo hình** - Phẫu thuật thẩm mỹ, tái tạo, sửa chữa dị tật
17. **Cấp cứu** - Tiếp nhận và xử lý bệnh nhân cấp cứu 24/7, chấn thương, ngộ độc

#### Nhóm Chuyên khoa (10 khoa)
18. **Da liễu** - Điều trị mụn trứng cá, viêm da, nấm da, zona, vảy nến
19. **Nhi khoa** - Khám và điều trị cho trẻ em từ sơ sinh đến 16 tuổi, tiêm chủng
20. **Sản phụ khoa** - Chăm sóc thai sản, đẻ thường, mổ đẻ, điều trị vô sinh
21. **Tai Mũi Họng** - Điều trị viêm amidan, viêm xoang, điếc, ù tai, polyp mũi
22. **Nhãn khoa** - Điều trị cận thị, viễn thị, đục thủy tinh thể, glaucoma
23. **Răng Hàm Mặt** - Nhổ răng, trám răng, bọc răng sứ, niềng răng, cấy ghép implant
24. **Lão khoa** - Chăm sóc sức khỏe người cao tuổi, điều trị bệnh lý mãn tính
25. **Nam khoa** - Điều trị các bệnh lý nam giới, rối loạn cương dương, vô sinh nam
26. **Vô sinh - Hiếm muộn** - Hỗ trợ sinh sản, thụ tinh ống nghiệm IVF
27. **Cơ xương khớp** - Điều trị thoái hóa khớp, viêm khớp dạng thấp, loãng xương

#### Nhóm Cận lâm sàng (3 khoa)
28. **Chẩn đoán hình ảnh** - Siêu âm, X-quang, CT Scanner, MRI, chụp mạch máu
29. **Xét nghiệm** - Xét nghiệm máu, nước tiểu, sinh hóa, vi sinh, miễn dịch
30. **Gây mê hồi sức** - Gây mê phẫu thuật, hồi sức tích cực, chăm sóc đặc biệt

#### Nhóm Hỗ trợ điều trị (7 khoa)
31. **Phục hồi chức năng - Vật lý trị liệu** - Vật lý trị liệu, phục hồi sau đột quỵ, chấn thương
32. **Dinh dưỡng** - Tư vấn chế độ ăn cho bệnh nhân tiểu đường, tim mạch, thận
33. **Tâm lý** - Tư vấn và điều trị các vấn đề tâm lý, stress, lo âu, trầm cảm
34. **Tâm thần** - Điều trị các bệnh lý tâm thần, rối loạn tâm thần phân liệt
35. **Ung bướu** - Điều trị ung thư (hóa trị, xạ trị), chăm sóc giảm nhẹ
36. **Y học cổ truyền** - Châm cứu, bấm huyệt, đông y, thảo dược
37. **Y học dự phòng** - Tiêm chủng, tư vấn sức khỏe cộng đồng, kiểm soát dịch bệnh

#### Nhóm Đặc biệt (2 khoa)
38. **Đa khoa** - Khám và điều trị đa chuyên khoa, tổng quát
39. **Ngôn ngữ trị liệu** - Hỗ trợ phát triển ngôn ngữ và giao tiếp cho trẻ em

### Tài khoản mặc định (Default Users)
- **Admin**: admin@clinic.com / admin123
- **Doctor**: doctor1@clinic.com / doctor123
- **Patient**: patient1@clinic.com / patient123

---

## 🔐 Tính năng bảo mật

- **Authentication**: JWT (JSON Web Token) based authentication
- **Password Encryption**: BCrypt hashing cho password
- **Authorization**: Role-based access control (RBAC) - Admin, Doctor, Patient
- **Input Validation**: Bean Validation với @Valid annotations
- **SQL Injection Protection**: JPA/Hibernate parameterized queries
- **CORS**: Cross-Origin Resource Sharing configured cho frontend
- **Email OTP**: Two-factor authentication với OTP qua email

---

## 🌐 API Endpoints Chính

### Authentication API (`/api/auth`)
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập (trả về JWT token)
- `POST /api/auth/send-otp` - Gửi OTP qua email
- `POST /api/auth/verify-otp` - Xác thực OTP
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Đăng xuất

### User Management (`/api/users`)
- `GET /api/users` - Lấy danh sách users (có phân trang & filter)
- `GET /api/users/{id}` - Lấy thông tin user theo ID
- `POST /api/users` - Tạo user mới
- `PUT /api/users/{id}` - Cập nhật thông tin user
- `DELETE /api/users/{id}` - Xóa mềm user (soft delete)

### Department Management (`/api/departments`)
- `GET /api/departments` - Lấy danh sách tất cả khoa
- `GET /api/departments/{id}` - Lấy thông tin khoa theo ID
- `POST /api/departments` - Tạo khoa mới (Admin only)
- `PUT /api/departments/{id}` - Cập nhật khoa
- `DELETE /api/departments/{id}` - Xóa mềm khoa

### Doctor Management (`/api/doctors`)
- `GET /api/doctors` - Lấy danh sách bác sĩ (filter theo khoa, tên)
- `GET /api/doctors/{id}` - Lấy thông tin chi tiết bác sĩ
- `GET /api/doctors/department/{deptId}` - Lấy bác sĩ theo khoa
- `POST /api/doctors` - Thêm bác sĩ mới
- `PUT /api/doctors/{id}` - Cập nhật thông tin bác sĩ
- `GET /api/doctors/{id}/schedules` - Lấy lịch làm việc của bác sĩ

### Patient Management (`/api/patients`)
- `GET /api/patients` - Lấy danh sách bệnh nhân
- `GET /api/patients/{id}` - Lấy thông tin bệnh nhân
- `POST /api/patients` - Đăng ký bệnh nhân mới
- `PUT /api/patients/{id}` - Cập nhật thông tin bệnh nhân
- `GET /api/patients/{id}/appointments` - Lấy lịch hẹn của bệnh nhân

### Appointment Management (`/api/appointments`)
- `GET /api/appointments` - Lấy danh sách lịch hẹn
- `GET /api/appointments/{id}` - Lấy chi tiết lịch hẹn
- `POST /api/appointments` - Đặt lịch hẹn mới
- `PUT /api/appointments/{id}` - Cập nhật lịch hẹn
- `PUT /api/appointments/{id}/status` - Thay đổi trạng thái (confirm, cancel, complete)
- `DELETE /api/appointments/{id}` - Hủy lịch hẹn

### Medical Record Management (`/api/medical-records`)
- `GET /api/medical-records` - Lấy danh sách bệnh án
- `GET /api/medical-records/{id}` - Lấy chi tiết bệnh án
- `POST /api/medical-records` - Tạo bệnh án mới (Doctor only)
- `PUT /api/medical-records/{id}` - Cập nhật bệnh án
- `GET /api/medical-records/patient/{patientId}` - Lấy bệnh án theo bệnh nhân

### Prescription Management (`/api/prescriptions`)
- `GET /api/prescriptions` - Lấy danh sách đơn thuốc
- `GET /api/prescriptions/{id}` - Lấy chi tiết đơn thuốc
- `POST /api/prescriptions` - Kê đơn thuốc mới (Doctor only)
- `PUT /api/prescriptions/{id}` - Cập nhật đơn thuốc
- `GET /api/prescriptions/{id}/pdf` - Export đơn thuốc ra PDF

### Payment Management (`/api/payments`)
- `GET /api/payments` - Lấy danh sách thanh toán
- `GET /api/payments/{id}` - Lấy thông tin thanh toán
- `POST /api/payments` - Tạo thanh toán mới
- `POST /api/payments/payos/create` - Tạo payment link PayOS
- `GET /api/payments/payos/callback` - PayOS callback handler

### Chat & Messaging (`/api/messages`, `/api/conversations`)
- `GET /api/conversations` - Lấy danh sách cuộc trò chuyện
- `GET /api/conversations/{id}` - Lấy chi tiết conversation
- `POST /api/conversations` - Tạo conversation mới
- `GET /api/messages/conversation/{conversationId}` - Lấy tin nhắn trong conversation
- `POST /api/messages` - Gửi tin nhắn mới
- WebSocket endpoint: `/ws/chat` - Real-time chat

### Article Management (`/api/articles`)
- `GET /api/articles` - Lấy danh sách bài viết (có phân trang)
- `GET /api/articles/{id}` - Lấy chi tiết bài viết
- `POST /api/articles` - Tạo bài viết mới (Admin/Doctor)
- `PUT /api/articles/{id}` - Cập nhật bài viết
- `DELETE /api/articles/{id}` - Xóa bài viết

### Review & Rating (`/api/reviews`)
- `GET /api/reviews` - Lấy danh sách đánh giá
- `GET /api/reviews/doctor/{doctorId}` - Lấy đánh giá theo bác sĩ
- `POST /api/reviews` - Tạo đánh giá mới (Patient only)
- `PUT /api/reviews/{id}` - Cập nhật đánh giá
- `DELETE /api/reviews/{id}` - Xóa đánh giá

### AI Chatbot (`/api/gemini`)
- `POST /api/gemini/chat` - Chat với Gemini AI
- `POST /api/gemini/health-advice` - Tư vấn sức khỏe AI

### File Upload (`/api/files`)
- `POST /api/files/upload` - Upload file (ảnh, tài liệu)
- `GET /api/files/{filename}` - Download file

### Notifications (`/api/notifications`)
- `GET /api/notifications` - Lấy thông báo của user
- `PUT /api/notifications/{id}/read` - Đánh dấu đã đọc
- `DELETE /api/notifications/{id}` - Xóa thông báo

### Health Check
- `GET /api/ping` - Kiểm tra server status

---

## 🔐 Tính năng bảo mật (chi tiết)

- **Authentication**: JWT (JSON Web Token) based authentication
- **Password Encryption**: BCrypt hashing cho password
- **Authorization**: Role-based access control (RBAC) - Admin, Doctor, Patient
- **Input Validation**: Bean Validation với @Valid annotations
- **SQL Injection Protection**: JPA/Hibernate parameterized queries
- **CORS**: Cross-Origin Resource Sharing configured cho frontend
- **Email OTP**: Two-factor authentication với OTP qua email

---

## 📈 Tối ưu hóa hiệu suất

- **Database Indexing**: Index trên các trường thường query (email, phone, department_id, doctor_id)
- **Lazy Loading**: Lazy loading cho relationships để tránh N+1 queries
- **Pagination**: Phân trang cho tất cả list endpoints
- **Query Optimization**: JPQL queries được tối ưu
- **Caching**: Spring Cache cho data ít thay đổi (departments, roles)
- **Connection Pooling**: HikariCP cho database connection pool

---

## ✨ Tính năng đặc biệt

### 1. **Real-time Chat với WebSocket**
- WebSocket endpoint: `/ws/chat`
- Real-time messaging giữa bác sĩ và bệnh nhân
- Notification khi có tin nhắn mới

### 2. **AI Chatbot (Gemini Integration)**
- Tích hợp Google Gemini AI
- Tư vấn sức khỏe tự động
- Trả lời câu hỏi y tế thường gặp

### 3. **Email Service**
- Gửi OTP verification
- Email nhắc hẹn (Appointment reminders)
- Email xác nhận thanh toán
- Template engine cho email

### 4. **Payment Integration (PayOS)**
- Thanh toán online qua PayOS
- QR Code payment
- Webhook để xử lý callback
- Payment history tracking

### 5. **PDF Export**
- Export đơn thuốc (Prescription)
- Export hóa đơn (Invoice)
- Export bệnh án (Medical Record)
- Custom fonts cho tiếng Việt

### 6. **Scheduled Tasks**
- `ReminderScheduler`: Tự động gửi email nhắc hẹn
- Scheduled job chạy định kỳ (Cron jobs)

### 7. **Clinical Referral System**
- Chuyển tuyến khám bệnh
- Theo dõi trạng thái chuyển tuyến
- Lịch sử chuyển tuyến

### 8. **File Upload**
- Upload ảnh avatar
- Upload ảnh khoa phòng
- Upload tài liệu đính kèm
- Lưu trữ trong `/uploads` directory

### 9. **Review & Rating System**
- Bệnh nhân đánh giá bác sĩ sau khám
- Rating từ 1-5 sao
- Comment và feedback

### 10. **System Notifications**
- Thông báo hệ thống realtime
- Thông báo lịch hẹn mới
- Thông báo thanh toán thành công
- Đánh dấu đã đọc/chưa đọc

---

## 📈 Tối ưu hóa hiệu suất (chi tiết)

- Database indexing cho các trường thường query
- Lazy loading cho relationships
- Pagination cho tất cả list endpoints
- Query optimization với JPQL

---

## � Thông tin liên hệ

- **Nhóm phát triển:** Backend Team - Clinic Booking System
- **Repository:** [ClinicBooking](https://github.com/nambautroi00/ClinicBooking)

---

**Cập nhật lần cuối:** 15/11/2025