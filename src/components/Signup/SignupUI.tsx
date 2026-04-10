/*  
*  FILE          : SignupUI.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    UI component for the user signup form with validation fields.
*/ 

import { Link } from "react-router-dom";
import { Box, Typography, useTheme } from "@mui/material";
import AuthBaseLayout from "../AuthBase/AuthBaseLayout";
import {
  AuthFieldWrapper,
  AuthLabel,
  AuthInput,
  AuthButton,
  AuthError,
  AuthSuccess,
  AuthLink,
} from "../AuthBase/Authfields";
import { useSignupLogic } from "./SignupLogic";
import styles from "./Signup.module.css";

export default function SignupUI() {
  const { form, error, success, handleChange, handleSubmit } = useSignupLogic();
  const theme = useTheme();

  return (
    <AuthBaseLayout
      title="Create Account"
      subtitle="Sign up to get started — it's free."
    >
      <form onSubmit={handleSubmit}>

        {/* Full Name */}
        <AuthFieldWrapper>
          <AuthLabel htmlFor="fullName">Full Name</AuthLabel>
          <AuthInput
            id="fullName"
            type="text"
            name="fullName"
            placeholder="Sample Name"
            value={form.fullName}
            onChange={handleChange}
          />
        </AuthFieldWrapper>

        {/* Email */}
        <AuthFieldWrapper>
          <AuthLabel htmlFor="email">Email Address</AuthLabel>
          <AuthInput
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
          />
        </AuthFieldWrapper>

        {/* Password */}
        <AuthFieldWrapper>
          <AuthLabel htmlFor="password">Password</AuthLabel>
          <AuthInput
            id="password"
            type="password"
            name="password"
            placeholder="········"
            value={form.password}
            onChange={handleChange}
          />
        </AuthFieldWrapper>

        {/* Confirm Password */}
        <AuthFieldWrapper>
          <AuthLabel htmlFor="confirmPassword">Confirm Password</AuthLabel>
          <AuthInput
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="········"
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </AuthFieldWrapper>

        {/* Error message */}
        {error && (
          <AuthError>{error}</AuthError>
        )}

        {/* Success message */}
        {success && (
          <AuthSuccess>Account created successfully!</AuthSuccess>
        )}

        {/* Submit button */}
        <AuthButton type="submit">
          Create Account
        </AuthButton>

        {/* Login redirect */}
        <Box sx={{ mt: 1.5, textAlign: "center" }}>
          <AuthLink component={Link} to="/login">
            Already have an account? Login
          </AuthLink>
        </Box>

        {/* Trust badges */}
        <Box className={styles.trustBadges}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            🔒 Secure
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            ·
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            ✦ Free forever
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            ·
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            ⚡ No credit card
          </Typography>
        </Box>

      </form>
    </AuthBaseLayout>
  );
}