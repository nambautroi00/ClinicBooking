import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

// Import components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes/AppRoutes";

const AppContent = () => {
  const location = useLocation();
  const isDoctorRoute = location.pathname.startsWith("/doctor");
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Nếu đang ở trong doctor layout, không hiển thị header/sidebar chính
  if (isDoctorRoute) {
    return <AppRoutes />;
  }

  // Nếu đang ở trong admin layout, không hiển thị header/footer chính
  if (isAdminRoute) {
    return <AppRoutes />;
  }

  // Layout chính cho các trang khác
  return (
    <div className="App">
      <Header />

      <div className="container-fluid">
        <div className="row">
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <AppRoutes />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
