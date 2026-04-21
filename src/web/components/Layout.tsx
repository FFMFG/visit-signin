import type { ReactNode } from "react";

export function Layout({
  title,
  subtitle,
  children,
  footer,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="min-h-full flex flex-col px-10 py-8 bg-[#1a1a2e] text-white">
      <header className="flex items-center justify-between mb-8">
        <div className="text-[#00b4d8] font-bold tracking-widest text-sm">
          FINAL FRONTIER MFG
        </div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-[#6c757d] hover:text-white text-base px-3 py-1"
          >
            ← Back
          </button>
        ) : null}
      </header>
      <main className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
        {title ? (
          <h1 className="text-4xl font-bold mb-2 text-center">{title}</h1>
        ) : null}
        {subtitle ? (
          <p className="text-[#6c757d] text-xl mb-10 text-center">{subtitle}</p>
        ) : null}
        <div className="w-full">{children}</div>
      </main>
      {footer ? <footer className="mt-6">{footer}</footer> : null}
    </div>
  );
}

export function BigButton({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  const base =
    "w-full min-h-[88px] rounded-2xl text-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const style =
    variant === "primary"
      ? "bg-[#00b4d8] text-[#1a1a2e] hover:bg-[#0077b6] hover:text-white"
      : variant === "secondary"
        ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
        : "bg-transparent text-white/70 hover:text-white";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${style}`}>
      {children}
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel" | "search";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm uppercase tracking-wider text-[#6c757d] mb-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" ? "none" : "words"}
        autoCorrect="off"
        className="w-full min-h-[56px] px-4 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:border-[#00b4d8] text-xl"
      />
    </label>
  );
}
