import React, { useState, useEffect, useRef } from 'react';
import { Package, Clock, Send, User, MessageSquare, LineChart, ShoppingCart, Search, Zap, Info, Trophy } from 'lucide-react';
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
  const { 
    money, tokens, moneyHistory, inventory, bots, missions, startMission, completeMission, 
    chatHistory, addChatMessage,
    marketItems, buyMarketItem, agentSearchMarket, sellItem, buyTokens,
    llmReady, llmLoadingText, initLLM, sendMessageToBotWithLLM
  } = useGameStore();
  const [tick, setTick] = useState(0);
  const [activeBotId, setActiveBotId] = useState<string>(bots[0].id);
  const [chatInput, setChatInput] = useState('');
  const [typingBots, setTypingBots] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  type TabType = 'dashboard' | 'chat' | 'depot' | 'shop' | 'community' | 'account';

  const getInitialTab = (): TabType => {
    const hash = window.location.hash.replace('#', '');
    const validTabs: TabType[] = ['dashboard', 'chat', 'depot', 'shop', 'community', 'account'];
    return validTabs.includes(hash as TabType) ? (hash as TabType) : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs: TabType[] = ['dashboard', 'chat', 'depot', 'shop', 'community', 'account'];
      if (validTabs.includes(hash as TabType)) {
        setActiveTab(hash as TabType);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const mockedUsers = [
    { id: '3', name: 'tracemaker', revenue: 45200, isOnline: false, color: 'bg-green-500' },
    { id: '1', name: 'veri', revenue: 38400, isOnline: true, color: 'bg-purple-500' },
    { id: '2', name: 'sommerbist', revenue: 21500, isOnline: true, color: 'bg-yellow-500' },
    { id: '5', name: 'trinity', revenue: 14200, isOnline: false, color: 'bg-red-500' },
    { id: '4', name: 'neo', revenue: 3500, isOnline: true, color: 'bg-blue-500' }
  ];

  // Auto-initialize LLM on startup
  useEffect(() => {
    // Only call it once on mount
    initLLM();
  }, []);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const input = chatInput;
    setChatInput('');
    const targetBotId = activeBotId;

    if (!llmReady) {
      addChatMessage({ senderId: 'player', text: input });
      setTypingBots(prev => [...prev, targetBotId]);
      setTimeout(() => {
        setTypingBots(prev => prev.filter(id => id !== targetBotId));
        addChatMessage({ senderId: targetBotId, text: "KI-Kern ist offline. Bitte zuerst initialisieren." });
      }, 1000);
      return;
    }

    setTypingBots(prev => [...prev, targetBotId]);
    await sendMessageToBotWithLLM(targetBotId, input);
    setTypingBots(prev => prev.filter(id => id !== targetBotId));
  };

  const activeBot = bots.find(b => b.id === activeBotId);
  const activeBotMessages = chatHistory.filter(m => m.senderId === activeBotId || m.senderId === 'player');

  // Avatar component using actual images from store
  const BotAvatar = ({ botId, size = 'sm', showStatus = false }: { botId?: string, size?: 'sm' | 'md' | 'lg', showStatus?: boolean }) => {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    };
    
    const statusDotClasses = {
      sm: 'w-2 h-2 -bottom-0.5 -right-0.5 border',
      md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-2',
      lg: 'w-3 h-3 -bottom-0.5 -right-0.5 border-2'
    };
    
    const bot = bots.find(b => b.id === botId);

    const getStatusColor = () => {
      if (!bot) return 'bg-gray-400';
      if (bot.status === 'on_mission') return 'bg-red-500';
      return 'bg-green-500';
    };

    return (
      <div className={`relative ${sizeClasses[size]} shrink-0`}>
        <div className="w-full h-full flex items-center justify-center rounded-full overflow-hidden shadow-sm bg-gray-100">
          {bot?.avatar ? (
            <img src={bot.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
        {showStatus && bot && (
          <div className={`absolute rounded-full border-white ${getStatusColor()} ${statusDotClasses[size]}`} />
        )}
      </div>
    );
  };

  const PortfolioChart = ({ data }: { data: { time: number, amount: number }[] }) => {
    if (data.length < 2) return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Nicht genug Daten</div>;
    
    const minAmount = Math.min(...data.map(d => d.amount));
    const maxAmount = Math.max(...data.map(d => d.amount));
    const padding = (maxAmount - minAmount) * 0.1 || 10;
    const yMin = Math.max(0, minAmount - padding);
    const yMax = maxAmount + padding;
    
    const startTime = data[0].time;
    const endTime = data[data.length - 1].time;
    const timeSpan = endTime - startTime || 1;
    
    const getX = (time: number) => ((time - startTime) / timeSpan) * 100;
    const getY = (amount: number) => 100 - (((amount - yMin) / (yMax - yMin)) * 100);
    
    const points = data.map(d => `${getX(d.time)},${getY(d.amount)}`).join(' ');
    
    const isPositive = data[data.length - 1].amount >= data[0].amount;
    const strokeColor = isPositive ? '#22c55e' : '#ef4444'; // green-500 or red-500

    return (
      <div className="w-full h-40 relative">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
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
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium text-gray-900">${money.toLocaleString('de-DE')}</span>
             <span className="text-sm font-medium text-blue-600">🪙 {tokens}</span>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-white">
          
          {/* --- DASHBOARD TAB --- */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col h-full bg-white overflow-y-auto px-6 py-4 space-y-6">
              <h2 className="text-xl font-medium text-black">{t('dashboard')}</h2>
              
              <div className="flex gap-8">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-gray-500">{t('totalBalance')}</p>
                  <div className="text-4xl font-medium text-black tracking-tight">
                    ${money.toLocaleString('de-DE')}
                  </div>
                  {moneyHistory.length > 1 && (
                    <div className={`text-sm font-medium ${moneyHistory[moneyHistory.length - 1].amount >= moneyHistory[0].amount ? 'text-green-500' : 'text-red-500'}`}>
                      {moneyHistory[moneyHistory.length - 1].amount >= moneyHistory[0].amount ? '+' : ''}
                      {(moneyHistory[moneyHistory.length - 1].amount - moneyHistory[0].amount).toLocaleString('de-DE')} ({(
                        ((moneyHistory[moneyHistory.length - 1].amount - moneyHistory[0].amount) / moneyHistory[0].amount) * 100
                      ).toFixed(2)}%)
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-gray-500">Tokens</p>
                  <div className="text-4xl font-medium text-blue-600 tracking-tight flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    {tokens}
                  </div>
                  <button 
                    onClick={() => buyTokens(500, 50)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md mt-1 hover:bg-blue-100 transition-colors w-fit"
                  >
                    +500 ($50)
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-3xl p-4">
                <PortfolioChart data={moneyHistory} />
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-[13px] font-medium text-gray-400 uppercase tracking-wider">{t('recommendedActions')}</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => setActiveTab('chat')} 
                    className="flex flex-col text-left bg-white border border-gray-100 hover:border-gray-300 p-4 rounded-2xl transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-[14px] font-medium text-gray-900">{t('actionOrchestrate')}</span>
                    </div>
                    <p className="text-[12px] text-gray-500">{t('actionOrchestrateDesc')}</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('depot')}
                    className="flex flex-col text-left bg-white border border-gray-100 hover:border-gray-300 p-4 rounded-2xl transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                        <Info className="w-4 h-4" />
                      </div>
                      <span className="text-[14px] font-medium text-gray-900">{t('actionNewInfo')}</span>
                    </div>
                    <p className="text-[12px] text-gray-500">{t('actionNewInfoDesc')}</p>
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-[13px] font-medium text-gray-400 uppercase tracking-wider">{t('statistics')}</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-[15px] text-gray-600">{t('depotValue')}</span>
                    <span className="text-[15px] text-black font-medium">
                      ${inventory.reduce((sum, item) => sum + item.baseValue, 0).toLocaleString('de-DE')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-[15px] text-gray-600">{t('itemsFound')}</span>
                    <span className="text-[15px] text-black font-medium">{inventory.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[15px] text-gray-600">{t('uptime')}</span>
                    <span className="text-[15px] text-black font-medium">{Math.floor(tick / 60)}m {tick % 60}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    <BotAvatar botId={bot.id} size="md" showStatus={true} />
                    <span className="text-[15px]">{bot.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div 
                className="flex-1 overflow-y-auto px-6 py-4 space-y-6 z-10"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const btn = target.closest('button[data-action]');
                  if (btn) {
                    const actionText = btn.getAttribute('data-action');
                    if (actionText) {
                      sendMessageToBotWithLLM(activeBotId, actionText, 'player');
                    }
                  }
                }}
              >
                {!llmReady && (
                  <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 mb-6">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium text-black">KI-Kern Offline</h3>
                      <p className="text-[13px] text-gray-500 mt-1 max-w-[200px] mx-auto">Initialisiere lokales LLM für intelligenten Chat.</p>
                    </div>
                    {llmLoadingText ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`text-[11px] font-mono ${llmLoadingText.startsWith('Init Fehler') ? 'text-red-500 bg-red-50' : 'text-gray-500 bg-gray-100'} px-3 py-2 rounded-lg max-w-full break-all`}>
                          {llmLoadingText}
                        </div>
                        {llmLoadingText.startsWith('Init Fehler') && (
                          <button onClick={initLLM} className="bg-black hover:bg-gray-800 text-white text-[11px] font-medium px-4 py-1.5 rounded-full transition-colors mt-2">
                            Initialisierung wiederholen
                          </button>
                        )}
                      </div>
                    ) : (
                      <button onClick={initLLM} className="bg-black hover:bg-gray-800 text-white text-[13px] font-medium px-5 py-2.5 rounded-full transition-colors mt-2">
                        Llama-3.2 initialisieren
                      </button>
                    )}
                  </div>
                )}
                
                {activeBotMessages.map(msg => {
                  const isPlayer = msg.senderId === 'player';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                      <div className={`flex gap-3 max-w-[85%] ${isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isPlayer && (
                          <div className="mt-1 shrink-0">
                             <BotAvatar botId={activeBotId} size="md" showStatus={true} />
                          </div>
                        )}
                        <div className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isPlayer 
                              ? 'bg-gray-100 text-black' 
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}>
                            {isPlayer ? (
                              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                            ) : (
                              <div 
                                className="whitespace-pre-wrap text-[15px] leading-relaxed chat-html-content"
                                dangerouslySetInnerHTML={{ __html: msg.text }}
                              />
                            )}
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
                
                {activeBot?.status === 'on_mission' ? (
                  <div className="flex items-center justify-center mt-6 mb-2">
                    <span className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3 animate-spin" /> {t('inProgress')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center mt-6 mb-2">
                    <button 
                      onClick={() => activeBot && startMission(activeBot.id, 10000)}
                      className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-full text-xs font-medium transition-colors"
                    >
                      {t('startMission')}
                    </button>
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

          {/* --- DEPOT / INVENTORY TAB --- */}
          {activeTab === 'depot' && (
            <div className="flex flex-col h-full bg-white overflow-y-auto px-6 py-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-black">{t('depot')}</h2>
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
                          <p className="text-xs text-gray-500 capitalize">{t(item.rarity as any)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[15px] font-medium text-black">
                            ${item.baseValue.toLocaleString('de-DE')}
                          </div>
                        </div>
                        <button 
                          onClick={() => sellItem(item.id)}
                          className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          {t('sell')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- SHOP TAB --- */}
          {activeTab === 'shop' && (
            <div className="flex flex-col h-full bg-white overflow-y-auto px-6 py-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-black">{t('shop')}</h2>
                <span className="text-sm font-medium text-gray-900">${money.toLocaleString('de-DE')}</span>
              </div>

              {/* Agent Search Mock UI */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <Search className="w-4 h-4" /> {t('agentSearch')}
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const query = formData.get('query') as string;
                    const budgetStr = formData.get('budget') as string;
                    agentSearchMarket(bots[0].id, budgetStr ? parseInt(budgetStr) : undefined, query);
                    e.currentTarget.reset();
                  }}
                  className="flex flex-col gap-2"
                >
                  <input name="query" type="text" placeholder={t('searchPlaceholder')} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                  <div className="flex gap-2">
                    <input name="budget" type="number" placeholder={t('budget')} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">{t('search')}</button>
                  </div>
                </form>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-[13px] font-medium text-gray-400 uppercase tracking-wider">{t('market')}</h3>
                
                {marketItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-4">
                    <ShoppingCart className="w-8 h-8 stroke-1" />
                    <p className="text-[14px]">{t('noMarketItems')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {marketItems.map(mkt => (
                      <div key={mkt.id} className={`flex flex-col bg-white border ${mkt.isAgentFound ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'} p-4 rounded-2xl transition-colors`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mkt.item.rarity === 'rare' || mkt.item.rarity === 'illegal' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                              <Package className="w-4 h-4 stroke-1" />
                            </div>
                            <div>
                              <h3 className="text-[14px] font-medium text-black">{mkt.item.name}</h3>
                              <p className="text-[11px] text-gray-500 capitalize">{t(mkt.item.rarity as any)} • {t('seller')}: {mkt.sellerName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[15px] font-medium text-black">
                              ${mkt.price.toLocaleString('de-DE')}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => buyMarketItem(mkt.id)}
                          disabled={money < mkt.price}
                          className="w-full mt-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-gray-100 text-black font-medium py-2 rounded-xl text-[13px] transition-colors"
                        >
                          {t('buy')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- COMMUNITY TAB --- */}
          {activeTab === 'community' && (
            <div className="flex flex-col h-full bg-white overflow-y-auto px-6 py-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-black">{t('community')}</h2>
                <span className="text-sm text-gray-500">{mockedUsers.length} {t('realUsers')}</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {mockedUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-6 text-center text-gray-400 font-medium">
                        #{index + 1}
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${user.color}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-medium text-black">{user.name}</h3>
                          <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                        <p className="text-xs text-gray-500">{t('revenue')}: ${user.revenue.toLocaleString('de-DE')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    <span className="text-[15px] text-gray-600">{t('depotValue')}</span>
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
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors ${activeTab === 'dashboard' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LineChart className="w-6 h-6 stroke-1" />
            <span className="text-[11px] font-medium">{t('dashboard')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors ${activeTab === 'chat' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MessageSquare className="w-6 h-6 stroke-1" />
            <span className="text-[11px] font-medium">{t('chat')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('depot')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors ${activeTab === 'depot' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className="relative">
              <Package className="w-6 h-6 stroke-1" />
              {inventory.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black rounded-full border-2 border-white"></span>
              )}
            </div>
            <span className="text-[11px] font-medium">{t('depot')}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('shop')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors ${activeTab === 'shop' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ShoppingCart className="w-6 h-6 stroke-1" />
            <span className="text-[11px] font-medium">{t('shop')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-colors ${activeTab === 'community' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Trophy className="w-6 h-6 stroke-1" />
            <span className="text-[11px] font-medium">{t('community')}</span>
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
