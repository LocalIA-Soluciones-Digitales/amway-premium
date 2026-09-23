"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Check, ChevronDown, Crown, MessageCircle, Repeat, Search, UsersRound } from "lucide-react";
import { getProductById } from "@/data/products";
import type { Product } from "@/data/types";
import { SITE } from "@/data/site-config";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { pedidosValidos } from "./report-data";
import { Badge, Card, CardTitle, Empty, Loading, PanelHeader, Segmented, Stat, eur, fecha, inputClass, waHref, type Pedido } from "./shared";

const HECHOS_KEY = "amway_premium_recompra_hechos";

// Días aproximados que dura un formato (1 unidad) para un consumo normal.
// Solo consumibles (nutrición y XS); lo demás no genera recordatorio.
export function diasDeUso(product: Product | undefined, formato: string | null): number | null {
  if (!product || !["nutricion", "xs-energy"].includes(product.category)) return null;
  const f = (formato ?? "").toLowerCase();
  let m = f.match(/(\d+)\s*d[ií]as/);
  if (m) return Number(m[1]);
  m = f.match(/(\d+)\s*(porciones|sobres|paquetes|bolsitas)/);
  if (m) return Number(m[1]);
  m = f.match(/(\d+)\s*(tabletas|c[aá]psulas|gomitas)/);
  if (m) return Math.max(15, Math.round(Number(m[1]) / 2));
  if (/doce latas|12 latas/.test(f)) return 12;
  return 30;
}

interface Cliente {
  key: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  pedidos: Pedido[];
  total: number;
  ultimo: string;
}

interface Recompra {
  key: string;
  cliente: Cliente;
  producto: string;
  formato: string | null;
  comprado: string;
  vence: Date;
  dias: number;
}

function clienteKey(p: Pedido): string | null {
  const tel = p.cliente_telefono?.replace(/\D/g, "").slice(-9);
  if (tel && tel.length >= 9) return `t:${tel}`;
  if (p.cliente_email) return `e:${p.cliente_email.toLowerCase().trim()}`;
  if (p.cliente_nombre) return `n:${p.cliente_nombre.toLowerCase().trim()}`;
  return null;
}

