"use client";

import { cn } from "@/lib/utils";
import {
  authorDisplayName,
  authorInitials,
  isResidentComment,
  type CommentAuthor,
} from "@/lib/maintenance-comments";

export type ThreadComment = {
  id: string;
  userId?: string;
  text: string;
  createdAt?: string;
  user?: CommentAuthor;
};

type CommentThreadProps = Readonly<{
  comments: ThreadComment[];
  residentId: string;
  formatDate: (value?: string) => string;
}>;

export function CommentThread({
  comments,
  residentId,
  formatDate,
}: CommentThreadProps) {
  const ordered = [...comments].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });

  return (
    <div className="space-y-3">
      {ordered.map((comment) => {
        const fromResident = isResidentComment(comment, residentId);
        const name =
          authorDisplayName(comment.user) ||
          (fromResident ? "Resident" : "Facility Manager");
        const roleLabel = fromResident ? "Resident" : "Facility Manager";
        const initials = authorInitials(name) || (fromResident ? "R" : "E");

        return (
          <div
            key={comment.id}
            className={cn(
              "flex items-end gap-2",
              fromResident ? "flex-row" : "flex-row-reverse",
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide",
                fromResident
                  ? "bg-muted text-foreground"
                  : "bg-[#0150AC] text-white",
              )}
              aria-hidden
            >
              {initials}
            </div>
            <div
              className={cn(
                "max-w-[min(100%,20rem)] min-w-0 rounded-2xl px-3 py-2",
                fromResident
                  ? "rounded-bl-md bg-muted text-foreground"
                  : "rounded-br-md bg-[#0150AC] text-white",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-[13px] font-semibold leading-tight tracking-[-0.01em]">
                  {name}
                </p>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wide",
                    fromResident ? "text-muted-foreground" : "text-white/75",
                  )}
                >
                  {roleLabel}
                </span>
              </div>
              <p className="mt-1 text-sm leading-snug whitespace-pre-wrap">
                {comment.text}
              </p>
              <p
                className={cn(
                  "mt-1 text-[11px] tabular-nums",
                  fromResident ? "text-muted-foreground" : "text-white/70",
                )}
              >
                {formatDate(comment.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
