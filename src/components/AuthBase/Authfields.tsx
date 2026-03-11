// AuthFields.tsx
// Named exports only — no default component export.
// Exports:
//   AuthFieldWrapper — spacing wrapper for a field
//   AuthLabel        — styled label
//   AuthInput        — styled text/email/password input
//   AuthButton       — full-width submit button
//   AuthError        — red error message box
//   AuthSuccess      — green success message box
//   AuthLink         — orange anchor/Link styled text

import {
  Box,
  Button,
  FormLabel,
  InputBase,
  Typography,
  useTheme,
  type ButtonProps,
  type InputBaseProps,
} from "@mui/material";

export function AuthFieldWrapper({ children }: { children: React.ReactNode }) {
  return <Box sx={{ mb: 2.5 }}>{children}</Box>;
}

export function AuthLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <FormLabel
      htmlFor={htmlFor}
      sx={{
        display:    "block",
        fontSize:   14,
        fontWeight: 500,
        mb:         0.75,
        color:      theme.palette.text.secondary,
      }}
    >
      {children}
    </FormLabel>
  );
}

export function AuthInput(props: InputBaseProps & { id?: string }) {
  const theme = useTheme();
  return (
    <InputBase
      fullWidth
      {...props}
      sx={{
        px:              1.5,
        py:              1.25,
        fontSize:        14,
        border:          `1px solid ${theme.palette.divider}`,
        borderRadius:    `${theme.shape.borderRadius}px`,
        backgroundColor: theme.palette.background.paper,
        color:           theme.palette.text.primary,
        transition:      "border-color 0.2s, box-shadow 0.2s",
        "& input::placeholder": {
          color:   theme.palette.text.disabled,
          opacity: 1,
        },
        "&.Mui-focused": {
          borderColor: theme.palette.primary.main,
          boxShadow:   `0 0 0 3px ${theme.palette.primary.main}26`,
        },
        "&.Mui-disabled": {
          backgroundColor: theme.palette.action?.disabledBackground,
          color:           theme.palette.text.disabled,
          cursor:          "not-allowed",
        },
        ...props.sx,
      }}
    />
  );
}

export function AuthButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      fullWidth
      variant="contained"
      color="primary"
      size="large"
      type="submit"
      {...props}
      sx={{
        fontWeight:    600,
        fontSize:      16,
        textTransform: "none",
        borderRadius:  1.5,
        py:            1.5,
        boxShadow:     "none",
        "&:hover": {
          boxShadow: "none",
          filter:    "brightness(0.95)",
          transform: "translateY(-1px)",
        },
        "&:active":       { transform: "translateY(0)" },
        "&.Mui-disabled": { opacity: 0.6 },
        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        mb:              2.5,
        px:              1.5,
        py:              1.5,
        borderRadius:    `${theme.shape.borderRadius}px`,
        border:          `1px solid ${theme.palette.error.main}66`,
        backgroundColor:
          theme.palette.mode === "dark"
            ? `${theme.palette.error.main}22`
            : "#fef2f2",
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: theme.palette.error.main, lineHeight: 1.5 }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export function AuthSuccess({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        mb:              2.5,
        px:              1.5,
        py:              1.5,
        borderRadius:    `${theme.shape.borderRadius}px`,
        border:          `1px solid ${theme.palette.success.main}66`,
        backgroundColor:
          theme.palette.mode === "dark"
            ? `${theme.palette.success.main}22`
            : "#d1fae5",
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: theme.palette.success.main, lineHeight: 1.5 }}
      >
        {children}
      </Typography>
    </Box>
  );
}

// Usage: <AuthLink component={Link} to="/forgot-password">Forgot password?</AuthLink>
export function AuthLink({
  children,
  component,
  to,
  ...props
}: {
  children:   React.ReactNode;
  component?: React.ElementType;
  to?:        string;
  [key: string]: unknown;
}) {
  const theme = useTheme();
  return (
    <Typography
      component={component ?? "a"}
      {...(to ? { to } : {})}
      {...props}
      variant="body2"
      sx={{
        color:          theme.palette.primary.main,
        fontWeight:     600,
        textDecoration: "none",
        cursor:         "pointer",
        "&:hover": {
          textDecoration: "underline",
          color:          theme.palette.primary.dark,
        },
      }}
    >
      {children}
    </Typography>
  );
}