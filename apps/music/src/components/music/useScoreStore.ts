"use client";

import {
  MockPaymentProvider,
  MockScoreDelivery,
  addToCart,
  removeFromCart,
  type CartLine,
  type Order,
} from "@jerryqiu/mocks";
import { mockStore } from "@jerryqiu/mocks/client";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Cart and orders live in this browser (MockStore). Delivery and payment are the mock providers. */
export function useScoreStore() {
  const store = useMemo(() => mockStore(), []);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setCart(store.get<CartLine[]>("score-cart", []));
    setOrders(store.get<Order[]>("score-orders", []));
    setReady(true);
  }, [store]);
  const saveCart = useCallback(
    (c: CartLine[]) => {
      store.set("score-cart", c);
      setCart(c);
    },
    [store],
  );
  const saveOrders = useCallback(
    (o: Order[]) => {
      store.set("score-orders", o);
      setOrders(o);
    },
    [store],
  );
  return {
    ready,
    cart,
    orders,
    add: (slug: string) => saveCart(addToCart(cart, slug)),
    remove: (slug: string) => saveCart(removeFromCart(cart, slug)),
    clear: () => saveCart([]),
    addOrder: (o: Order) => saveOrders([o, ...orders]),
    pay: useMemo(() => new MockPaymentProvider(), []),
    delivery: useMemo(() => new MockScoreDelivery(), []),
  };
}
