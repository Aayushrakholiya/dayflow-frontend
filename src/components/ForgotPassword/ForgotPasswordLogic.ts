import { useState } from "react";

// Get API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface ErrorResponse {
  message: string;
  code?: string;
  remainingAttempts?: number;
}

export function useForgotPasswordLogic() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [redirectToLogin, setRedirectToLogin] = useState(false); // NEW: Control redirect

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidOtp = (otp: string) => /^\d{6}$/.test(otp);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    setError(null);
  };

  const handleApiError = async (res: Response): Promise<string> => {
    try {
      const data: ErrorResponse = await res.json();
      
      // Update remaining attempts if provided
      if (data.remainingAttempts !== undefined) {
        setRemainingAttempts(data.remainingAttempts);
      }

      // Return specific error message based on error code
      switch (data.code) {
        case "EMAIL_REQUIRED":
          return "Email is required";
        case "INVALID_EMAIL":
          return "Invalid email format";
        case "RATE_LIMIT_EXCEEDED":
          return "Too many OTP requests. Please try again later.";
        case "USER_NOT_FOUND":
          return "No account found with that email";
        case "EMAIL_AUTH_ERROR":
          return "Email service error. Please contact support.";
        case "EMAIL_CONNECTION_ERROR":
          return "Unable to send email. Please check your connection and try again.";
        case "EMAIL_SEND_ERROR":
          return "Failed to send OTP. Please try again.";
        case "MISSING_FIELDS":
          return "All fields are required";
        case "INVALID_OTP_FORMAT":
          return "OTP must be 6 digits";
        case "OTP_NOT_FOUND":
          return "No OTP request found. Please request a new OTP.";
        case "OTP_EXPIRED":
          return "OTP expired. Please request a new OTP.";
        case "MAX_ATTEMPTS_EXCEEDED":
          return "Maximum verification attempts exceeded. Please request a new OTP.";
        case "INVALID_OTP":
          return data.message; // Use server message for remaining attempts info
        case "INVALID_PASSWORD":
          return "Password must be at least 6 characters and contain no spaces";
        case "DATABASE_ERROR":
          return "Database error. Please try again later.";
        case "DATABASE_UPDATE_ERROR":
          return "Failed to update password. Please try again.";
        case "HASH_ERROR":
          return "Password processing error. Please try again.";
        case "INTERNAL_ERROR":
          return "An unexpected error occurred. Please try again.";
        default:
          return data.message || "An error occurred. Please try again.";
      }
    } catch (parseError) {
      console.error("Error parsing error response:", parseError);
      return "Server error. Please try again.";
    }
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setRemainingAttempts(null);

    // Client-side validation
    if (!form.email) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(form.email)) {
      setError("Invalid email format");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      if (!res.ok) {
        const errorMessage = await handleApiError(res);
        setError(errorMessage);
        return;
      }

      const data = await res.json();
      setSuccess(data.message || "OTP sent to your email");
      setStep(2);

    } catch (err) {
      console.error("Network error in sendOtp:", err);
      
      // Handle network errors
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to server. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!form.otp) {
      setError("OTP is required");
      return;
    }

    if (!isValidOtp(form.otp)) {
      setError("OTP must be 6 digits");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });

      if (!res.ok) {
        const errorMessage = await handleApiError(res);
        setError(errorMessage);
        return;
      }

      const data = await res.json();
      setSuccess(data.message || "OTP verified successfully");
      setRemainingAttempts(null);
      setStep(3);

    } catch (err) {
      console.error("Network error in verifyOtp:", err);
      
      // Handle network errors
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to server. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!form.newPassword || !form.confirmNewPassword) {
      setError("All fields are required");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.newPassword.includes(" ")) {
      setError("Password cannot contain spaces");
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword,
        }),
      });

      if (!res.ok) {
        const errorMessage = await handleApiError(res);
        setError(errorMessage);
        return;
      }

      const data = await res.json();
      setSuccess(data.message || "Password updated successfully!");
      setRemainingAttempts(null);

      // Clear form after success
      setForm({
        email: "",
        otp: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      // NEW: Set redirect flag - your UI component should handle this
      // This allows the UI to show the success message and provide a manual redirect
      setRedirectToLogin(true);

    } catch (err) {
      console.error("Network error in resetPassword:", err);
      
      // Handle network errors
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to server. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setForm({
      email: "",
      otp: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setError(null);
    setSuccess(null);
    setRemainingAttempts(null);
    setRedirectToLogin(false);
  };

  return {
    step,
    form,
    error,
    success,
    loading,
    remainingAttempts,
    redirectToLogin,
    setStep,
    handleChange,
    sendOtp,
    verifyOtp,
    resetPassword,
    resetFlow,
  };
}