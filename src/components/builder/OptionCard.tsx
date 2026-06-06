type OptionCardProps = {
  label: string;
  detail: string;
  price: number;
  active?: boolean;
  onToggle?: () => void;
};

export default function OptionCard({ label, detail, price, active, onToggle }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-3xl border p-5 text-left transition ${
        active ? "border-gold bg-[#122742]" : "border-[#31425B] bg-background"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-semibold">{label}</h4>
        <span className="text-sm text-[#B1A893]">+${price}</span>
      </div>
      <p className="mt-2 text-sm text-[#B1A893]">{detail}</p>
    </button>
  );
}
