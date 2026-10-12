/** True when removing owner rights from (or deactivating) `target` would leave no other active owner. */
export function wouldLeaveNoOwner(activeOwnerEmails: string[], target: string): boolean {
  return activeOwnerEmails.filter((e) => e !== target).length === 0;
}
