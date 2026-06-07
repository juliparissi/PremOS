import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

type ArcaAuth = {
  token: string;
  sign: string;
  expiresAt?: number;
};

type PersonaPadronResult = {
  cuit: string;
  razonSocial: string;
  tipoPersona: string;
  estadoClave: string;
  domicilioFiscal: string;
};

type UltimoComprobanteParams = {
  ptoVta: number;
  cbteTipo: number;
};

type EmitirFacturaParams = {
  ptoVta: number;
  cbteTipo: number;
  cbteNro: number;
  fecha: string;
  importe: number;
  docTipo: number;
  docNro: number;
  condicionIvaReceptorId: number;
};

type EmitirFacturaResult = {
  resultado: string;
  comprobanteNumero: number;
  cae: string;
  caeVencimiento: string;
  observaciones: string[];
};

const WSAA_HOMO_URL = "https://wsaahomo.afip.gov.ar/ws/services/LoginCms";
const WSFE_HOMO_URL = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx";
const WSPADRON_A5_HOMO_URL =
  "https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5";
const WSAA_PROD_URL = "https://wsaa.afip.gov.ar/ws/services/LoginCms";
const WSFE_PROD_URL = "https://servicios1.afip.gov.ar/wsfev1/service.asmx";
const WSPADRON_A5_PROD_URL =
  "https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5";
const authCache = new Map<string, ArcaAuth>();

function getArcaConfig() {
  const env = process.env.ARCA_ENV || "homologacion";
  const cuit = process.env.ARCA_CUIT;
  const certPath = process.env.ARCA_CERT_PATH;
  const keyPath = process.env.ARCA_KEY_PATH;
  const opensslPath = process.env.OPENSSL_PATH || "openssl";

  if (!cuit || !certPath || !keyPath) {
    throw new Error("Faltan variables ARCA_CUIT, ARCA_CERT_PATH o ARCA_KEY_PATH.");
  }

  return {
    env,
    cuit,
    certPath,
    keyPath,
    opensslPath,
    wsaaUrl: env === "produccion" ? WSAA_PROD_URL : WSAA_HOMO_URL,
    wsfeUrl: env === "produccion" ? WSFE_PROD_URL : WSFE_HOMO_URL,
    wsPadronA5Url:
      env === "produccion" ? WSPADRON_A5_PROD_URL : WSPADRON_A5_HOMO_URL,
  };
}

function getAuthCachePath(service: string) {
  const config = getArcaConfig();
  const cacheDir =
    process.env.ARCA_CACHE_DIR || path.join(process.cwd(), ".arca-cache");
  const filename = `${config.env}-${config.cuit}-${service}.json`.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  return path.join(cacheDir, filename);
}

function readAuthFromDisk(service: string) {
  try {
    const cachePath = getAuthCachePath(service);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const auth = JSON.parse(fs.readFileSync(cachePath, "utf8")) as ArcaAuth;

    if (!auth.token || !auth.sign || !auth.expiresAt) {
      return null;
    }

    if (auth.expiresAt <= Date.now() + 60_000) {
      return null;
    }

    authCache.set(service, auth);
    return auth;
  } catch {
    return null;
  }
}

function writeAuthToDisk(service: string, auth: ArcaAuth) {
  try {
    const cachePath = getAuthCachePath(service);
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(auth), { mode: 0o600 });
  } catch {
    // Si el disco no permite cachear, el sistema sigue usando cache en memoria.
  }
}

function escapeXml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function tagValue(xml: string, tag: string) {
  return xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "";
}

function tagValues(xml: string, tag: string) {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g"))].map(
    (match) => match[1]
  );
}

function extraerMensajesArca(xml: string) {
  return [...xml.matchAll(/<Msg>([\s\S]*?)<\/Msg>/g)]
    .map((match) => limpiarTexto(match[1]))
    .filter(Boolean);
}

function formatArcaDate(value: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10).replace(/-/g, "");
  }

  return value.split("T")[0].replace(/-/g, "");
}

function formatAmount(value: number) {
  return Number(value || 0).toFixed(2);
}

function limpiarTexto(value: string) {
  return decodeXml(value || "").replace(/\s+/g, " ").trim();
}

