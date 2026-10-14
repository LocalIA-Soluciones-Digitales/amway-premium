// Pide al servidor el aviso al móvil de Yuly. Sin esperar: si falla, la
// solicitud ya está guardada y sale igual en el panel.
export function avisarSolicitud() {
  void fetch("/api/solicitud/aviso", { method: "POST", keepalive: true }).catch(() => undefined);
}
