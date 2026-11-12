type IndicatorLightProps = {
  className?: string;
  contrast?: boolean;
  delay?: number;
  effect?: "blink" | "beacon" | "soft";
};

export function IndicatorLight({
  className = "",
  contrast = false,
  delay = 0,
  effect = "blink",
}: IndicatorLightProps) {
  return (
    <span
      aria-hidden="true"
      data-contrast={contrast || undefined}
      data-effect={effect}
      className={`indicator-light ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

type LightBankProps = Omit<IndicatorLightProps, "className" | "delay"> & {
  className?: string;
  lightClassName?: string;
};

export function LightBank({
  className = "",
  lightClassName = "h-2 w-2",
  contrast,
  effect,
}: LightBankProps) {
  return (
    <span aria-hidden="true" className={`inline-flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((index) => (
        <IndicatorLight
          key={index}
          className={lightClassName}
          contrast={contrast ?? false}
          delay={index * 320}
          effect={effect ?? "blink"}
        />
      ))}
    </span>
  );
}
