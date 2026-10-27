"use client";

import { useState, useTransition } from "react";
import { addToCartAction } from "@/app/(site)/cart/actions";
import { Button } from "@/components/ui";

export function AddToCart({ productId, label = "Add to cart" }: { productId: string; label?: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  return (
    <>
      <Button
        type="button"
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await addToCartAction(productId);
            setDone(r.ok);
            window.dispatchEvent(new Event("mu:cart"));
          })
        }
      >
        {done ? "In your cart" : label}
      </Button>
      <span className="mu-muted" role="status" aria-live="polite">
        {done ? "Added." : ""}
      </span>
    </>
  );
}
