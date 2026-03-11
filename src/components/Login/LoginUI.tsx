// LoginUI.tsx

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
import { useLoginLogic } from "./LoginLogic";

export default function LoginUI() {
  const { form, error, success, handleChange, handleSubmit } = useLoginLogic();
  const theme = useTheme();

  return (
    <AuthBaseLayout
      title="Welcome Back"
      subtitle="Login to access your Dayflow calendar"
    >
      {error   && <AuthError>{error}</AuthError>}
      {success && <AuthSuccess>Login successful!</AuthSuccess>}

      <form onSubmit={handleSubmit}>
        <AuthFieldWrapper>
          <AuthLabel htmlFor="email">Email</AuthLabel>
          <AuthInput
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </AuthFieldWrapper>

        <AuthFieldWrapper>
          <AuthLabel htmlFor="password">Password</AuthLabel>
          <AuthInput
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </AuthFieldWrapper>

        <AuthButton type="submit">Login</AuthButton>

        <Box sx={{ mt: 1.25, textAlign: "center" }}>
          <AuthLink component={Link} to="/forgot-password">
            Forgot Password?
          </AuthLink>
        </Box>

        <Box sx={{ mt: 1.5, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Don&apos;t have an account?{" "}
            <AuthLink component={Link} to="/signup">
              Sign up
            </AuthLink>
          </Typography>
        </Box>
      </form>
    </AuthBaseLayout>
  );
}