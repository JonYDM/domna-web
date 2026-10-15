import { Button } from "@/components/ui";
import { Drawer } from "@/components/ui";
import { formatHace } from "@/lib/format";
import type { SesionActiva } from "../sesionUnica";

interface SesionAbiertaDrawerProps {
  open: boolean;
  /** Datos de la otra sesión activa (dispositivo y última actividad). */
  sesion: SesionActiva | null;
  /** ¿Repitiendo el login con reemplazarSesion: true? (botón primario en carga). */
  cargando: boolean;
  /** Mensaje de error del reintento, si lo hubo. */
  error?: string | null;
  /** "Seguir aquí": repite el login reemplazando la otra sesión. */
  onSeguirAqui: () => void;
  /** "Mantener la otra": cierra la hoja, limpia el PIN y no entra. */
  onMantenerLaOtra: () => void;
}

/**
 * Aviso de "sesión única por cuenta": al entrar con otra sesión ya abierta, se ofrece cerrarla y
 * seguir en este dispositivo, o dejar la otra y no entrar. Sin mascota, textos en español,
 * accesible (lo da el Drawer: título y descripción enlazados), objetivos táctiles ≥ 44 px.
 */
export function SesionAbiertaDrawer({
  open,
  sesion,
  cargando,
  error,
  onSeguirAqui,
  onMantenerLaOtra,
}: SesionAbiertaDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onMantenerLaOtra}
      title="Ya tienes una sesión abierta"
      descripcion="Tu cuenta solo permite una sesión a la vez."
      pie={
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth loading={cargando} onClick={onSeguirAqui}>
            Seguir aquí
          </Button>
          <Button variant="ghost" size="lg" fullWidth disabled={cargando} onClick={onMantenerLaOtra}>
            Mantener la otra
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-body-md text-on-surface-variant">
          Hay una sesión activa en{" "}
          <span className="font-semibold text-on-surface">{sesion?.dispositivo ?? "otro dispositivo"}</span>
          {sesion?.ultimaActividad ? (
            <>
              {" "}
              con última actividad <span className="font-semibold text-on-surface">{formatHace(sesion.ultimaActividad).toLowerCase()}</span>.
            </>
          ) : (
            "."
          )}
        </p>
        <p className="text-body-md text-on-surface-variant">
          Si sigues aquí, esa otra sesión se cerrará. Si prefieres dejarla abierta, no entrarás en
          este dispositivo.
        </p>
        {error && (
          <p role="alert" className="rounded-xl bg-error-container px-3 py-2 text-body-sm text-error">
            {error}
          </p>
        )}
      </div>
    </Drawer>
  );
}
