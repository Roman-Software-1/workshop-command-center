// Vertical wall-style toggle: paddle slides up for ON, down for OFF.
export function VerticalSwitch({ on, onToggle, large, decorative = false }: { on: boolean; onToggle: () => void; large?: boolean; decorative?: boolean }) {
  const content = <>
    <span className="vswitch-label font-mono">ON</span>
    <span className="vswitch-track"><span className="vswitch-paddle" /></span>
    <span className="vswitch-label font-mono">OFF</span>
  </>;
  const className = large ? "vswitch vswitch-lg" : "vswitch";
  if (decorative) return <span aria-hidden="true" className={className} data-on={on}>{content}</span>;
  return (
    <button onClick={onToggle} aria-pressed={on} aria-label="Master lights" className={className} data-on={on}>
      {content}
    </button>
  );
}
