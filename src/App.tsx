import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Package, Clock, Send, User, MessageSquare, Briefcase, Activity } from 'lucide-react';
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
  const { money, inventory, bots, missions, startMission, completeMission, chatHistory, addChatMessage } = useGameStore();
  const [tick, setTick] = useState(0);
  const [activeBotId, setActiveBotId] = useState<string>(bots[0].id);
  const [chatInput, setChatInput] = useState('');
  const [typingBots, setTypingBots] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'cargo' | 'account'>('chat');

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
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeBotId, typingBots, activeTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add player message
    addChatMessage({ senderId: 'player', text: chatInput });
    
    // Simple mock logic for "agent" responding
    const inputLower = chatInput.toLowerCase();
    const targetBot = bots.find(b => b.id === activeBotId);
    const botIdToReply = activeBotId;
    
    setTypingBots(prev => [...prev, botIdToReply]);

    setTimeout(() => {
      setTypingBots(prev => prev.filter(id => id !== botIdToReply));
      if (inputLower.includes('mission') || inputLower.includes('deploy') || inputLower.includes('go')) {
        if (targetBot?.status === 'idle') {
          addChatMessage({ senderId: botIdToReply, text: `Copy that! Initiating launch sequence now. ETA 5 seconds.` });
          startMission(botIdToReply, 5000);
        } else {
          addChatMessage({ senderId: botIdToReply, text: `I'm already on a mission, Captain! Wait until I get back.` });
        }
      } else {
        addChatMessage({ senderId: botIdToReply, text: `Acknowledged: "${chatInput}". (Hint: tell me to go on a "mission"!)` });
      }
    }, 1500);

    setChatInput('');
  };

  const activeBot = bots.find(b => b.id === activeBotId);
  const activeBotMessages = chatHistory.filter(m => m.senderId === activeBotId || m.senderId === 'player');

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans">
      <div className="w-full max-w-md bg-slate-900 shadow-2xl flex flex-col h-[100dvh] relative border-x border-slate-800">
        
        {/* TOP HEADER */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-slate-950 z-10 shrink-0">
          <h1 className="text-xl font-bold text-emerald-500 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5" /> Agent-Crew
          </h1>
          <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{money.toLocaleString('de-DE')}</span>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-900">
          
          {/* --- CHAT TAB --- */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full bg-black relative">
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 z-0"></div>
              
              {/* Roster Horizontal Scroll */}
              <div className="flex overflow-x-auto gap-2 p-3 border-b border-slate-800 bg-slate-950 z-10 shrink-0 hide-scrollbar">
                {bots.map(bot => (
                  <button
                    key={bot.id}
                    onClick={() => setActiveBotId(bot.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap transition-all ${
                      activeBotId === bot.id 
                        ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-100' 
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="relative">
                      {bot.avatar ? (
                        <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-full object-cover border border-slate-600 shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${bot.status === 'idle' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    </div>
                    <span className="font-medium text-sm truncate max-w-[100px]">{bot.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10">
                {activeBotMessages.map(msg => {
                  const isPlayer = msg.senderId === 'player';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                      <div className={`flex gap-3 max-w-[85%] ${isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isPlayer && activeBot?.avatar && (
                          <img src={activeBot.avatar} alt={activeBot.name} className="w-8 h-8 rounded-full border border-emerald-800 object-cover mt-1 shadow-md shrink-0" />
                        )}
                        <div className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-xl border ${
                            isPlayer 
                              ? 'bg-indigo-900/40 border-indigo-800/50 text-indigo-100 rounded-br-sm' 
                              : 'bg-emerald-900/20 border-emerald-800/30 text-emerald-400 rounded-bl-sm font-mono text-sm'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <span className={`text-[10px] mt-1 text-slate-600 uppercase tracking-widest font-semibold ${isPlayer ? 'mr-1' : 'ml-1'}`}>
                            {isPlayer ? 'You' : activeBot?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {typingBots.includes(activeBotId) && (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[80%] p-3 rounded-xl border bg-emerald-900/20 border-emerald-800/30 text-emerald-400 rounded-bl-sm">
                      <div className="flex gap-1.5 items-center py-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeBot?.status === 'on_mission' && (
                  <div className="flex items-center justify-center mt-6 mb-2">
                    <span className="text-xs text-amber-500/80 bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-2 animate-pulse font-mono uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> Unit Deployed
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} className="h-2" />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 z-10 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a command..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-emerald-900/20"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          )}

          {/* --- CARGO / INVENTORY TAB --- */}
          {activeTab === 'cargo' && (
            <div className="flex flex-col h-full bg-slate-900 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
                  <Package className="w-5 h-5 text-indigo-400" /> Cargo Bay
                </h2>
                <span className="text-sm text-slate-400">{inventory.length} Items</span>
              </div>

              {inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-3 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                  <Package className="w-12 h-12 opacity-20" />
                  <p className="text-sm">No items in cargo.</p>
                  <p className="text-xs opacity-70">Send crew on missions to salvage gear.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {inventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-800 border border-slate-700 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.rarity === 'rare' ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50' : 'bg-slate-700/30 text-slate-400 border border-slate-600/50'}`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-200">{item.name}</h3>
                          <p className="text-xs text-slate-400 capitalize">{item.rarity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400 flex items-center justify-end">
                          {item.baseValue.toLocaleString('de-DE')} <DollarSign className="w-3 h-3 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- ACCOUNT / STATS TAB --- */}
          {activeTab === 'account' && (
            <div className="flex flex-col h-full bg-slate-900 overflow-y-auto p-4 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200 mb-2">
                <User className="w-5 h-5 text-emerald-400" /> Commander Profile
              </h2>
              
              <div className="bg-gradient-to-br from-emerald-900/40 to-slate-800 border border-emerald-800/30 p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <DollarSign className="w-24 h-24" />
                </div>
                <p className="text-sm text-emerald-200 mb-1 z-10">Total Balance</p>
                <div className="text-4xl font-bold text-emerald-400 flex items-center z-10 tracking-tight">
                  <DollarSign className="w-8 h-8 mr-1" /> {money.toLocaleString('de-DE')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Briefcase className="w-6 h-6 text-indigo-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-200">{bots.length}</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Crew Members</span>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Activity className="w-6 h-6 text-amber-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-200">{missions.length}</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Active Missions</span>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                  <h3 className="text-sm font-semibold text-slate-300">System Logs</h3>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Uptime</span>
                    <span className="text-emerald-400 font-mono">{Math.floor(tick / 60)}m {tick % 60}s</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Items Found</span>
                    <span className="text-slate-200 font-bold">{inventory.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Cargo Value</span>
                    <span className="text-emerald-400 font-bold">
                      {inventory.reduce((sum, item) => sum + item.baseValue, 0).toLocaleString('de-DE')}$
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="flex justify-around items-center bg-slate-950 border-t border-slate-800 pb-safe pt-2 px-2 shrink-0 h-16">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'chat' ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <MessageSquare className={`w-6 h-6 ${activeTab === 'chat' ? 'fill-emerald-900/20' : ''}`} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Comms</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('cargo')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'cargo' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <div className="relative">
              <Package className={`w-6 h-6 ${activeTab === 'cargo' ? 'fill-indigo-900/20' : ''}`} />
              {inventory.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-950"></span>
              )}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">Cargo</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === 'account' ? 'text-slate-200' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <User className={`w-6 h-6 ${activeTab === 'account' ? 'fill-slate-700' : ''}`} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Profile</span>
          </button>
        </nav>

      </div>
    </div>
  );
}

export default App;

