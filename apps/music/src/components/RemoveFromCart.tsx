"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeFromCartAction } from "@/app/(site)/cart/actions";
import { Button } from "@/components/ui";

export function RemoveFromCart({ productId, label = "Remove" }: { productId: string; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() =>
        start(async () => {
          await removeFromCartAction(productId);
          window.dispatchEvent(new Event("mu:cart"));
          router.refresh();
        })
      }
    >
      {label}
    </Button>
  );
}
