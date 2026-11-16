import { useCallback, useEffect, useState } from 'react';
import type { ContentItem } from '../electron/ipc-contract';
import { SkyBackground } from './components/SkyBackground';
import type { CategoryId } from './data/categories';
import { CategoryScreen } from './screens/CategoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ParentGate } from './screens/ParentGate';
import { ParentPanel } from './screens/ParentPanel';
import { PlayerScreen } from './screens/PlayerScreen';

type Route =
  | { name: 'home' }
  | { name: 'category'; id: CategoryId }
  | { name: 'player'; item: ContentItem; from: CategoryId }
  | { name: 'parent-gate'; then: 'panel' | 'exit' }
  | { name: 'parent-panel' };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [items, setItems] = useState<ContentItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      setItems((await window.jarvis?.listContent()) ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Refrescar cuando la app importa videos al arrancar.
    return window.jarvis?.onContentChanged(() => void refresh());
  }, [refresh]);

  // Sin menú contextual ni arrastre de elementos: nada que "explorar".
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    window.addEventListener('contextmenu', block);
    window.addEventListener('dragstart', block);
    return () => {
      window.removeEventListener('contextmenu', block);
      window.removeEventListener('dragstart', block);
    };
  }, []);

  const goHome = useCallback(() => setRoute({ name: 'home' }), []);
  const openCategory = useCallback(
    (id: CategoryId) => {
      void refresh();
      setRoute({ name: 'category', id });
    },
    [refresh],
  );
  const openGate = useCallback(() => setRoute({ name: 'parent-gate', then: 'panel' }), []);
  const openExit = useCallback(() => setRoute({ name: 'parent-gate', then: 'exit' }), []);
  const openPanel = useCallback(() => setRoute({ name: 'parent-panel' }), []);
  const closePanel = useCallback(() => {
    void window.jarvis?.lockParent();
    void refresh();
    setRoute({ name: 'home' });
  }, [refresh]);

  let screen: React.ReactNode;
  switch (route.name) {
    case 'home':
      screen = <HomeScreen onOpenCategory={openCategory} onOpenParent={openGate} onExit={openExit} />;
      break;
    case 'category':
      screen = (
        <CategoryScreen
          key={route.id}
          categoryId={route.id}
          items={items.filter((i) => i.category === route.id)}
          onBack={goHome}
          onPlay={(item) => setRoute({ name: 'player', item, from: route.id })}
        />
      );
      break;
    case 'player':
      screen = <PlayerScreen item={route.item} onBack={() => openCategory(route.from)} />;
      break;
    case 'parent-gate':
      screen = (
        <ParentGate
          title={route.then === 'exit' ? 'Salir de JARVIS' : undefined}
          onUnlocked={route.then === 'exit' ? () => void window.jarvis?.quitApp() : openPanel}
          onCancel={goHome}
        />
      );
      break;
    case 'parent-panel':
      screen = <ParentPanel items={items} onChanged={refresh} onSessionExpired={openGate} onClose={closePanel} />;
      break;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SkyBackground />
      <div className="relative z-10 h-full">{screen}</div>
    </div>
  );
}
