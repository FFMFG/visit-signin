import { useEffect, useState } from "react";
import type { VisitorIdentity } from "@shared/types";
import { BigButton, Layout, TextField } from "../components/Layout";

export function Identity({
  onNext,
  onBack,
}: {
  onNext: (id: VisitorIdentity) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [returning, setReturning] = useState<{ name: string; company?: string | null } | null>(null);
  const [dirty, setDirty] = useState(false);

  // When email+phone match a prior visit, offer to prefill.
  useEffect(() => {
    const emailOk = /@.+\..+/.test(email);
    const phoneOk = phone.replace(/\D/g, "").length >= 7;
    if (!emailOk || !phoneOk || dirty) {
      setReturning(null);
      return;
    }
    const ctrl = new AbortController();
    fetch(
      `/api/visits/recent-visitor?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`,
      { signal: ctrl.signal },
    )
      .then((r) => r.json())
      .then((body) => {
        if ((body as { found: boolean }).found) {
          setReturning(body as { name: string; company?: string | null });
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [email, phone, dirty]);

  const valid =
    name.trim().length > 1 &&
    /@.+\..+/.test(email) &&
    phone.replace(/\D/g, "").length >= 7;

  return (
    <Layout onBack={onBack} title="Who are you?">
      {returning && !dirty ? (
        <div className="bg-[#00b4d8]/15 border border-[#00b4d8]/40 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="font-semibold">Welcome back, {returning.name}</div>
            {returning.company ? (
              <div className="text-sm text-white/60">from {returning.company}</div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-[#00b4d8] text-[#1a1a2e] text-sm font-semibold"
              onClick={() =>
                onNext({
                  name: returning.name,
                  email,
                  phone,
                  company: returning.company ?? undefined,
                })
              }
            >
              That's me
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-white/10 text-sm"
              onClick={() => {
                setDirty(true);
                setName("");
                setCompany("");
              }}
            >
              Not me
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-5">
        <TextField label="Full name" value={name} onChange={setName} autoComplete="name" />
        <TextField
          label="Company (optional)"
          value={company}
          onChange={setCompany}
          autoComplete="organization"
        />
        <TextField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          inputMode="email"
          autoComplete="email"
        />
        <TextField
          label="Phone"
          value={phone}
          onChange={setPhone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
        />
        <div className="mt-4">
          <BigButton
            disabled={!valid}
            onClick={() =>
              onNext({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                company: company.trim() || undefined,
              })
            }
          >
            Continue
          </BigButton>
        </div>
      </div>
    </Layout>
  );
}
