import OptionCard from "@/components/builder/OptionCard";

type OptionGridProps = {
  options: Array<{ id: string; label: string; detail: string; price: number }>;
  selected: string[];
  onToggle: (id: string) => void;
};

export default function OptionGrid({ options, selected, onToggle }: OptionGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {options.map((option) => (
        <OptionCard
          key={option.id}
          label={option.label}
          detail={option.detail}
          price={option.price}
          active={selected.includes(option.id)}
          onToggle={() => onToggle(option.id)}
        />
      ))}
    </div>
  );
}
