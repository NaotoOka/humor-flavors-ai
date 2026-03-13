"use client";

import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminHeaderProps {
  profile: {
    first_name: string | null;
    email: string | null;
    is_superadmin: boolean;
    is_matrix_admin: boolean;
  };
}

export function AdminHeader({ profile }: AdminHeaderProps) {
  const adminType = profile.is_superadmin ? "Super Admin" : "Matrix Admin";

  return (
    <header className="sticky top-0 z-50 border-b border-card-border bg-card-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-4">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <Image
                src="/logo.png"
                alt="Humor Flavors logo"
                width={90}
                height={90}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-primary">
                Humor Flavors
              </h1>
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">
                Matrix System
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-foreground">
              {profile.first_name || profile.email?.split("@")[0] || "Admin"}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent">
              {adminType}
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
