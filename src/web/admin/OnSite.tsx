import { useEffect, useState } from "react";
import type { Visit } from "@shared/types";

export function OnSite() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const res = await fetch("/api/admin/on-site");
    const body = (await res.json()) as { visits: Visit[] };
    setVisits(body.visits);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, []);

  const checkout = async (id: string) => {
    await fetch(`/api/visits/${id}/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method: "host" }),
    });
    refresh();
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold">Currently on-site</h1>
        <div className="text-sm text-black/50">
          {visits.length} visitor{visits.length === 1 ? "" : "s"}
        </div>
      </div>
      {loading ? <div className="text-black/50">Loading…</div> : null}
      {!loading && visits.length === 0 ? (
        <div className="bg-[#f0f0f5] rounded-xl p-10 text-center text-black/60">
          No one is currently checked in.
        </div>
      ) : null}
      <div className="grid gap-3">
        {visits.map((v) => (
          <div
            key={v.id}
            className={`rounded-xl border p-4 flex items-center gap-4 ${
              v.escortRequired
                ? "border-[#e76f51] bg-[#e76f51]/5"
                : "border-black/10 bg-white"
            }`}
          >
            <img
              src={`/api/artifacts/${encodeURIComponent(v.photoKey)}`}
              alt={v.visitorName}
              className="w-16 h-16 rounded-lg object-cover bg-black/10"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg truncate">
                {v.visitorName}
                {v.visitorCompany ? (
                  <span className="text-black/50 font-normal"> · {v.visitorCompany}</span>
                ) : null}
              </div>
              <div className="text-sm text-black/60">
                Visiting <span className="font-medium">{v.hostDisplayName}</span> ·{" "}
                {v.purpose} · checked in{" "}
                {new Date(v.checkInAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
              {v.escortRequired ? (
                <div className="text-xs font-semibold text-[#e76f51] mt-1">
                  ESCORT REQUIRED
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => checkout(v.id)}
              className="px-3 py-2 rounded-lg bg-[#0077b6] text-white text-sm font-semibold hover:bg-[#00b4d8] hover:text-[#1a1a2e]"
            >
              Sign out
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
