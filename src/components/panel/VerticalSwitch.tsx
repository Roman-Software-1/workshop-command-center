// Vertical wall-style toggle: paddle slides up for ON, down for OFF.
export function VerticalSwitch({ on, onToggle, large }: { on: boolean; onToggle: () => void; large?: boolean }) {
  return (
    <button onClick={onToggle} aria-pressed={on} aria-label="Master lights" className={large ? "vswitch vswitch-lg" : "vswitch"} data-on={on}>
      <span className="vswitch-label font-mono">ON</span>
      <span className="vswitch-track">
        <span className="vswitch-paddle" />
      </span>
      <span className="vswitch-label font-mono">OFF</span>
    </button>
  );
}