function firmarLoginTicket(service: string) {
  const config = getArcaConfig();
  const uniqueId = Math.floor(Date.now() / 1000);
  const now = new Date();
  const generationTime = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const expirationTime = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "premos-arca-"));
  const traPath = path.join(tmpDir, "LoginTicketRequest.xml");
  const cmsPath = path.join(tmpDir, "LoginTicketRequest.cms");

  const tra = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${generationTime}</generationTime>
    <expirationTime>${expirationTime}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;

  fs.writeFileSync(traPath, tra, "utf8");

  execFileSync(config.opensslPath, [
    "cms",
    "-sign",
    "-in",
    traPath,
    "-signer",
    config.certPath,
    "-inkey",
    config.keyPath,
    "-outform",
    "DER",
    "-nodetach",
    "-binary",
    "-out",
    cmsPath,
  ]);

  return fs.readFileSync(cmsPath).toString("base64");
}

async function postSoap(url: string, soapAction: string, envelope: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: soapAction,
    },
    body: envelope,
  });

  const text = await response.text();

  if (!response.ok || text.includes("<soap:Fault") || text.includes("<soapenv:Fault")) {
    const message = tagValue(text, "faultstring") || text.slice(0, 700);
    throw new Error(message);
  }

  return text;
}

export async function obtenerAuthArca(service = "wsfe"): Promise<ArcaAuth> {
  const cachedAuth = authCache.get(service);

  if (cachedAuth?.expiresAt && cachedAuth.expiresAt > Date.now() + 60_000) {
    return cachedAuth;
  }

  const diskAuth = readAuthFromDisk(service);

  if (diskAuth) {
    return diskAuth;
  }

  const config = getArcaConfig();
  const cms = firmarLoginTicket(service);
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xml = await postSoap(config.wsaaUrl, "", envelope);
  const loginCmsReturn = tagValue(xml, "loginCmsReturn");
  const decoded = decodeXml(loginCmsReturn);
  const token = tagValue(decoded, "token");
  const sign = tagValue(decoded, "sign");
  const expirationTime = tagValue(decoded, "expirationTime");
  const expiresAt = expirationTime
    ? Date.parse(expirationTime)
    : Date.now() + 8 * 60 * 60 * 1000;

  if (!token || !sign) {
    throw new Error("ARCA no devolvio token/sign.");
  }

  const auth = { token, sign, expiresAt };
  authCache.set(service, auth);
  writeAuthToDisk(service, auth);

  return auth;
}

export async function consultarPersonaPadronArca(
  cuitPersona: string
): Promise<PersonaPadronResult> {
  const config = getArcaConfig();
  const cuitLimpio = cuitPersona.replace(/\D/g, "");

  if (!/^\d{11}$/.test(cuitLimpio)) {
    throw new Error("El CUIT debe tener 11 digitos.");
  }

  const auth = await obtenerAuthArca("ws_sr_padron_a5");
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:a5="http://a5.soap.ws.server.puc.sr/">
  <soapenv:Header/>
  <soapenv:Body>
    <a5:getPersona>
      <token>${escapeXml(auth.token)}</token>
      <sign>${escapeXml(auth.sign)}</sign>
      <cuitRepresentada>${escapeXml(config.cuit)}</cuitRepresentada>
      <idPersona>${escapeXml(cuitLimpio)}</idPersona>
    </a5:getPersona>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xml = await postSoap(config.wsPadronA5Url, "", envelope);
  const razonSocial = limpiarTexto(tagValue(xml, "razonSocial"));
  const apellido = limpiarTexto(tagValue(xml, "apellido"));
  const nombre = limpiarTexto(tagValue(xml, "nombre"));
  const estadoClave = limpiarTexto(tagValue(xml, "estadoClave"));
  const tipoPersona = limpiarTexto(tagValue(xml, "tipoPersona"));
  const direccion = limpiarTexto(tagValue(xml, "direccion"));
  const localidad = limpiarTexto(tagValue(xml, "localidad"));
  const provincia = limpiarTexto(tagValue(xml, "descripcionProvincia"));
  const errores = tagValues(xml, "error").map(limpiarTexto).filter(Boolean);
  const nombreCompleto = razonSocial || [apellido, nombre].filter(Boolean).join(" ");

  if (!nombreCompleto) {
    throw new Error(errores[0] || "ARCA no devolvio razon social para ese CUIT.");
  }

  return {
    cuit: cuitLimpio,
    razonSocial: nombreCompleto,
    tipoPersona,
    estadoClave,
    domicilioFiscal: [direccion, localidad, provincia].filter(Boolean).join(", "),
  };
}

