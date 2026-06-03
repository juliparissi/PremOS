export const demoMode =
  process.env.NEXT_PUBLIC_PREMOS_DEMO_MODE === "true";

export const demoEmail =
  process.env.NEXT_PUBLIC_PREMOS_DEMO_EMAIL || "";

export const demoPassword =
  process.env.NEXT_PUBLIC_PREMOS_DEMO_PASSWORD || "";

export const demoLoginEnabled =
  demoMode && Boolean(demoEmail) && Boolean(demoPassword);
