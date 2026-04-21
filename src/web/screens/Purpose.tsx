import { useState } from "react";
import type { PurposeCategory } from "@shared/types";
import { BigButton, Layout } from "../components/Layout";

const CHIPS: { label: string; value: PurposeCategory }[] = [
  { label: "Meeting", value: "meeting" },
  { label: "Interview", value: "interview" },
  { label: "Contractor", value: "contractor" },
  { label: "Audit", value: "audit" },
  { label: "Delivery", value: "delivery" },
  { label: "Other", value: "other" },
];

export function Purpose({
  onNext,
  onBack,
}: {
  onNext: (purpose: string, category: PurposeCategory) => void;
  onBack: () => void;
}) {
  const [cat, setCat] = useState<PurposeCategory>("meeting");
  const [text, setText] = useState("");

  return (
    <Layout onBack={onBack} title="What brings you in?">
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {CHIPS.map((c) => (
          <button
            type="button"
            key={c.value}
            onClick={() => setCat(c.value)}
            className={`px-4 py-2 rounded-full text-lg font-medium transition-all ${
              cat === c.value
                ? "bg-[#00b4d8] text-[#1a1a2e]"
                : "bg-white/10 hover:bg-white/15"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="A short note (optional)"
        className="w-full p-4 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:border-[#00b4d8] text-lg resize-none"
      />
      <div className="mt-6">
        <BigButton onClick={() => onNext(text.trim() || defaultPurpose(cat), cat)}>
          Continue
        </BigButton>
      </div>
    </Layout>
  );
}

function defaultPurpose(cat: PurposeCategory): string {
  switch (cat) {
    case "meeting":
      return "Meeting";
    case "interview":
      return "Interview";
    case "contractor":
      return "Contractor on-site";
    case "audit":
      return "Audit";
    case "delivery":
      return "Delivery";
    default:
      return "Visit";
  }
}
