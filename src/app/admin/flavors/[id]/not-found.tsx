import Link from "next/link";

export default function FlavorNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-10 w-10 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground mb-2">
          Flavor Not Found
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The humor flavor you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider text-sm hover:bg-primary-hover transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Flavors
        </Link>
      </div>
    </div>
  );
}
