import logo from "./logo.svg";
import "./App.css";
import DoctorScheduleTable from "./pages/Doctor/DoctorScheduleTable";

function App() {
  return (
    <div className="App">
      <div>
        <h2>Lịch trình bác sĩ</h2>
        <DoctorScheduleTable doctorId={"1"} />
      </div>
    </div>
  );
}

export default App;
