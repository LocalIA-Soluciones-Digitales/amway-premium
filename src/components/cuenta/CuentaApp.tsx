"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCliente } from "./ClienteProvider";
import { AccesoCliente, type ModoAcceso } from "./AccesoCliente";
import { PanelCliente } from "./PanelCliente";

export function CuentaApp() {
  const { session, cargando } = useCliente();
  const [modo, setModo] = useState<ModoAcceso>("entrar");

  // /cuenta?registro=1 abre directamente el alta (enlace desde la cesta).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("registro")) setModo("registro");
  }, []);

  return (
    <div className="min-h-[80vh] bg-cream px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
      {cargando ? (
        <div className="flex justify-center py-24 text-stone">
          <Loader2 className="animate-spin" />
        </div>
      ) : session ? (
        <PanelCliente />
      ) : (
        <AccesoCliente modoInicial={modo} />
      )}
    </div>
  );
}
