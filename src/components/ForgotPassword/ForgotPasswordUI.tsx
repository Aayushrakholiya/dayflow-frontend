// ForgotPasswordUI.tsx

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";

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
import { useForgotPasswordLogic } from "./ForgotPasswordLogic";
import styles from "./ForgotPassword.module.css";

// Step indicator
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className={styles.stepIndicator}>
      {[1, 2, 3].map((n, i) => (
        <>
          <div
            key={n}
            className={`${styles.stepDot} ${current >= n ? styles.active : ""}`}
          >
            {n}
          </div>
          {i < 2 && <div key={`line-${n}`} className={styles.stepLine} />}
        </>
      ))}
    </div>
  );
}

// Step 1 — Email
function StepEmail({
  form,
  error,
  loading,
  handleChange,
  sendOtp,
}: {
  form: { email: string };
  error: string | null;
  loading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendOtp: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={sendOtp}>
      {error && <AuthError>{error}</AuthError>}

      <AuthFieldWrapper>
        <AuthLabel htmlFor="email">Email address</AuthLabel>
        <AuthInput
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          autoComplete="email"
          disabled={loading}
        />
      </AuthFieldWrapper>

      <AuthButton disabled={loading}>
        {loading ? <CircularProgress size={20} color="inherit" /> : "Send OTP"}
      </AuthButton>

      <Box sx={{ mt: 1.5, textAlign: "center" }}>
        <AuthLink component={Link} to="/login">
          Back to login
        </AuthLink>
      </Box>
    </form>
  );
}

// Step 2 — OTP
function StepOtp({
  form,
  error,
  success,
  loading,
  remainingAttempts,
  handleChange,
  verifyOtp,
  onResend,
}: {
  form: { otp: string };
  error: string | null;
  success: string | null;
  loading: boolean;
  remainingAttempts: number | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  verifyOtp: (e: React.FormEvent) => void;
  onResend: () => void;
}) {
  const theme = useTheme();
  return (
    <form onSubmit={verifyOtp}>
      {error   && <AuthError>{error}</AuthError>}
      {success && <AuthSuccess>{success}</AuthSuccess>}

      {remainingAttempts !== null && (
        <Typography variant="body2" sx={{ mb: 2, color: theme.palette.error.main, fontWeight: 500 }}>
          {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
        </Typography>
      )}

      <AuthFieldWrapper>
        <AuthLabel htmlFor="otp">6-digit OTP</AuthLabel>
        <AuthInput
          id="otp"
          type="text"
          name="otp"
          value={form.otp}
          onChange={handleChange}
          placeholder="Enter OTP"
          inputProps={{ maxLength: 6 }}
          disabled={loading}
        />
      </AuthFieldWrapper>

      <AuthButton disabled={loading}>
        {loading ? <CircularProgress size={20} color="inherit" /> : "Verify OTP"}
      </AuthButton>

      <Box sx={{ mt: 1.5, textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Didn&apos;t receive it?{" "}
          <AuthLink onClick={onResend} component="span">
            Resend OTP
          </AuthLink>
        </Typography>
      </Box>
    </form>
  );
}

// Step 3 — New password
function StepReset({
  form,
  error,
  loading,
  handleChange,
  resetPassword,
}: {
  form: { newPassword: string; confirmNewPassword: string };
  error: string | null;
  loading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetPassword: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={resetPassword}>
      {error && <AuthError>{error}</AuthError>}

      <AuthFieldWrapper>
        <AuthLabel htmlFor="newPassword">New password</AuthLabel>
        <AuthInput
          id="newPassword"
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          placeholder="Min. 6 characters, no spaces"
          autoComplete="new-password"
          disabled={loading}
        />
      </AuthFieldWrapper>

      <AuthFieldWrapper>
        <AuthLabel htmlFor="confirmNewPassword">Confirm password</AuthLabel>
        <AuthInput
          id="confirmNewPassword"
          type="password"
          name="confirmNewPassword"
          value={form.confirmNewPassword}
          onChange={handleChange}
          placeholder="Repeat your new password"
          autoComplete="new-password"
          disabled={loading}
        />
      </AuthFieldWrapper>

      <AuthButton disabled={loading}>
        {loading ? <CircularProgress size={20} color="inherit" /> : "Reset Password"}
      </AuthButton>
    </form>
  );
}

// Success screen
function SuccessScreen() {
  const theme = useTheme();
  return (
    <div className={styles.successScreen}>
      <div className={styles.successIcon}>
        <CheckCircleOutline fontSize="inherit" />
      </div>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary }}>
        Password reset!
      </Typography>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
        Your password has been updated successfully.
      </Typography>
      <AuthLink component={Link} to="/login">
        Go to login
      </AuthLink>
    </div>
  );
}

// Subtitles per step
const SUBTITLES: Record<number, string> = {
  1: "Enter your email and we'll send you a one-time code",
  2: "Enter the 6-digit code sent to your email",
  3: "Choose a new password for your account",
};

export default function ForgotPasswordUI() {
  const navigate = useNavigate();
  const {
    step,
    form,
    error,
    success,
    loading,
    remainingAttempts,
    redirectToLogin,
    handleChange,
    sendOtp,
    verifyOtp,
    resetPassword,
    resetFlow,
  } = useForgotPasswordLogic();

  // Auto-redirect after success
  useEffect(() => {
    if (!redirectToLogin) return;
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [redirectToLogin, navigate]);

  // Resend resets back to step 1 with the email pre-filled
  const handleResend = () => {
    resetFlow();
  };

  return (
    <AuthBaseLayout
      title="Forgot Password"
      subtitle={redirectToLogin ? undefined : SUBTITLES[step]}
    >
      {!redirectToLogin && <StepIndicator current={step} />}

      {redirectToLogin ? (
        <SuccessScreen />
      ) : step === 1 ? (
        <StepEmail
          form={form}
          error={error}
          loading={loading}
          handleChange={handleChange}
          sendOtp={sendOtp}
        />
      ) : step === 2 ? (
        <StepOtp
          form={form}
          error={error}
          success={success}
          loading={loading}
          remainingAttempts={remainingAttempts}
          handleChange={handleChange}
          verifyOtp={verifyOtp}
          onResend={handleResend}
        />
      ) : (
        <StepReset
          form={form}
          error={error}
          loading={loading}
          handleChange={handleChange}
          resetPassword={resetPassword}
        />
      )}
    </AuthBaseLayout>
  );
}