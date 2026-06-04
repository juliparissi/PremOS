export type EmpresaConfig = {
  nombre: string;
  direccion: string;
  localidad: string;
  telefono: string;
  email: string;
  logo: string;
  cuit?: string;
  colorPrincipal?: string;
};

export const empresaConfig: EmpresaConfig = {
  nombre: "",
  direccion: "",
  localidad: "",
  telefono: "",
  email: "",
  logo: "",
  cuit: "",
  colorPrincipal: "#10b981",
};

export const EMPRESA_CONFIG_STORAGE_KEY = "premos_empresa_config";

export function getEmpresaConfig(): EmpresaConfig {
  if (typeof window === "undefined") {
    return empresaConfig;
  }

  try {
    const stored = window.localStorage.getItem(EMPRESA_CONFIG_STORAGE_KEY);

    if (!stored) {
      return empresaConfig;
    }

    return {
      ...empresaConfig,
      ...JSON.parse(stored),
    };
  } catch {
    return empresaConfig;
  }
}

export function saveEmpresaConfig(config: EmpresaConfig) {
  window.localStorage.setItem(
    EMPRESA_CONFIG_STORAGE_KEY,
    JSON.stringify(config)
  );
}
