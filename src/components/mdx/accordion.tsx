"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Accordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-foreground/[0.1]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 bg-foreground/[0.03] px-4 py-3 text-left transition-colors hover:bg-foreground/[0.06]"
      >
        <span className="text-[13.5px] font-medium text-foreground/80">{title}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-foreground/40 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-foreground/[0.08] px-4 py-3 text-[13.5px] leading-relaxed text-foreground/65">
          {children}
        </div>
      )}
    </div>
  );
}