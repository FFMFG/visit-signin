import { useEffect, useState } from "react";
import type { Visit } from "@shared/types";

export function History() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/visits")
      .then((r) => r.json())
      .then((body: { visits: Visit[] }) => {
        setVisits(body.visits);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Visit history (last 30 days)</h1>
      {loading ? <div className="text-black/50">Loading…</div> : null}
      <table className="w-full text-sm">
        <thead className="text-left border-b border-black/10">
          <tr className="text-black/60 font-semibold">
            <th className="py-2">When</th>
            <th className="py-2">Visitor</th>
            <th className="py-2">Host</th>
            <th className="py-2">Purpose</th>
            <th className="py-2">Status</th>
            <th className="py-2">Records</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr
              key={v.id}
              className={`border-b border-black/5 ${v.escortRequired ? "bg-[#e76f51]/5" : ""}`}
            >
              <td className="py-2 whitespace-nowrap">
                {new Date(v.checkInAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              <td className="py-2">
                <div className="font-medium">{v.visitorName}</div>
                <div className="text-xs text-black/50">
                  {v.visitorCompany ?? "—"} · {v.citizenship === "foreign_national" ? "FN" : "US"}
                </div>
              </td>
              <td className="py-2">{v.hostDisplayName}</td>
              <td className="py-2">{v.purpose}</td>
              <td className="py-2">
                {v.checkOutAt ? (
                  <span className="text-black/60">
                    Out {new Date(v.checkOutAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {v.checkOutMethod === "auto" ? " (auto)" : ""}
                  </span>
                ) : (
                  <span className="text-[#0077b6] font-semibold">On-site</span>
                )}
              </td>
              <td className="py-2">
                <div className="flex gap-2">
                  <a
                    className="text-[#0077b6] hover:underline"
                    href={`/api/artifacts/${encodeURIComponent(v.photoKey)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Photo
                  </a>
                  <a
                    className="text-[#0077b6] hover:underline"
                    href={`/api/artifacts/${encodeURIComponent(v.ndaPdfKey)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    NDA
                  </a>
                  {v.badgePdfKey ? (
                    <a
                      className="text-[#0077b6] hover:underline"
                      href={`/api/artifacts/${encodeURIComponent(v.badgePdfKey)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Badge
                    </a>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {!loading && visits.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-10 text-center text-black/50">
                No visits yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
