import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const useSignupLogic = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // this will validate if user has entered full name or not 
  const isValidFullName = (name: string) => {
  const trimmed = name.trim();
  return /^[A-Za-z]+(\s+[A-Za-z]+)+$/.test(trimmed);
}

  // this will validate the email entered by the user 
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // this will handle the input change 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // this will check all the client side validation and send the request to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!isValidFullName(form.fullName)) {
      setError("Please enter your full name (first and last name)");
      return;
    }

    if (!isValidEmail(form.email)) {
      setError("Invalid email format");
      return;
    }

    // this will check if password length is between 6 to 12 characters
    if (form.password.length < 6 || form.password.length > 12) {
      setError("Password must be between 6 and 12 characters");
      return;
    }

    // this will check if password contains any spaces
    if (form.password.includes(" ")) {
      setError("Password cannot contain spaces");
      return;
    }

    // this will check if password contains at least one capital letter
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must include at least one capital letter");
      return;
    }

    // this will check if password contains at least one number
    if (!/[0-9]/.test(form.password)) {
      setError("Password must include at least one number");
      return;
    }

    // this will check if password contains at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      setError("Password must include at least one special character");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // this will send the signup request to the backend 
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      }),
    });

    // this will parse the json response 
    const data = await res.json();

    if (!res.ok) {
      setError(data.message);
      return;
    }

    setSuccess(true);

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", String(data.user.id));

    // this will reset the form fields 
    setForm({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

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