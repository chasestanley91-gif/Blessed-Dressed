"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="font-sans inline-flex items-center gap-2 rounded-full border border-border-accent px-4 py-2 text-xs text-muted-dark transition-colors hover:border-[#EF4444]/40 hover:text-[#EF4444]"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <path d="M4.5 6H10M8 4l2 2-2 2M7 2H2.5A.5.5 0 002 2.5v7a.5.5 0 00.5.5H7" />
      </svg>
      Log out
    </button>
  );
}
