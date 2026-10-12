/** Browser-side helpers: one LocalStore shared by all mock UIs. */
import { LocalStore, type MockStore } from "./store";
import { StudioRepo } from "./studio";

let store: MockStore | undefined;
export const mockStore = () => (store ??= new LocalStore("mock:"));
export const studio = () => new StudioRepo(mockStore());
