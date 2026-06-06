type StepLayoutProps = {
  steps: string[];
  activeStep?: number;
};

export default function StepLayout({ steps, activeStep = 1 }: StepLayoutProps) {
  return (
    <div className="rounded-[2rem] border border-[#31425B] bg-surface-strong p-6">
      <h3 className="text-xl font-semibold">Studio Design Flow</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => {
          const stepIndex = index + 1;
          const isActive = stepIndex === activeStep;
          return (
            <div
              key={step}
              className={`rounded-3xl border px-4 py-3 text-sm ${isActive ? "border-gold bg-[#122742] text-foreground" : "border-[#31425B] bg-background text-[#B1A893]"}`}
            >
              <span className="font-semibold">Step {stepIndex}.</span> {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
