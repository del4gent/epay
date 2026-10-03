import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Package, Terminal, Clock, Send, CheckCircle2, User } from 'lucide-react';
import { useGameStore } from './store/gameStore';
import type { Item } from './types';

const generateRandomItem = (): Item => {
  const isLucky = Math.random() > 0.8;
  return {
    id: `item-${Date.now()}`,
    name: isLucky ? 'Quantum Processor' : 'Scrap Metal',
    baseValue: isLucky ? 50 : 5,
    rarity: isLucky ? 'rare' : 'common',
  };
};

function App() {
  const { money, inventory, bots, missions, startMission, completeMission, listItem, listings, sellListing, chatHistory, addChatMessage } = useGameStore();
  const [tick, setTick] = useState(0);
  const [activeBotId, setActiveBotId] = useState<string>(bots[0].id);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Global Game Tick
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Complete missions
  useEffect(() => {
    const now = Date.now();
    missions.forEach(mission => {
      if (now >= mission.endTime) {
        completeMission(mission.id, generateRandomItem());
        addChatMessage({
          senderId: mission.botId,
          text: `Mission accomplished, Captain. I've returned with salvaged goods. Check the inventory.`,
        });
      }
    });
  }, [tick, missions, completeMission, addChatMessage]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeBotId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add player message
    addChatMessage({ senderId: 'player', text: chatInput });
    
    // Simple mock logic for "agent" responding
    const inputLower = chatInput.toLowerCase();
    const targetBot = bots.find(b => b.id === activeBotId);
    
    setTimeout(() => {
      if (inputLower.includes('mission') || inputLower.includes('deploy') || inputLower.includes('go')) {
        if (targetBot?.status === 'idle') {
          addChatMessage({ senderId: activeBotId, text: `Copy that! Initiating launch sequence now. ETA 5 seconds.` });
          startMission(activeBotId, 5000);
        } else {
          addChatMessage({ senderId: activeBotId, text: `I'm already on a mission, Captain! Wait until I get back.` });
        }
      } else {
        addChatMessage({ senderId: activeBotId, text: `Acknowledged: "${chatInput}". (Hint: tell me to go on a "mission"!)` });
      }
    }, 1000);

    setChatInput('');
  };

  const activeBot = bots.find(b => b.id === activeBotId);
  const activeBotMessages = chatHistory.filter(m => m.senderId === activeBotId || m.senderId === 'player');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-emerald-500 tracking-tight">Project <span className="text-slate-300">Agent-Crew</span></h1>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-700">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span className="text-xl font-bold text-emerald-400">{money.toLocaleString('de-DE')}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Crew Roster & Stats */}
        <div className="md:col-span-1 space-y-6">
          <section className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
              <User className="w-5 h-5 text-indigo-400" /> Crew Roster
            </h2>
            <div className="space-y-2">
              {bots.map(bot => (
                <button
                  key={bot.id}
                  onClick={() => setActiveBotId(bot.id)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between border transition-colors ${activeBotId === bot.id ? 'bg-indigo-900/50 border-indigo-500 text-indigo-100' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                  <span className="font-medium text-sm">{bot.name}</span>
                  <div className={`w-2 h-2 rounded-full ${bot.status === 'idle' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-800 border border-slate-700 shadow-sm rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
              <Package className="w-5 h-5 text-indigo-400" /> Cargo Bay
            </h2>
            {inventory.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Empty. Send crew on missions.</p>
            ) : (
              <ul className="space-y-2">
                {inventory.map(item => (
                  <li key={item.id} className="text-sm flex justify-between bg-slate-900/50 p-2 rounded">
                    <span>{item.name}</span>
                    <span className="text-emerald-400">{item.baseValue}$</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Crew Comms Terminal */}
        <div className="md:col-span-3 bg-black border border-slate-800 shadow-xl rounded-2xl flex flex-col h-[700px] overflow-hidden font-mono relative">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 z-10"></div>
          
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between z-20">
            <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-500 uppercase tracking-wider">
              <Terminal className="w-5 h-5" /> comms-link: {activeBot?.name}
            </h2>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950 z-20">
            {activeBotMessages.map(msg => {
              const isPlayer = msg.senderId === 'player';
              return (
                <div key={msg.id} className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg border ${isPlayer ? 'bg-indigo-900/40 border-indigo-800/50 text-indigo-100 rounded-br-none' : 'bg-emerald-900/20 border-emerald-800/30 text-emerald-400 rounded-bl-none'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className={`text-[10px] mt-1 text-slate-600 uppercase tracking-widest font-semibold ${isPlayer ? 'mr-1' : 'ml-1'}`}>
                    {isPlayer ? 'Captain' : activeBot?.name}
                  </span>
                </div>
              );
            })}
            
            {activeBot?.status === 'on_mission' && (
              <div className="flex items-center justify-center mt-4">
                <span className="text-xs text-amber-500/70 bg-amber-900/20 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-2 animate-pulse">
                  <Clock className="w-3 h-3" /> Signal Active - Unit on Mission
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 z-20 flex gap-3">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Send message to ${activeBot?.name}...`}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-emerald-900/40 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/50 px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-2"
            >
              <span>Transmit</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default App;
