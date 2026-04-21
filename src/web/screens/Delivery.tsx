import { useState } from "react";
import type { CreateDeliveryRequest } from "@shared/types";
import { BigButton, Layout, TextField } from "../components/Layout";
import { SignatureCanvas } from "../components/SignatureCanvas";

export function Delivery({
  onDone,
  onBack,
}: {
  onDone: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [carrier, setCarrier] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !signature) return;
    setSubmitting(true);
    const body: CreateDeliveryRequest = {
      identity: { name: name.trim() },
      carrier: carrier.trim() || undefined,
      signatureDataUrl: signature,
    };
    await fetch("/api/deliveries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    onDone();
  };

  return (
    <Layout onBack={onBack} title="Delivery / Pickup" subtitle="Quick receipt, no full sign-in needed.">
      <div className="grid gap-5">
        <TextField label="Your name" value={name} onChange={setName} autoComplete="name" />
        <TextField
          label="Carrier (UPS, FedEx, USPS, etc.)"
          value={carrier}
          onChange={setCarrier}
        />
        <div>
          <div className="text-sm uppercase tracking-wider text-[#6c757d] mb-2">Signature</div>
          <SignatureCanvas onChange={setSignature} height={160} />
        </div>
        <BigButton onClick={submit} disabled={!name.trim() || !signature || submitting}>
          {submitting ? "Saving…" : "Done"}
        </BigButton>
      </div>
    </Layout>
  );
}
