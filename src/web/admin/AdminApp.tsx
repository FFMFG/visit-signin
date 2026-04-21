import { NavLink, Route, Routes } from "react-router-dom";
import { OnSite } from "./OnSite";
import { History } from "./History";

export function AdminApp() {
  return (
    <div className="min-h-full bg-white text-[#1a1a2e]">
      <header className="border-b border-black/10 bg-[#1a1a2e] text-white px-6 py-4 flex items-center justify-between">
        <div className="font-bold tracking-widest text-sm text-[#00b4d8]">
          FFMFG VISITORS — ADMIN
        </div>
        <nav className="flex gap-2 text-sm">
          <AdminLink to="/admin/on-site">On-site</AdminLink>
          <AdminLink to="/admin/history">History</AdminLink>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<OnSite />} />
          <Route path="on-site" element={<OnSite />} />
          <Route path="history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1 rounded ${isActive ? "bg-[#00b4d8] text-[#1a1a2e]" : "text-white/70 hover:text-white"}`
      }
    >
      {children}
    </NavLink>
  );
}
