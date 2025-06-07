"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function EnhancedSignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp" | "forgotPassword">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  
  const requestPasswordReset = useMutation(api.auth.requestPasswordReset);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setSendingReset(true);
    try {
      await requestPasswordReset({ email: resetEmail.trim() });
      toast.success("Password reset link sent! Check your email.");
      setFlow("signIn");
      setResetEmail("");
    } catch (error) {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setSendingReset(false);
    }
  };

  if (flow === "forgotPassword") {
    return (
      <div className="w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <form className="flex flex-col gap-4" onSubmit={handlePasswordReset}>
          <input
            className="auth-input-field"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Enter your email address"
            required
          />
          
          <button 
            className="forgot-password-button"
            type="submit" 
            disabled={sendingReset}
          >
            {sendingReset ? "Sending Reset Link..." : "Send Password Reset Link"}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline font-medium cursor-pointer transition-colors"
              onClick={() => {
                setFlow("signIn");
                setResetEmail("");
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        
        {/* Forgot Password Link - Only show on sign in */}
        {flow === "signIn" && (
          <div className="text-center">
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setFlow("forgotPassword")}
            >
              Forgot your password?
            </button>
          </div>
        )}
        
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button className="auth-button" onClick={() => void signIn("anonymous")}>
        Sign in anonymously
      </button>
    </div>
  );
}
