export type LicenseCheckResult = {
  configured: boolean;
  allowed: boolean;
  valid: boolean;
  reason: string;
  empresa?: string;
  plan?: string;
  estado?: string;
  vencimiento?: string;
};

const licenseKey = process.env.NEXT_PUBLIC_PREMOS_LICENSE_KEY || "";
const licenseApiUrl = process.env.NEXT_PUBLIC_PREMOS_LICENSE_API_URL || "";

export const licenseConfigured = Boolean(licenseKey && licenseApiUrl);

export async function checkPremosLicense(): Promise<LicenseCheckResult> {
  if (!licenseConfigured) {
    return {
      configured: false,
      allowed: true,
      valid: true,
      reason: "license_not_configured",
    };
  }

  const baseUrl = licenseApiUrl.replace(/\/$/, "");
  const url = `${baseUrl}/${encodeURIComponent(licenseKey)}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const data = (await response.json()) as Partial<LicenseCheckResult>;

    return {
      configured: true,
      allowed: Boolean(data.allowed),
      valid: Boolean(data.valid),
      reason: data.reason || "unknown",
      empresa: data.empresa,
      plan: data.plan,
      estado: data.estado,
      vencimiento: data.vencimiento,
    };
  } catch {
    return {
      configured: true,
      allowed: true,
      valid: false,
      reason: "license_server_unreachable",
    };
  }
}
