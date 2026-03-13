"use client";

import { forwardRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[100px] ${
            error ? "border-destructive focus:ring-destructive/50" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-[10px] font-bold text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
