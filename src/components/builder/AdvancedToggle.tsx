type AdvancedToggleProps = {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
};

export default function AdvancedToggle({ label, description, enabled, onToggle }: AdvancedToggleProps) {
  return (
    <div className="rounded-3xl border border-[#31425B] bg-background p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{label}</p>
          <p className="mt-2 text-sm text-[#B1A893]">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            enabled ? "bg-gold text-background" : "bg-[#122742] text-foreground"
          }`}
        >
          {enabled ? "Enabled" : "Enable"}
        </button>
      </div>
    </div>
  );
}
