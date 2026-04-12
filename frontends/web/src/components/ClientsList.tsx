import { Smartphone, Monitor, Tablet, Laptop, Tv, Watch, Gamepad2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import ClientCard from './ClientCard.tsx';
import useFilteredClients from '@airscan/engine/selectors/useFilteredClients.ts';
import Card from './ui/Card.tsx';

function RotatingDeviceIcon(props: { className: string }) {
  const devices = [
    Smartphone,
    Gamepad2,
    Tablet,
    Laptop,
    Monitor,
    Watch,
    Tv,
  ] as const;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % devices.length);
        setIsAnimating(false);
      }, 200); // Half of transition time for smooth swap
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = devices[currentIndex]!;

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`
          transition-all duration-400 ease-in-out transform
          ${isAnimating ? 'opacity-0 scale-75 rotate-12' : 'opacity-100 scale-100 rotate-0'}
        `}
      >
        <CurrentIcon className={`${props.className} text-slate-600`} strokeWidth={1.5} />
      </div>
    </div>
  );
};


export default function ClientsList() {
  const filteredClients = useFilteredClients();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Smartphone className="w-4 h-4" /> Clients ({filteredClients.length})
        </h2>
      </div>

      <div className="space-y-3">
        {filteredClients.map((client) => (
          <ClientCard key={client.mac} client={client} />
        ))}

        {filteredClients.length === 0 && (
          <Card className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
            <RotatingDeviceIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500">No clients detected.</p>
          </Card>
        )}
      </div>
    </div>
  );
};