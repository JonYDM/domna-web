/**
 * Enlace que abre un chat de WhatsApp con un número de México, opcionalmente con el mensaje ya escrito. Es solo
 * una dirección (`wa.me`): el navegador abre la app de WhatsApp o WhatsApp Web, sin llamar a ningún servidor
 * nuestro ni de WhatsApp desde aquí. Acepta el teléfono como se guarda ("777 123 4567") o con lada (+52).
 * Devuelve `null` si el número no es de 10 dígitos, para no mandar a un chat equivocado.
 */
export function urlWhatsApp(telefono: string | null | undefined, mensaje?: string): string | null {
  let digitos = (telefono ?? "").replace(/\D/g, "");
  if (digitos.length === 12 && digitos.startsWith("52")) digitos = digitos.slice(2);
  if (digitos.length !== 10) return null;
  return `https://wa.me/52${digitos}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;
}