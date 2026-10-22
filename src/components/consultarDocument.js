
const TOKEN = import.meta.env.VITE_APISPERU_TOKEN;
const URL_DNI = import.meta.env.VITE_APISPERU_DNI_URL;
const URL_RUC = import.meta.env.VITE_APISPERU_RUC_URL;

// Recibe un DNI (8) o RUC (11) y devuelve
// los campos listos para la cotización.
export async function consultarDocumento(numero) {
  const n = String(numero ?? "").trim();

  const esDni = /^\d{8}$/.test(n);
  const esRuc = /^\d{11}$/.test(n);

  if (!esDni && !esRuc) {
    throw new Error(
      "Ingresa un DNI (8 dígitos) o un RUC (11 dígitos)."
    );
  }

  if (!TOKEN) {
    throw new Error("No está configurado el token de APIsPERU.");
  }

  const base = esDni ? URL_DNI : URL_RUC;

  if (!base) {
    throw new Error("No está configurada la URL de consulta.");
  }

  const url = new URL(`${base.replace(/\/+$/, "")}/${n}`);
  url.searchParams.set("token", TOKEN);

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(
      `Error al consultar el documento (${res.status}).`
    );
  }

  const d = await res.json();

  if (d.success === false) {
    throw new Error("No se encontró el documento.");
  }

  return esDni
    ? {
        cliente: [
          d.nombres,
          d.apellidoPaterno,
          d.apellidoMaterno
        ].filter(Boolean).join(" ")
      }
    : {
        cliente: d.razonSocial,
        direccion: [
          d.direccion,
          d.distrito
        ].filter(Boolean).join(", ")
      };
}
