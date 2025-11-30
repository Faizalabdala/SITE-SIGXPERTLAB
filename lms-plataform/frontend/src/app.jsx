import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import VideoPlayer from "./pages/VideoPlayer";
import AdminCourseEditor from "./pages/AdminCourseEditor";
import PaymentSuccess from "./pages/PaymentSuccess";
import StudentDashboard from "./pages/StudentDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* ROTAS UNIFICADAS */}
        <Route path="/admin/courses/new" element={<AdminCourseEditor />} />
        <Route
          path="/admin/courses/:courseId"
          element={<AdminCourseEditor />}
        />
        <Route path="/" element={<Home />} />
        <Route path="/player/:courseId" element={<VideoPlayer />} />,
        <Route path="/payment-success" element={<PaymentSuccess />} />,
        <Route path="/student" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
