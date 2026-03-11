import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import MainPage from "./pages/MainPage";
import ForgotPassword from "./pages/Forgotpassword";
import HomePage from "./pages/HomePage";
import { ThemeContextProvider } from "./components/AuthBase/AuthBaseLayout";

export default function App() {
  return (
    <ThemeContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/main" element={<MainPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeContextProvider>
  );
}