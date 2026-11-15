// The native counterpart of the web revalidatePath: after a change, every
// screen that is still mounted loads its data again, so the list behind a
// detail screen is current when the viewer goes back.
type Listener = () => void;

const listeners = new Set<Listener>();

export function onInvalidate(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function invalidate(): void {
  for (const listener of [...listeners]) listener();
}