export async function obtenerUltimoComprobanteArca(
  auth: ArcaAuth,
  params: UltimoComprobanteParams
) {
  const config = getArcaConfig();
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Header/>
  <soapenv:Body>
    <ar:FECompUltimoAutorizado>
      <ar:Auth>
        <ar:Token>${escapeXml(auth.token)}</ar:Token>
        <ar:Sign>${escapeXml(auth.sign)}</ar:Sign>
        <ar:Cuit>${escapeXml(config.cuit)}</ar:Cuit>
      </ar:Auth>
      <ar:PtoVta>${params.ptoVta}</ar:PtoVta>
      <ar:CbteTipo>${params.cbteTipo}</ar:CbteTipo>
    </ar:FECompUltimoAutorizado>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xml = await postSoap(
    config.wsfeUrl,
    "http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado",
    envelope
  );

  return Number(tagValue(xml, "CbteNro") || 0);
}

export async function emitirFacturaArca(
  auth: ArcaAuth,
  params: EmitirFacturaParams
): Promise<EmitirFacturaResult> {
  const config = getArcaConfig();
  const importe = formatAmount(params.importe);
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Header/>
  <soapenv:Body>
    <ar:FECAESolicitar>
      <ar:Auth>
        <ar:Token>${escapeXml(auth.token)}</ar:Token>
        <ar:Sign>${escapeXml(auth.sign)}</ar:Sign>
        <ar:Cuit>${escapeXml(config.cuit)}</ar:Cuit>
      </ar:Auth>
      <ar:FeCAEReq>
        <ar:FeCabReq>
          <ar:CantReg>1</ar:CantReg>
          <ar:PtoVta>${params.ptoVta}</ar:PtoVta>
          <ar:CbteTipo>${params.cbteTipo}</ar:CbteTipo>
        </ar:FeCabReq>
        <ar:FeDetReq>
          <ar:FECAEDetRequest>
            <ar:Concepto>1</ar:Concepto>
            <ar:DocTipo>${params.docTipo}</ar:DocTipo>
            <ar:DocNro>${params.docNro}</ar:DocNro>
            <ar:CbteDesde>${params.cbteNro}</ar:CbteDesde>
            <ar:CbteHasta>${params.cbteNro}</ar:CbteHasta>
            <ar:CbteFch>${formatArcaDate(params.fecha)}</ar:CbteFch>
            <ar:ImpTotal>${importe}</ar:ImpTotal>
            <ar:ImpTotConc>0.00</ar:ImpTotConc>
            <ar:ImpNeto>${importe}</ar:ImpNeto>
            <ar:ImpOpEx>0.00</ar:ImpOpEx>
            <ar:ImpIVA>0.00</ar:ImpIVA>
            <ar:ImpTrib>0.00</ar:ImpTrib>
            <ar:MonId>PES</ar:MonId>
            <ar:MonCotiz>1.00</ar:MonCotiz>
            <ar:CondicionIVAReceptorId>${params.condicionIvaReceptorId}</ar:CondicionIVAReceptorId>
          </ar:FECAEDetRequest>
        </ar:FeDetReq>
      </ar:FeCAEReq>
    </ar:FECAESolicitar>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xml = await postSoap(
    config.wsfeUrl,
    "http://ar.gov.afip.dif.FEV1/FECAESolicitar",
    envelope
  );
  const resultado = tagValue(xml, "Resultado");
  const cae = tagValue(xml, "CAE");
  const caeVencimiento = tagValue(xml, "CAEFchVto");
  const observaciones = extraerMensajesArca(xml);

  return {
    resultado,
    comprobanteNumero: params.cbteNro,
    cae,
    caeVencimiento,
    observaciones,
  };
}
