import { useState } from "react";
import { Info, UserPlus } from "lucide-react";
import type { CuentaGoogle } from "@/types/api";
import { GoogleLogo } from "@/components/ilustraciones/GoogleLogo";
import { Avatar, Button, Drawer, Input } from "@/components/ui";

/** Cuentas "del dispositivo" para la demo (María ya es clienta; Andrea y Lupita no tienen cuenta). */
const CUENTAS: CuentaGoogle[] = [
  { nombre: "María López", email: "maria.lopez@gmail.com" },
  { nombre: "Andrea Martínez", email: "andrea.martinez@gmail.com" },
  { nombre: "Guadalupe Mendoza", email: "lupita.mendoza@gmail.com" },
];

interface SelectorCuentaGoogleProps {
  open: boolean;
  onClose: () => void;
  onElegir: (c: CuentaGoogle) => void;
  cargando: boolean;
}

/**
 * Simulación del selector de cuentas de Google. En producción esto lo muestra Google (Google
 * Identity Services) y la app solo recibe un token firmado que valida el backend.
 */
export function SelectorCuentaGoogle({ open, onClose, onElegir, cargando }: SelectorCuentaGoogleProps) {
  const [otra, setOtra] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const valido = nombre.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Drawer open={open} onClose={onClose} title="Elige una cuenta" descripcion="para continuar a Domna">
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 rounded-xl bg-info-container px-3 py-2.5 text-body-sm text-info">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Simulación de la demo: en la app real se abre la ventana de Google.
        </p>

        {!otra ? (
          <ul className="flex flex-col divide-y divide-outline-variant/60 rounded-2xl border border-outline-variant">
            {CUENTAS.map((c) => (
              <li key={c.email}>
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => onElegir(c)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-surface-container-low disabled:opacity-60"
                >
                  <Avatar nombre={c.nombre} className="h-9 w-9" />
                  <span className="min-w-0">
                    <span className="block truncate text-label-lg">{c.nombre}</span>
                    <span className="block truncate text-body-sm text-on-surface-variant">{c.email}</span>
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setOtra(true)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-surface-container-low"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-container">
                  <UserPlus className="h-4 w-4 text-on-surface-variant" aria-hidden />
                </span>
                <span className="text-label-lg">Usar otra cuenta</span>
              </button>
            </li>
          </ul>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (valido) onElegir({ nombre: nombre.trim(), email: email.trim() });
            }}
          >
            <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" autoFocus />
            <Input
              label="Correo de Google"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="tu.correo@gmail.com"
            />
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOtra(false)}>
                Atrás
              </Button>
              <Button type="submit" fullWidth disabled={!valido} loading={cargando}>
                <GoogleLogo className="h-4 w-4" />
                Continuar
              </Button>
            </div>
          </form>
        )}

        <p className="text-body-sm text-on-surface-variant">
          Google compartirá tu nombre y correo con Domna. Revisa el aviso de privacidad de la boutique.
        </p>
      </div>
    </Drawer>
  );
}
