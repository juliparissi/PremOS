"use client";

import { useEffect, useState } from "react";

export function useMoneyPrivacy(storageKey: string) {
  const [allHidden, setAllHidden] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (saved === "visible") {
      setAllHidden(false);
    }

    if (saved === "hidden") {
      setAllHidden(true);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      allHidden ? "hidden" : "visible"
    );
  }, [allHidden, storageKey]);

  function isHidden(key: string) {
    return overrides[key] ?? allHidden;
  }

  function toggleItem(key: string) {
    setOverrides((current) => ({
      ...current,
      [key]: !isHidden(key),
    }));
  }

  function toggleAll() {
    setAllHidden((current) => !current);
    setOverrides({});
  }

  return {
    allHidden,
    isHidden,
    toggleItem,
    toggleAll,
  };
}

export function privateMoneyValue(value: string, hidden: boolean) {
  if (!hidden) return value;

  const normalized = value.trim();

  if (normalized.startsWith("-")) {
    return "-$ ---.---";
  }

  if (normalized.includes("$")) {
    return "$ ---.---";
  }

  return "---";
}

export function MoneyEyeButton({
  hidden,
  onClick,
  className = "",
}: {
  hidden: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-cyan-300 transition flex items-center justify-center ${className}`}
      aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
      title={hidden ? "Mostrar saldo" : "Ocultar saldo"}
    >
      <span className="relative block w-5 h-3 rounded-full border border-current">
        {!hidden && (
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
        )}

        {hidden && (
          <span className="absolute -left-1 -right-1 top-1/2 border-t border-current -rotate-12" />
        )}
      </span>
    </button>
  );
}
