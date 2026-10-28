"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabId = "ruleta" | "pila" | "agregar";

function activeTab(pathname: string): TabId | null {
  if (pathname === "/") return "ruleta";
  if (pathname.startsWith("/pila/nueva")) return "agregar";
  if (pathname.startsWith("/pila")) return "pila";
  return null;
}

const iconProps = {
  "aria-hidden": true,
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const tabs: { id: TabId; href: string; label: string; icon: React.ReactNode }[] = [
  {
    id: "ruleta",
    href: "/",
    label: "Ruleta",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l6 4.5" />
        <circle cx="12" cy="12" r="1.2" />
      </svg>
    ),
  },
  {
    id: "pila",
    href: "/pila",
    label: "Mi pila",
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="4" width="16" height="4" rx="1" />
        <rect x="3" y="10" width="17" height="4" rx="1" />
        <rect x="5" y="16" width="15" height="4" rx="1" />
      </svg>
    ),
  },
  {
    id: "agregar",
    href: "/pila/nueva",
    label: "Agregar",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const current = activeTab(usePathname());

  return (
    <nav
      aria-label="Principal"
      className="sticky bottom-0 mt-auto bg-tinta pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="mx-auto flex max-w-md justify-around px-5">
        {tabs.map((tab) => {
          const active = tab.id === current;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 min-w-16 flex-col items-center gap-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza ${
                active ? "font-bold text-mostaza" : "font-medium text-crema-suave"
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
