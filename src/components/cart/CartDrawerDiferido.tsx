"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCesta } from "./CartProvider";

// El cajón de la cesta (formulario, calendario de recogida, pago) solo se
// descarga la primera vez que se abre; después se queda montado para que
// cierre con su animación y conserve lo escrito.
const CartDrawer = dynamic(() => import("./CartDrawer").then((m) => m.CartDrawer), { ssr: false });

export function CartDrawerDiferido() {
  const { isOpen } = useCesta();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    if (isOpen) setMontado(true);
  }, [isOpen]);

  return montado || isOpen ? <CartDrawer /> : null;
}
