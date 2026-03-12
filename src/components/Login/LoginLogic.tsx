// frontend/src/components/Login/LoginLogic.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const useLoginLogic = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // this will validate the email entered by the user
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // this will handle the input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // this will check all the client side validation and send the request to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    if (!isValidEmail(form.email)) {
      setError("Invalid email format");
      return;
    }

    // this will check if password contains any spaces
    if (form.password.includes(" ")) {
      setError("Password cannot contain spaces");
      return;
    }

    // this will send the login request to the backend
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    // this will parse the json response
    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Login failed");
      return;
    }

    setSuccess(true);

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", String(data.user.id));

    // navigate to your calendar/main page
    navigate("/main");
  };

  return {
    form,
    error,
    success,
    handleChange,
    handleSubmit,
  };
};