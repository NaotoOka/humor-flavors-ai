import Link from "next/link";

export default function AuthError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-card-bg p-10 shadow-xl border border-card-border">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-muted-foreground">
            Something went wrong during authentication. Please try again.
          </p>
        </div>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Return to Login
        </Link>
      </main>
    </div>
  );
}
