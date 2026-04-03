"use client";

import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
      secondary:
        "bg-card-bg text-foreground border border-card-border hover:border-primary/40 hover:bg-primary/5 focus:ring-primary",
      accent:
        "bg-accent text-white hover:bg-accent-hover focus:ring-accent shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30",
      destructive:
        "bg-destructive text-white hover:bg-destructive-hover focus:ring-destructive shadow-lg shadow-destructive/25",
      ghost:
        "text-muted-foreground hover:text-foreground hover:bg-primary/10 focus:ring-primary",
    };

    const sizes = {
      sm: "text-[10px] px-3 py-1.5",
      md: "text-xs px-4 py-2",
      lg: "text-sm px-6 py-3",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
