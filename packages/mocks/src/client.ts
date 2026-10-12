/** Browser-side helper: one LocalStore shared by the remaining mock UIs (score cart and orders). */
import { LocalStore, type MockStore } from "./store";

let store: MockStore | undefined;
export const mockStore = (): MockStore => {
  if (!store) store = new LocalStore("mock:");
  return store;
};
