import React, { useState, useEffect, useRef } from 'react';
import { Package, Clock, Send, User, MessageSquare } from 'lucide-react';
import { useGameStore } from './store/gameStore';
import type { Item } from './types';
import { t } from './i18n';

const generateRandomItem = (): Item => {
  const isLucky = Math.random() > 0.8;
  return {
    id: `item-${Date.now()}`,
    name: isLucky ? t('quantumProcessor') : t('scrapMetal'),
    baseValue: isLucky ? 50 : 5,
    rarity: (isLucky ? 'rare' : 'common') as Item['rarity'],
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
          text: t('missionAccomplished'),
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

    addChatMessage({ senderId: 'player', text: chatInput });
    
    const inputLower = chatInput.toLowerCase();
    const targetBot = bots.find(b => b.id === activeBotId);
    const botIdToReply = activeBotId;
    
    setTypingBots(prev => [...prev, botIdToReply]);

    setTimeout(() => {
      setTypingBots(prev => prev.filter(id => id !== botIdToReply));
      if (inputLower.includes('mission') || inputLower.includes('deploy') || inputLower.includes('go')) {
        if (targetBot?.status === 'idle') {
          addChatMessage({ senderId: botIdToReply, text: t('launchSequence') });
          startMission(botIdToReply, 5000);
        } else {
          addChatMessage({ senderId: botIdToReply, text: t('alreadyOnMission') });
        }
      } else {
        addChatMessage({ senderId: botIdToReply, text: t('acknowledged') });
      }
    }, 1500);

    setChatInput('');
  };

  const activeBot = bots.find(b => b.id === activeBotId);
  const activeBotMessages = chatHistory.filter(m => m.senderId === activeBotId || m.senderId === 'player');

  // Avatar component using OpenAI Dots geometric abstract style
  const BotAvatar = ({ botId, size = 'sm', pulse = false }: { botId?: string, size?: 'sm' | 'md' | 'lg', pulse?: boolean }) => {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    };
    
    // Sleek geometric colors from the screenshot
    const colors = {
      'bot-1': 'bg-[#40b8a6]', // teal
      'bot-2': 'bg-[#f49336]', // orange
      'default': 'bg-[#3b82f6]' // blue
    };
    const bgColor = botId && colors[botId as keyof typeof colors] ? colors[botId as keyof typeof colors] : colors['default'];

    return (
      <div className={`relative flex items-center justify-center rounded-full ${sizeClasses[size]} ${bgColor} shrink-0 overflow-hidden ${pulse ? 'animate-pulse' : ''} shadow-sm`}>
         <div className="absolute top-[22%] left-[28%] w-[16%] h-[38%] bg-white rounded-full rotate-[25deg]" />
         <div className="absolute top-[32%] right-[28%] w-[16%] h-[38%] bg-white rounded-full rotate-[25deg]" />
      </div>
    );
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans text-gray-900">
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col h-[100dvh] relative overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="flex justify-between items-center px-6 py-4 z-10 shrink-0">
          <h1 className="text-lg font-medium text-gray-900 tracking-tight">
            {t('agentCrew')}
          </h1>
          <div className="flex items-center">
             <span className="text-sm font-medium text-gray-900">${money.toLocaleString('de-DE')}</span>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-white">
          
          {/* --- CHAT TAB --- */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full bg-white relative">
              
              {/* Roster Horizontal Scroll */}
              <div className="flex overflow-x-auto gap-2 px-6 py-2 z-10 shrink-0 hide-scrollbar">
                {bots.map(bot => (
                  <button
                    key={bot.id}
                    onClick={() => setActiveBotId(bot.id)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                      activeBotId === bot.id 
                        ? 'bg-gray-100 text-black font-medium' 
                        : 'bg-transparent text-gray-500 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    <BotAvatar botId={bot.id} size="md" pulse={bot.status === 'on_mission'} />
                    <span className="text-[15px]">{bot.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 z-10">
                {activeBotMessages.map(msg => {
                  const isPlayer = msg.senderId === 'player';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                      <div className={`flex gap-3 max-w-[85%] ${isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isPlayer && (
                          <div className="mt-1 shrink-0">
                             <BotAvatar botId={activeBotId} size="md" />
                          </div>
                        )}
                        <div className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isPlayer 
                              ? 'bg-gray-100 text-black' 
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}>
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {typingBots.includes(activeBotId) && (
                  <div className="flex flex-col items-start ml-12">
                    <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 text-gray-400">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeBot?.status === 'on_mission' && (
                  <div className="flex items-center justify-center mt-6 mb-2">
                    <span className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3 animate-spin" /> {t('inProgress')}
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} className="h-4" />
              </div>

              {/* Chat Input */}
              <div className="px-6 py-4 bg-white z-10 shrink-0 border-t border-gray-50">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t('messagePlaceholder')}
                    className="flex-1 bg-gray-50 border-none rounded-full pl-5 pr-12 py-3 text-black text-[15px] focus:outline-none focus:ring-1 focus:ring-gray-200 placeholder:text-gray-400"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="absolute right-1.5 top-1.5 bg-black hover:bg-gray-800 text-white w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-0 disabled:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- CARGO / INVENTORY TAB --- */}
          {activeTab === 'cargo' && (
            <div className="flex flex-col h-full bg-white overflow-y-auto px-6 py-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-black">{t('cargo')}</h2>
                <span className="text-sm text-gray-500">{inventory.length} {t('itemsCount')}</span>
              </div>

              {inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                  <Package className="w-10 h-10 stroke-1" />
                  <p className="text-[15px]">{t('noItems')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {inventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.rarity === 'rare' ? 'bg-gray-50 text-black' : 'bg-gray-50 text-gray-500'}`}>
                          <Package className="w-5 h-5 stroke-1" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-medium text-black">{item.name}</h3>
                          <p className="text-xs text-gray-500 capitalize">{item.rarity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[15px] font-medium text-black">
                          ${item.baseValue.toLocaleString('de-DE')}
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
            <div className="flex flex-col h-full bg-white overflow-y-auto px-6 py-4 space-y-8">
              <h2 className="text-xl font-medium text-black">{t('profile')}</h2>
              
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-sm text-gray-500 mb-2">{t('totalBalance')}</p>
                <div className="text-4xl font-medium text-black tracking-tight">
                  ${money.toLocaleString('de-DE')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-medium text-black mb-1">{bots.length}</span>
                  <span className="text-[13px] text-gray-500">{t('agents')}</span>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-medium text-black mb-1">{missions.length}</span>
                  <span className="text-[13px] text-gray-500">{t('active')}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-[13px] font-medium text-gray-400 uppercase tracking-wider">{t('statistics')}</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-[15px] text-gray-600">{t('uptime')}</span>
                    <span className="text-[15px] text-black font-medium">{Math.floor(tick / 60)}m {tick % 60}s</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-[15px] text-gray-600">{t('itemsFound')}</span>
                    <span className="text-[15px] text-black font-medium">{inventory.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[15px] text-gray-600">{t('cargoValue')}</span>
                    <span className="text-[15px] text-black font-medium">
                      ${inventory.reduce((sum, item) => sum + item.baseValue, 0).toLocaleString('de-DE')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="flex justify-around items-center bg-white border-t border-gray-100 pb-safe pt-3 px-6 shrink-0 h-20">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors ${activeTab === 'chat' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MessageSquare className="w-6 h-6 stroke-1" />
            <span className="text-[11px] font-medium">{t('chat')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('cargo')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors ${activeTab === 'cargo' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className="relative">
              <Package className="w-6 h-6 stroke-1" />
              {inventory.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black rounded-full border-2 border-white"></span>
              )}
            </div>
            <span className="text-[11px] font-medium">{t('cargo')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors ${activeTab === 'account' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <User className="w-6 h-6 stroke-1" />
            <span className="text-[11px] font-medium">{t('profile')}</span>
          </button>
        </nav>

      </div>
    </div>
  );
}

export default App;
