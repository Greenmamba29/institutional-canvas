import { Outlet } from "react-router-dom";
import { LayoutShell } from "./LayoutShell";

/**
 * AppLayout — Persistent layout wrapper using React Router's Outlet pattern.
 * LayoutShell is mounted ONCE for the entire authenticated session.
 * Page transitions swap only the <Outlet /> content — the sidebar never remounts.
 */
export function AppLayout() {
  return (
    <LayoutShell>
      <Outlet />
    </LayoutShell>
  );
}