function leerHechos(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(HECHOS_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function ClientesPanel() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [query, setQuery] = useState("");
  const [orden, setOrden] = useState<"gasto" | "reciente" | "pedidos">("gasto");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [hechos, setHechos] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHechos(leerHechos());
    amwayDb()
      .from("amway_pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10000)
      .then(({ data }) => setPedidos((data as Pedido[] | null) ?? []));
  }, []);

  const { clientes, recompras } = useMemo(() => {
    const m = new Map<string, Cliente>();
    for (const p of pedidosValidos(pedidos ?? [])) {
      const k = clienteKey(p);
      if (!k) continue;
      const c = m.get(k) ?? {
        key: k,
        nombre: p.cliente_nombre || p.cliente_email || p.cliente_telefono || "Cliente",
        telefono: p.cliente_telefono,
        email: p.cliente_email,
        pedidos: [],
        total: 0,
        ultimo: p.created_at,
      };
      c.pedidos.push(p);
      c.total += Number(p.total_eur);
      if (p.created_at > c.ultimo) c.ultimo = p.created_at;
      c.telefono ??= p.cliente_telefono;
      c.email ??= p.cliente_email;
      m.set(k, c);
    }
    const clientes = Array.from(m.values());

    // Para cada cliente y producto consumible, la última compra marca cuándo se le acaba.
    const recompras: Recompra[] = [];
    const hoy = Date.now();
    for (const c of clientes) {
      const ultimaPorProducto = new Map<string, { p: Pedido; nombre: string; formato: string | null; cantidad: number; product?: Product }>();
      for (const p of c.pedidos) {
        for (const i of p.items) {
          const id = i.product_id ?? i.nombre;
          const prev = ultimaPorProducto.get(id);
          if (!prev || p.created_at > prev.p.created_at)
            ultimaPorProducto.set(id, { p, nombre: i.nombre, formato: i.formato, cantidad: i.cantidad, product: i.product_id ? getProductById(i.product_id) : undefined });
        }
      }
      for (const [id, u] of ultimaPorProducto) {
        const dias = diasDeUso(u.product, u.formato);
        if (!dias) continue;
        const vence = new Date(new Date(u.p.created_at).getTime() + dias * u.cantidad * 864e5);
        const diff = (vence.getTime() - hoy) / 864e5;
        // Ventana útil: desde 10 días antes hasta 30 días después de acabarse.
        if (diff <= 10 && diff >= -30) {
          recompras.push({ key: `${c.key}|${id}|${u.p.id}`, cliente: c, producto: u.nombre, formato: u.formato, comprado: u.p.created_at, vence, dias: Math.round(diff) });
        }
      }
    }
    recompras.sort((a, b) => a.vence.getTime() - b.vence.getTime());
    return { clientes, recompras };
  }, [pedidos]);

  function marcarHecho(key: string) {
    setHechos((prev) => {
      const next = new Set(prev).add(key);
      try {
        localStorage.setItem(HECHOS_KEY, JSON.stringify(Array.from(next).slice(-500)));
      } catch {
        // private mode: it just won't persist
      }
      return next;
    });
  }

  const lista = useMemo(() => {
    const q = query.trim().toLowerCase();
    const l = clientes.filter((c) => !q || `${c.nombre} ${c.telefono ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q));
    return l.sort((a, b) =>
      orden === "gasto" ? b.total - a.total : orden === "pedidos" ? b.pedidos.length - a.pedidos.length : b.ultimo.localeCompare(a.ultimo)
    );
  }, [clientes, query, orden]);

  const pendientes = recompras.filter((r) => !hechos.has(r.key));
  const recurrentes = clientes.filter((c) => c.pedidos.length > 1).length;
  const top = [...clientes].sort((a, b) => b.total - a.total).slice(0, 3).map((c) => c.key);

  return (
    <div>
      <PanelHeader
        title="Clientes"
        description="Quién te compra, cuánto y cuándo toca volver a escribirle. Se construye solo a partir de los pedidos."
      />

      {!pedidos ? (
        <Loading />
      ) : clientes.length === 0 ? (
        <Empty icon={<UsersRound size={18} />}>
          Aún no hay clientes. Aparecerán aquí con el primer pedido (web o venta manual con nombre o teléfono).
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Clientes" value={clientes.length} icon={<UsersRound size={15} />} />
            <Stat
              label="Repiten"
              value={`${Math.round((recurrentes / clientes.length) * 100)} %`}
              icon={<Repeat size={15} />}
              hint={`${recurrentes} con más de un pedido`}
            />
            <Stat label="Valor medio" value={eur(clientes.reduce((s, c) => s + c.total, 0) / clientes.length)} hint="Gastado por cliente" />
            <Stat label="Por reponer" value={pendientes.length} icon={<BellRing size={15} />} hint="Recordatorios activos" />
          </div>

          <Card>
            <CardTitle>Toca reponer</CardTitle>
            {pendientes.length === 0 ? (
              <p className="py-2 text-sm text-stone">
                Nadie necesita reponer ahora mismo. Cuando a un cliente se le esté acabando un producto (según el formato que compró)
                aparecerá aquí con el mensaje listo.
              </p>
            ) : (
              <ul className="divide-y divide-carbon/[0.06]">
                {pendientes.slice(0, 20).map((r) => {
                  const nombre = r.cliente.nombre.split(" ")[0];
                  const texto = `Hola ${nombre}, soy de ${SITE.name}. Calculo que ya se te estará acabando tu ${r.producto}${
                    r.formato ? ` (${r.formato})` : ""
                  }. ¿Quieres que te prepare otro? 😊`;
                  return (
                    <li key={r.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-carbon">{r.cliente.nombre}</p>
                        <p className="truncate text-xs text-stone">
                          {r.producto}
                          {r.formato && ` · ${r.formato}`} · comprado el {fecha(r.comprado)}
                        </p>
                      </div>
                      <Badge tone={r.dias <= 0 ? "red" : "amber"}>
                        {r.dias < 0 ? `Se acabó hace ${-r.dias} días` : r.dias === 0 ? "Se acaba hoy" : `Se acaba en ${r.dias} días`}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        {r.cliente.telefono && (
                          <a
                            href={waHref(r.cliente.telefono, texto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-forest px-3 text-xs font-medium text-cream transition hover:bg-forest-dim"
                          >
                            <MessageCircle size={13} /> Escribir
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => marcarHecho(r.key)}
                          title="Ya le he escrito"
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-carbon/10 px-2.5 text-xs text-stone transition hover:border-carbon/25 hover:text-carbon"
                        >
                          <Check size={13} /> Hecho
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-stone">
              Duración estimada por formato: &quot;31 días&quot;, &quot;30 porciones&quot;… y en tabletas o cápsulas, 2 al día.
            </p>
          </Card>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cliente por nombre, teléfono o email…"
                className={cn(inputClass, "w-full pl-10")}
              />
            </div>
            <Segmented
              value={orden}
              onChange={setOrden}
              options={[
                { value: "gasto", label: "Más gasto" },
                { value: "reciente", label: "Más reciente" },
                { value: "pedidos", label: "Más pedidos" },
              ]}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-carbon/[0.07] bg-white">
            {lista.map((c) => {
              const open = abierto === c.key;
              return (
                <div key={c.key} className="border-b border-carbon/[0.06] last:border-0">
                  <button
                    type="button"
                    onClick={() => setAbierto(open ? null : c.key)}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left transition hover:bg-cream/50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-sm font-medium text-carbon">
                      {c.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-carbon">
                        {c.nombre}
                        {top.includes(c.key) && c.total > 0 && <Crown size={13} className="text-gold" aria-label="Mejor cliente" />}
                      </span>
                      <span className="block truncate text-xs text-stone">{[c.telefono, c.email].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="text-xs text-stone">
                      {c.pedidos.length} pedido{c.pedidos.length === 1 ? "" : "s"} · último {fecha(c.ultimo)}
                    </span>
                    <span className="w-24 text-right text-sm font-medium tabular-nums text-carbon">{eur(c.total)}</span>
                    <ChevronDown size={16} className={cn("text-stone transition", open && "rotate-180")} />
                  </button>
                  {open && (
                    <div className="flex flex-col gap-4 bg-cream/40 px-5 py-4 sm:flex-row">
                      <ul className="min-w-0 flex-1 text-sm">
                        {c.pedidos.map((p) => (
                          <li key={p.id} className="flex justify-between gap-3 py-1.5">
                            <span className="min-w-0 truncate text-carbon">
                              <span className="mr-2 tabular-nums text-stone">#{p.numero}</span>
                              {p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
                            </span>
                            <span className="shrink-0 text-xs text-stone">
                              {fecha(p.created_at)} · <span className="tabular-nums text-carbon">{eur(p.total_eur)}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      {c.telefono && (
                        <a
                          href={waHref(c.telefono, `Hola ${c.nombre.split(" ")[0]}, soy de ${SITE.name}. `)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full border border-carbon/10 bg-white px-3.5 text-xs font-medium text-carbon transition hover:border-carbon/25"
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
