import { useEffect } from 'react';

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 3500);
    return () => window.clearTimeout(id);
  }, [message, onDone]);

  return (
    <div
      role="status"
      className="animate-pop-in fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-8 py-4 text-lg font-bold text-indigo-900 shadow-2xl"
    >
      {message}
    </div>
  );
}
