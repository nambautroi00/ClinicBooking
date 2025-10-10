import React, { useState } from "react";
import {
  Search,
  LayoutGrid,
  Calendar,
  Filter,
  Eye,
  MessageCircle,
  MoreVertical,
  Clock,
  Mail,
  Phone,
} from "lucide-react";

// UI components
const Button = (props) => (
  <button
    {...props}
    className={`btn ${
      props.variant === "outline" ? "btn-outline-primary" : "btn-primary"
    } ${props.className || ""}`}
  >
    {props.children}
  </button>
);
const Input = (props) => (
  <input {...props} className={`form-control ${props.className || ""}`} />
);
const Badge = ({ children, className }) => (
  <span className={`badge bg-light text-dark ${className || ""}`}>
    {children}
  </span>
);
const Avatar = ({ src, alt, children }) => (
  <span
    className="avatar rounded-circle me-2"
    style={{
      width: 56,
      height: 56,
      display: "inline-block",
      overflow: "hidden",
      background: "#f3f3f3",
    }}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <span className="fw-bold fs-4 text-primary">{children}</span>
    )}
  </span>
);

const appointments = [
  {
    id: "#Apt0001",
    patientName: "Adrian",
    patientAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    date: "09 Oct 2025",
    time: "10.45 AM",
    visitType: "General Visit",
    appointmentType: "Video Call",
    email: "adrian@example.com",
    phone: "+1 504 368 6874",
  },
  {
    id: "#Apt0002",
    patientName: "Kelly",
    patientAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
    date: "09 Oct 2025",
    time: "11.50 AM",
    visitType: "General Visit",
    appointmentType: "Audio Call",
    email: "kelly@example.com",
    phone: "+1 832 891 8403",
    isNew: true,
  },
  {
    id: "#Apt0003",
    patientName: "Samuel",
    patientAvatar: "https://randomuser.me/api/portraits/men/65.jpg",
    date: "09 Oct 2025",
    time: "09.30 AM",
    visitType: "General Visit",
    appointmentType: "Video Call",
    email: "samuel@example.com",
    phone: "+1 749 104 6291",
  },
];

export default function DoctorAppointmentList() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  // Add date filter state for dropdown
  const [startDate, setStartDate] = useState("");
  // Date range filter states
  const [rangeType, setRangeType] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Helper to parse appointment date string to yyyy-mm-dd
  function toISODate(dateStr) {
    const [day, month, year] = dateStr.split(" ");
    const monthMap = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    return `${year}-${monthMap[month]}-${day.padStart(2, "0")}`;
  }

  // Helper: get date range based on rangeType
  function getRangeDates() {
    const today = new Date();
    let start, end;
    switch (rangeType) {
      case "today":
        start = end = today;
        break;
      case "yesterday":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 1
        );
        break;
      case "last7":
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 6
        );
        end = today;
        break;
      case "last30":
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 29
        );
        end = today;
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "custom":
        if (customStart && customEnd) {
          start = new Date(customStart);
          end = new Date(customEnd);
        }
        break;
      default:
        start = end = today;
    }
    return { start, end };
  }

  const { start, end } = getRangeDates();

  const filtered = appointments.filter((a) => {
    // Filter by range
    const apptISO = toISODate(a.date);
    const apptDate = new Date(apptISO);
    if (start && end && (apptDate < start || apptDate > end)) return false;
    if (
      searchQuery &&
      !a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background p-2">
      <div className="mx-auto" style={{ maxWidth: 1500 }}>
        {/* Header */}
        <div className="mb-4 d-flex align-items-center justify-content-between">
          <h2 className="fw-bold">Appointments</h2>
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative">
              <Search
                className="position-absolute"
                style={{
                  left: 12,
                  top: 12,
                  width: 16,
                  height: 16,
                  color: "#888",
                }}
              />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 32, width: 200 }}
              />
            </div>
            <Button size="icon" variant="default" className="bg-primary">
              <LayoutGrid style={{ width: 16, height: 16 }} />
            </Button>

            <Button size="icon" variant="outline">
              <Calendar style={{ width: 16, height: 16 }} />
            </Button>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="mb-4 d-flex align-items-center justify-content-between">
          <div className="d-flex gap-2">
            <Button
              variant={activeTab === "upcoming" ? "default" : "outline"}
              onClick={() => setActiveTab("upcoming")}
              className="gap-2"
            >
              Upcoming <Badge className="ml-1">21</Badge>
            </Button>
            <Button
              variant={activeTab === "cancelled" ? "default" : "outline"}
              onClick={() => setActiveTab("cancelled")}
              className="gap-2"
            >
              Cancelled <Badge className="ml-1">16</Badge>
            </Button>
            <Button
              variant={activeTab === "completed" ? "default" : "outline"}
              onClick={() => setActiveTab("completed")}
              className="gap-2"
            >
              Completed <Badge className="ml-1">214</Badge>
            </Button>
          </div>
          <div className="d-flex align-items-center gap-2">
            {/* Date range quick select dropdown */}
            <select
              className="form-select"
              style={{ width: 180 }}
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            {/* Custom range date pickers */}
            {rangeType === "custom" && (
              <>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 140 }}
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <span className="mx-1">-</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 140 }}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </>
            )}
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter style={{ width: 0, height: 0 }} /> Filter By
            </Button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="d-flex flex-column gap-3">
          {filtered.length === 0 ? (
            <div className="card p-4 text-center">
              <i
                className="bi bi-calendar-x text-muted"
                style={{ fontSize: "2rem" }}
              ></i>
              <div className="mt-2 text-muted">No appointments found</div>
            </div>
          ) : (
            filtered.map((appointment) => (
              <div
                key={appointment.id}
                className="d-flex align-items-center gap-4 rounded border bg-white p-3 shadow-sm"
              >
                {/* Patient Info */}
                <Avatar
                  src={appointment.patientAvatar}
                  alt={appointment.patientName}
                >
                  {appointment.patientName[0]}
                </Avatar>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-sm fw-medium text-primary">
                      {appointment.id}
                    </span>
                    {appointment.isNew && (
                      <Badge className="bg-purple-100 text-purple-700">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="fw-semibold text-dark">
                    {appointment.patientName}
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="d-flex flex-column flex-grow-1 gap-2 ms-4">
                  <div className="d-flex align-items-center gap-2">
                    <Clock style={{ width: 16, height: 16, color: "#888" }} />
                    <span className="fw-medium">
                      {appointment.date} {appointment.time}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <span>{appointment.visitType}</span>
                    <span>•</span>
                    <span>{appointment.appointmentType}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <Mail style={{ width: 16, height: 16 }} />
                    <span>{appointment.email}</span>
                    <Phone style={{ width: 16, height: 16 }} />
                    <span>{appointment.phone}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex align-items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-circle border"
                  >
                    <Eye style={{ width: 16, height: 16 }} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-circle border"
                  >
                    <MessageCircle style={{ width: 16, height: 16 }} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-circle border"
                  >
                    <MoreVertical style={{ width: 16, height: 16 }} />
                  </Button>
                  <Button className="ms-3">Start Now</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
