import { useEffect, useState } from "react";
import type { Visit } from "@shared/types";
import { Layout, TextField } from "../components/Layout";

export function SignoutPick({
  onDone,
  onBack,
}: {
  onDone: () => void;
  onBack: () => void;
}) {
  const [open, setOpen] = useState<Visit[]>([]);
  const [q, setQ] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/visits/open")
      .then((r) => r.json() as Promise<{ visits: Visit[] }>)
      .then((body) => setOpen(body.visits));
  }, []);

  const filtered = open.filter((v) =>
    v.visitorName.toLowerCase().includes(q.toLowerCase().trim()),
  );

  const checkout = async (id: string) => {
    setSubmitting(id);
    await fetch(`/api/visits/${id}/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method: "self" }),
    });
    onDone();
  };

  return (
    <Layout onBack={onBack} title="Find your name">
      <div className="mb-4">
        <TextField label="Search" value={q} onChange={setQ} placeholder="Your name" />
      </div>
      <div className="grid gap-2 max-h-[55vh] overflow-auto pr-2">
        {filtered.map((v) => (
          <button
            type="button"
            key={v.id}
            disabled={submitting === v.id}
            onClick={() => checkout(v.id)}
            className="text-left px-4 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50"
          >
            <div className="font-semibold text-lg">{v.visitorName}</div>
            <div className="text-sm text-white/50">
              Visiting {v.hostDisplayName}
              {v.visitorCompany ? ` · ${v.visitorCompany}` : ""}
            </div>
          </button>
        ))}
        {open.length === 0 ? (
          <div className="text-center text-white/50 py-10">Nobody is currently checked in.</div>
        ) : null}
      </div>
    </Layout>
  );
}
