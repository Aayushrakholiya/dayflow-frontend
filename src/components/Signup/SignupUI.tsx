import Dayflow from '../../assets/Dayflow.png'
import { Link } from "react-router-dom";
import { useSignupLogic } from './SignupLogic';
import styles from './Signup.module.css';

export default function SignupUI() {
  const { form, error, success, handleChange, handleSubmit } = useSignupLogic();

  return (
    <div className={styles.container}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <img 
          src={Dayflow} 
          alt="Dayflow Logo" 
          className={styles.logoImage}
        />
      </div>

      {/* Form */}
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          <h2 className={styles.title}>
            Create Account
          </h2>
          <p className={styles.subtitle}>
            Sign up to get started
          </p>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Sample Name"
                value={form.fullName}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            {/* Email */}
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            {/* Password */}
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="********"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            {/* Confirm password */}
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="********"
                value={form.confirmPassword}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className={styles.successMessage}>
                Account created successfully!
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              
            >
              Create Account
            </button>
            <div className={styles.loginRedirectWrapper}>
           <Link to="/login">Already have an account? Login</Link>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}