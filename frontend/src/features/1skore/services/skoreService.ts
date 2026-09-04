import crmApi from "@/api/crmApi";
import type { SkoreSearchResponse } from "../../../types";

export async function login1Skore(): Promise<{ cookie: string }> {
  const { data } = await crmApi.post<{ sessionId: string }>('/skore/login');
  return { cookie: data.sessionId };
}

/**
 * Detecta el tipo de documento (NIF, NIE o CIF)
 * - NIF: 8 dígitos + 1 letra (ej: 12345678A)
 * - NIE: 1 letra (X, Y, Z) + 7 dígitos + 1 letra (ej: X1234567A)
 * - CIF: 1 letra + 8 caracteres (ej: B12345678)
 */
function detectDocumentType(value: string): "nif" | "nie" | "cif" {
  const normalized = value.toUpperCase().trim();

  if (/^[XYZ]/i.test(normalized)) {
    return "nie";
  }

  if (/^[ABCDEFGHJNPQRSUVW]/i.test(normalized)) {
    return "cif";
  }

  return "nif";
}

/**
 * Busca en 1Skore por DNI o teléfono.
 * @param type "dni" o "phone"
 * @param value valor del DNI o teléfono
 * @param sessionId cookie PHPSESSID
 */
export async function search1Skore(
  type: "dni" | "phone",
  value: string,
  sessionId: string
): Promise<SkoreSearchResponse> {
  const params: Record<string, string | string[]> = {
    method: 'execute_wese',
  };

  if (type === "dni") {
    const normalizedValue = value.toUpperCase().trim();
    const docType = detectDocumentType(normalizedValue);
    params["data[WS]"] = "ws_document";
    params["data[PARAMS][0][]"] = ["param_p_document", normalizedValue];
    params["data[PARAMS][1][]"] = ["param_p_type", docType];
  } else if (type === "phone") {
    params["data[WS]"] = "ws_msisdn";
    params["data[PARAMS][0][]"] = ["param_p_phone", value];
  }

  const { data } = await crmApi.post<SkoreSearchResponse>('/skore/search', {
    sessionId,
    params,
  });

  return data;
}
