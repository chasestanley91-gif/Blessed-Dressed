"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import type { SiteSettings } from "@/data/site-settings";

/** Public shop chrome. Hidden on /admin — that area has its own sidebar. */
export default function SiteChrome({
  nav,
  footer,
  children,
}: {
  nav: SiteSettings["nav"];
  footer: ReactNode;
  children: ReactNode;
}) {
  const isAdmin = usePathname().startsWith("/admin");
  return (
    <>
      {!isAdmin && <Nav nav={nav} />}
      <div id="content">{children}</div>
      {!isAdmin && footer}
    </>
  );
}
