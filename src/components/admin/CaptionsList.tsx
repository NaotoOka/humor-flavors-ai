"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import type { HumorFlavor, CaptionWithImage } from "@/lib/types";

interface CaptionsListProps {
  profile: {
    first_name: string | null;
    email: string | null;
    is_superadmin: boolean;
    is_matrix_admin: boolean;
  };
  flavor: HumorFlavor;
  captions: CaptionWithImage[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export function CaptionsList({
  profile,
  flavor,
  captions,
  totalCount,
  currentPage,
  pageSize,
}: CaptionsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedCaptions, setExpandedCaptions] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleExpanded = (captionId: string) => {
    setExpandedCaptions((prev) => {
      const next = new Set(prev);
      if (next.has(captionId)) {
        next.delete(captionId);
      } else {
        next.add(captionId);
      }
      return next;
    });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/admin/flavors/${flavor.id}/captions?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <AdminHeader profile={profile} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Humor Flavors
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/admin/flavors/${flavor.id}`}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {flavor.slug}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-bold">Captions</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Captions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generated captions using{" "}
              <span className="text-primary font-bold">{flavor.slug}</span> flavor
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-sm font-bold">
              {totalCount} {totalCount === 1 ? "caption" : "captions"}
            </span>
            <Link href={`/admin/flavors/${flavor.id}`}>
              <Button variant="secondary" size="sm">
                <svg
                  className="h-4 w-4 mr-2"
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
                Back to Steps
              </Button>
            </Link>
          </div>
        </div>

        {/* Captions Grid */}
        {captions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              No Captions Yet
            </h3>
            <p className="text-sm text-muted-foreground">
              No captions have been generated using this humor flavor yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {captions.map((caption) => (
                <div
                  key={caption.id}
                  className="glass-card group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Image */}
                  {caption.images?.url && (
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <Image
                        src={caption.images.url}
                        alt="Caption source image"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  {/* Caption Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex gap-2">
                        {caption.is_featured && (
                          <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase">
                            Featured
                          </span>
                        )}
                        {caption.is_public && (
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">
                            Public
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
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
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="text-xs font-bold">{caption.like_count}</span>
                      </div>
                    </div>

                    <p
                      className={`text-sm text-foreground leading-relaxed ${
                        expandedCaptions.has(caption.id) ? "" : "line-clamp-3"
                      }`}
                    >
                      {caption.content || "No content"}
                    </p>

                    {caption.content && caption.content.length > 150 && (
                      <button
                        onClick={() => toggleExpanded(caption.id)}
                        className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors"
                      >
                        {expandedCaptions.has(caption.id)
                          ? "Show Less"
                          : "Show More"}
                      </button>
                    )}

                    <div className="mt-4 pt-4 border-t border-card-border flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {new Date(caption.created_datetime_utc).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {caption.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                          currentPage === pageNum
                            ? "bg-primary text-white"
                            : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
