import { useEffect, useMemo, useState } from "react";
import type { Host } from "@shared/types";
import { Layout, TextField } from "../components/Layout";

export function HostPicker({
  onPick,
  onBack,
}: {
  onPick: (h: Host) => void;
  onBack: () => void;
}) {
  const [all, setAll] = useState<Host[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/hosts");
        const body = (await resp.json()) as { hosts: Host[] };
        if (!cancelled) setAll(body.hosts);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return all;
    return all.filter(
      (h) =>
        h.displayName.toLowerCase().includes(needle) ||
        h.email.toLowerCase().includes(needle),
    );
  }, [all, q]);

  return (
    <Layout onBack={onBack} title="Who are you here to see?">
      <div className="mb-4">
        <TextField label="Search" value={q} onChange={setQ} placeholder="Name or email" />
      </div>
      {loading ? (
        <div className="text-white/50 text-center py-12">Loading hosts…</div>
      ) : (
        <div className="grid gap-2 max-h-[55vh] overflow-auto pr-2">
          {filtered.map((h) => (
            <button
              type="button"
              key={h.entraId}
              onClick={() => onPick(h)}
              className="text-left px-4 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.99] transition-all"
            >
              <div className="font-semibold text-lg">{h.displayName}</div>
              <div className="text-sm text-white/50">{h.email}</div>
            </button>
          ))}
          {filtered.length === 0 ? (
            <div className="text-white/50 text-center py-8">No matching host.</div>
          ) : null}
        </div>
      )}
    </Layout>
  );
}
