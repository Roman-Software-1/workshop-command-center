// Vertical wall-style toggle: paddle slides up for ON, down for OFF.
export function VerticalSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} aria-pressed={on} aria-label="Master lights" className="vswitch" data-on={on}>
      <span className="vswitch-label font-mono">ON</span>
      <span className="vswitch-track">
        <span className="vswitch-paddle" />
      </span>
      <span className="vswitch-label font-mono">OFF</span>
    </button>
  );
}
