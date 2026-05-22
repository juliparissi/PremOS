"use client";

export default function BackButton() {

  return (

    <button
      onClick={() => window.history.back()}
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

      ←

    </button>

  );

}