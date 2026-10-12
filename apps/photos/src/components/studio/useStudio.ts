"use client";

import { MockClientPortal, MockESignProvider, MockPaymentProvider, type StudioRepo } from "@jerryqiu/mocks";
import { studio } from "@jerryqiu/mocks/client";
import { useCallback, useEffect, useMemo, useState } from "react";

/** One repo over localStorage, a revision counter to re-render after writes, and the mock providers. */
export function useStudio() {
  const [rev, setRev] = useState(0);
  const [ready, setReady] = useState(false);
  const repo: StudioRepo = useMemo(() => studio(), []);
  useEffect(() => setReady(true), []);
  const bump = useCallback(() => setRev((n) => n + 1), []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: rev invalidates the snapshot after writes
  const data = useMemo(() => (ready ? repo.data() : null), [repo, ready, rev]);
  const providers = useMemo(
    () => ({
      pay: new MockPaymentProvider(),
      esign: new MockESignProvider(),
      portal: new MockClientPortal(() => repo.data().galleries),
    }),
    [repo],
  );
  return { repo, data, bump, ...providers };
}
