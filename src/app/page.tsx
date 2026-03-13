import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, check their profile and redirect accordingly
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_superadmin, is_matrix_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_superadmin || profile?.is_matrix_admin) {
      redirect("/admin");
    }
    // User is logged in but not an admin - show access denied
    return <AccessDenied userEmail={user.email} />;
  }

  // Show login page for unauthenticated users
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden relative z-0">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px]" />
      </div>

      <main className="glass-card flex w-full max-w-md flex-col items-center gap-8 rounded-3xl p-10 shadow-2xl z-10 relative border-accent/20">
        {/* Glow effect around the card */}
        <div className="absolute inset-x-0 -top-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-75"></div>
        
        {/* Logo/Brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl"></div>
            <Image
              src="/logo.png"
              alt="Humor Flavors logo"
              width={100}
              height={100}
              className="relative h-28 w-auto drop-shadow-2xl transition-transform hover:scale-105 hover:-rotate-2 duration-300"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-400 dark:to-purple-300 bg-clip-text text-transparent pb-1">
              Humor Flavors
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-card-border" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Sign in</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-card-border" />
        </div>

        {/* Login Button */}
        <div className="w-full">
          <LoginButton />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted/80">
          Access restricted to authorized administrators only.
        </p>
      </main>
    </div>
  );
}

function AccessDenied({ userEmail }: { userEmail: string | undefined }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden relative z-0">
       {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[120px]" />
      </div>

      <main className="glass-card flex w-full max-w-md flex-col items-center gap-8 rounded-3xl p-10 shadow-2xl z-10 relative">
        <div className="absolute inset-x-0 -top-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
        
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40 shadow-inner rotate-3">
          <svg
            className="h-10 w-10 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent pb-1">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access the admin portal.
          </p>
          {userEmail && (
            <div className="mt-4 rounded-lg bg-card-bg/50 p-3 border border-card-border shadow-sm">
              <p className="text-sm text-muted">
                Signed in as: <span className="font-semibold text-foreground">{userEmail}</span>
              </p>
            </div>
          )}
        </div>
        <form action="/auth/signout" method="post" className="w-full mt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-card-border/50 hover:shadow-sm"
          >
            Sign out and try another account
          </button>
        </form>
      </main>
    </div>
  );
}
