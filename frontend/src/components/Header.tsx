interface HeaderProps {
  onLogoClick: () => void;
}

export function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between gap-4">
        <button className="flex items-center gap-3" onClick={onLogoClick}>
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-lg">timeline</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight">FlowGantt</span>
        </button>
        <div className="flex items-center gap-3">
          
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-white text-xs font-semibold ring-2 ring-surface-container-high">
            ВЫ
          </div>
        </div>
      </div>
    </header>
  );
}
