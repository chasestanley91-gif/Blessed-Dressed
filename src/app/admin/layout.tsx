import AdminShell from "./AdminShell";

export const metadata = { title: "Admin — Blessed & Dressed" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
