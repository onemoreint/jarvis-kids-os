import { useCallback, useEffect, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { CategoryScreen } from './screens/CategoryScreen';
import { SkyBackground } from './components/SkyBackground';
import type { CategoryId } from './data/categories';

type Route = { name: 'home' } | { name: 'category'; id: CategoryId };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });

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
  const openCategory = useCallback((id: CategoryId) => setRoute({ name: 'category', id }), []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SkyBackground />
      <div className="relative z-10 h-full">
        {route.name === 'home' ? (
          <HomeScreen onOpenCategory={openCategory} />
        ) : (
          <CategoryScreen key={route.id} categoryId={route.id} onBack={goHome} />
        )}
      </div>
    </div>
  );
}
