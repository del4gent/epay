import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { Package, DollarSign, Send, Clock, User, CheckCircle2 } from 'lucide-react';
import { Item } from './types';

// Mock Random Item Generator
const generateRandomItem = (): Item => {
  const isLucky = Math.random() > 0.8;
  return {
    id: `item-${Date.now()}`,
    name: isLucky ? 'Rare Component' : 'Scrap Metal',
    baseValue: isLucky ? 50 : 5,
    rarity: isLucky ? 'rare' : 'common',
  };
};

function App() {
  const { money, inventory, bots, missions, startMission, completeMission, listItem, listings, sellListing } = useGameStore();
  const [tick, setTick] = useState(0);

  // Global Game Tick (for Idle mechanics)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for completed missions on tick
  useEffect(() => {
    const now = Date.now();
    missions.forEach(mission => {
      if (now >= mission.endTime) {
        completeMission(mission.id, generateRandomItem());
      }
    });
  }, [tick, missions, completeMission]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-4 md:p-8 font-mono">
      <header className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
        <h1 className="text-3xl font-bold text-green-500 tracking-tighter">ePay<span className="text-neutral-500">_syndicate</span></h1>
        <div className="flex items-center gap-2 bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-800">
          <DollarSign className="w-5 h-5 text-green-500" />
          <span className="text-xl font-bold text-green-500">{money.toLocaleString('de-DE')}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Market & Inventory */}
        <div className="md:col-span-2 space-y-6">
          {/* Inventory */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" /> Inventory
            </h2>
            {inventory.length === 0 ? (
              <p className="text-neutral-500 italic">No items. Send your crew to fetch some.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {inventory.map(item => (
                  <div key={item.id} className="bg-neutral-950 p-3 rounded border border-neutral-800 flex flex-col justify-between">
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-sm text-neutral-400">Est. {item.baseValue}$</div>
                    </div>
                    <button 
                      onClick={() => listItem(item, item.baseValue * 1.5)}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-1 rounded text-sm transition-colors"
                    >
                      List on ePay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Listings */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" /> Active ePay Listings
            </h2>
            {listings.length === 0 ? (
              <p className="text-neutral-500 italic">Nothing currently listed.</p>
            ) : (
              <div className="space-y-3">
                {listings.map(listing => (
                  <div key={listing.id} className="flex justify-between items-center bg-neutral-950 p-3 rounded border border-neutral-800">
                    <div>
                      <span className="font-bold">{listing.item.name}</span>
                      <span className="ml-2 text-green-500">${listing.listedPrice}</span>
                    </div>
                    <button 
                      onClick={() => sellListing(listing.id)}
                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept Offer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Crew Chat */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col h-[600px]">
          <div className="p-4 border-b border-neutral-800 bg-neutral-950 rounded-t-xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" /> Crew Comms
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-neutral-800 p-3 rounded-lg rounded-tl-none w-[85%]">
              <p className="text-sm text-neutral-300">Hey boss. I'm ready to scavenge. Just say the word.</p>
              <span className="text-xs text-neutral-500 mt-1 block">Scrap-Collector • Lvl 1</span>
            </div>
            
            {bots.map(bot => {
              if (bot.status === 'on_mission' && bot.missionEndTime) {
                const timeLeft = Math.max(0, Math.ceil((bot.missionEndTime - Date.now()) / 1000));
                return (
                  <div key={bot.id} className="bg-purple-900/30 border border-purple-500/30 p-3 rounded-lg w-[85%] ml-auto">
                    <p className="text-sm text-purple-200">On it. Back in {timeLeft}s.</p>
                    <span className="text-xs text-purple-400 mt-1 block flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Mission in progress
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="p-4 border-t border-neutral-800 bg-neutral-950 rounded-b-xl space-y-2">
            {bots.map(bot => (
              <button 
                key={bot.id}
                disabled={bot.status !== 'idle'}
                onClick={() => startMission(bot.id, 5000)} // 5 seconds mission
                className="w-full flex justify-between items-center bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded transition-colors"
              >
                <span>Send {bot.name}</span>
                <Send className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
