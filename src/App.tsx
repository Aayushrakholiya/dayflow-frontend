/*  
*  FILE          : App.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    This file defines the App component, which serves as the main entry point for the Dayflow application.
*/ 

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { generateToken } from "./config/firebase";
import { useEffect, Suspense, lazy } from "react";
import "react-toastify/dist/ReactToastify.css";
import { ThemeContextProvider } from "./components/AuthBase/AuthBaseLayout";
import Offline from "./components/errors/Offline";

// Lazy load pages for code splitting
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const MainPage = lazy(() => import("./pages/MainPage"));
const ForgotPassword = lazy(() => import("./pages/Forgotpassword"));
const HomePage = lazy(() => import("./pages/HomePage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFound = lazy(() => import("./components/errors/NotFound"));
const Unauthorized = lazy(() => import("./components/errors/Unauthorized"));
const ServerError = lazy(() => import("./components/errors/ServerError"));

// Loading fallback component
const LoadingFallback = () => <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;

// Checks for a valid token before allowing access to a protected route.
// Shows the Unauthorized page if the user is not logged in.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Unauthorized />;
  }
  return <>{children}</>;
}

// Checks for a valid token before allowing access to a guest-only route.
// Redirects logged-in users to /main so they don't see login or signup again.
function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/main" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    generateToken();
  }, []);

  return (
    <ThemeContextProvider>
      <BrowserRouter>
        <Offline />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage/>} />
            <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/main" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/401" element={<Unauthorized />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeContextProvider>
  );
}