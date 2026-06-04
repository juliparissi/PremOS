"use client";

type BackButtonProps = {
  href?: string;
  label?: string;
  showDesktop?: boolean;
};

export default function BackButton({
  href,
  label = "Volver",
  showDesktop = false,
}: BackButtonProps) {
  function volver() {
    if (href) {
      window.location.href = href;
      return;
    }

    window.history.back();
  }

  return (
    <>
      {showDesktop && (
        <button
          onClick={volver}
          className="hidden md:inline-flex items-center mb-6 text-sm font-medium text-cyan-300 hover:text-cyan-200 transition"
        >
          {"<"} {label}
        </button>
      )}

      <button
        onClick={volver}
        className="
          fixed
          bottom-6
          left-4
          z-50
          w-14
          h-14
          rounded-full
          bg-[#0b1727]
          border
          border-white/10
          text-white
          text-2xl
          shadow-2xl
          flex
          items-center
          justify-center
          md:hidden
        "
      >
        {"<"}
      </button>
    </>
  );
}
