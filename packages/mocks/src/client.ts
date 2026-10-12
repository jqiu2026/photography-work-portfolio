/** Browser-side helpers: one LocalStore shared by all mock UIs. */
import { LocalStore, type MockStore } from "./store";
import { StudioRepo } from "./studio";

let store: MockStore | undefined;
export const mockStore = (): MockStore => {
  if (!store) store = new LocalStore("mock:");
  return store;
};
export const studio = () => new StudioRepo(mockStore());
