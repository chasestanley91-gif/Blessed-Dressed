type SummaryPanelProps = {
  product: string;
  fabric: string;
  optionsCount: number;
  price: number;
};

export default function SummaryPanel({ product, fabric, optionsCount, price }: SummaryPanelProps) {
  return (
    <div className="rounded-[2rem] border border-[#31425B] bg-[#091B2F] p-6 shadow-xl shadow-black/20">
      <h3 className="text-2xl font-semibold">Review Snapshot</h3>
      <p className="mt-3 text-sm leading-7 text-[#B1A893]">High-level details are collected in the builder state and can be reviewed before checkout.</p>
      <div className="mt-5 space-y-3 rounded-3xl bg-background p-4 text-sm">
        <div className="flex justify-between"><span>Product</span><span>{product}</span></div>
        <div className="flex justify-between"><span>Fabric</span><span>{fabric.replace(/-/g, " ")}</span></div>
        <div className="flex justify-between"><span>Options</span><span>{optionsCount} selected</span></div>
        <div className="flex justify-between text-gold"><span>Total</span><span>${price}</span></div>
      </div>
    </div>
  );
}
