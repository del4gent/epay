import { create } from 'zustand';
import type { Item, Listing, Bot, Mission, ChatMessage } from '../types';
import { llmService } from '../services/llmService';
import sparkyAvatar from '../assets/sparky.jpg';
import novaAvatar from '../assets/nova.jpg';
import { t, getLanguage } from '../i18n';

interface GameState {
  money: number;
  tokens: number;
  inventory: Item[];
  listings: Listing[];
  bots: Bot[];
  missions: Mission[];
  chatHistory: ChatMessage[];
  moneyHistory: { time: number; amount: number }[];
  marketItems: import('../types').MarketItem[];
  
  // Actions
  addMoney: (amount: number) => void;
  consumeTokens: (amount: number) => void;
  buyTokens: (amount: number, cost: number) => void;
  startMission: (botId: string, duration: number) => void;
  completeMission: (missionId: string, reward: Item) => void;
  listItem: (item: Item, price: number) => void;
  sellListing: (listingId: string) => void;
  sellItem: (itemId: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  buyMarketItem: (marketItemId: string) => void;
  agentSearchMarket: (botId: string, budget?: number, query?: string) => void;
  
  // LLM State
  llmReady: boolean;
  llmLoadingText: string;
  initLLM: () => Promise<void>;
  sendMessageToBotWithLLM: (botId: string, text: string, senderId?: string) => Promise<void>;
}

const INITIAL_BOTS: Bot[] = [
  { id: 'bot-1', name: t('sparky'), avatar: sparkyAvatar, level: 1, status: 'idle' },
  { id: 'bot-2', name: t('nova'), avatar: novaAvatar, level: 1, status: 'on_mission', missionEndTime: Date.now() + 60000 }
];

const INITIAL_MISSIONS: Mission[] = [
  { id: 'm-initial-1', botId: 'bot-2', endTime: Date.now() + 60000 }
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 'msg-1', senderId: 'bot-1', text: t('initialChat'), timestamp: Date.now() - 10000 },
  { id: 'msg-2', senderId: 'bot-2', text: 'Erkunde Sektor 7 nach Vorräten. Bin bald zurück!', timestamp: Date.now() - 5000 }
];

const INITIAL_MARKET_ITEMS: import('../types').MarketItem[] = [
  {
    id: 'mkt-1',
    item: { id: 'item-stk1', name: 'Wirecard-Aktie (Garantiert sicher!)', baseValue: 1, rarity: 'common' },
    price: 2,
    sellerName: 'JanM'
  },
  {
    id: 'mkt-2',
    item: { id: 'item-stk2', name: 'Gebrauchter DogeCoin', baseValue: 69, rarity: 'uncommon' },
    price: 420,
    sellerName: 'ElonM_Fan99'
  },
  {
    id: 'mkt-3',
    item: { id: 'item-stk3', name: 'Blockbuster-Aktie (Vintage)', baseValue: 500, rarity: 'epic' },
    price: 800,
    sellerName: 'RetroInvest'
  },
  {
    id: 'mkt-4',
    item: { id: 'item-stk4', name: 'Tulpenzwiebel (Der originale Bitcoin)', baseValue: 150, rarity: 'rare' },
    price: 200,
    sellerName: 'DutchTrader_1637'
  },
  {
    id: 'mkt-5',
    item: { id: 'item-stk5', name: 'ToTheMoon-Coin 🚀🚀🚀', baseValue: 0, rarity: 'common' },
    price: 10,
    sellerName: 'DiamondHands'
  },
  {
    id: 'mkt-6',
    item: { id: 'item-stk6', name: 'Geheimer Insider-Tipp vom Cousin', baseValue: 50, rarity: 'illegal' },
    price: 300,
    sellerName: 'TrustMeBro'
  },
  {
    id: 'mkt-7',
    item: { id: 'item-stk7', name: 'FTX Token (Nur leichter Wasserschaden)', baseValue: -10, rarity: 'common' },
    price: 5,
    sellerName: 'SBF_Official'
  }
];

const INITIAL_INVENTORY: Item[] = [
  { id: 'item-inv-1', name: 'Altmetall', baseValue: 5, rarity: 'common' },
  { id: 'item-inv-2', name: 'Quantenprozessor', baseValue: 120, rarity: 'rare' },
  { id: 'item-inv-3', name: 'Hyperantrieb-Kern', baseValue: 450, rarity: 'rare' }
];

const INITIAL_MONEY_HISTORY = [
  { time: Date.now() - 300000, amount: 200 },
  { time: Date.now() - 240000, amount: 250 },
  { time: Date.now() - 180000, amount: 400 },
  { time: Date.now() - 120000, amount: 350 },
  { time: Date.now() - 60000, amount: 500 }
];

export const useGameStore = create<GameState>((set) => ({
  money: 500, // increased starting money to test shop
  tokens: 1000,
  inventory: INITIAL_INVENTORY,
  listings: [],
  bots: INITIAL_BOTS,
  missions: INITIAL_MISSIONS,
  chatHistory: INITIAL_CHAT,
  moneyHistory: INITIAL_MONEY_HISTORY,
  marketItems: INITIAL_MARKET_ITEMS,

  consumeTokens: (amount) => set((state) => ({ tokens: Math.max(0, state.tokens - amount) })),
  buyTokens: (amount, cost) => set((state) => {
    if (state.money >= cost) {
      const newMoney = state.money - cost;
      return {
        money: newMoney,
        moneyHistory: [...state.moneyHistory, { time: Date.now(), amount: newMoney }],
        tokens: state.tokens + amount
      };
    }
    return state;
  }),

  addMoney: (amount) => set((state) => {
    const newMoney = state.money + amount;
    return { 
      money: newMoney,
      moneyHistory: [...state.moneyHistory, { time: Date.now(), amount: newMoney }]
    };
  }),

  startMission: (botId, duration) => set((state) => {
    const endTime = Date.now() + duration;
    const newMission: Mission = { id: `m-${Date.now()}`, botId, endTime };
    
    return {
      missions: [...state.missions, newMission],
      bots: state.bots.map(b => b.id === botId ? { ...b, status: 'on_mission', missionEndTime: endTime } : b)
    };
  }),

  completeMission: (missionId, reward) => set((state) => {
    const mission = state.missions.find(m => m.id === missionId);
    if (!mission) return state;

    return {
      missions: state.missions.filter(m => m.id !== missionId),
      bots: state.bots.map(b => b.id === mission.botId ? { ...b, status: 'idle', missionEndTime: undefined } : b),
      inventory: [...state.inventory, reward]
    };
  }),

  listItem: (item, price) => set((state) => ({
    inventory: state.inventory.filter(i => i.id !== item.id),
    listings: [...state.listings, { id: `list-${item.id}`, item, listedPrice: price, timeListed: Date.now() }]
  })),

  sellListing: (listingId) => set((state) => {
    const listing = state.listings.find(l => l.id === listingId);
    if (!listing) return state;
    const newMoney = state.money + listing.listedPrice;
    return {
      money: newMoney,
      moneyHistory: [...state.moneyHistory, { time: Date.now(), amount: newMoney }],
      listings: state.listings.filter(l => l.id !== listingId)
    };
  }),

  sellItem: (itemId) => set((state) => {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return state;
    const newMoney = state.money + item.baseValue;
    return {
      money: newMoney,
      moneyHistory: [...state.moneyHistory, { time: Date.now(), amount: newMoney }],
      inventory: state.inventory.filter(i => i.id !== itemId)
    };
  }),

  buyMarketItem: (marketItemId) => set((state) => {
    const marketItem = state.marketItems.find(m => m.id === marketItemId);
    if (!marketItem || state.money < marketItem.price) return state;
    
    const newMoney = state.money - marketItem.price;
    return {
      money: newMoney,
      moneyHistory: [...state.moneyHistory, { time: Date.now(), amount: newMoney }],
      inventory: [...state.inventory, { ...marketItem.item, id: `bought-${Date.now()}` }],
      marketItems: state.marketItems.filter(m => m.id !== marketItemId)
    };
  }),

  agentSearchMarket: (botId, budget, query) => set((state) => {
    // This mocks an agent finding an item after some time or immediately
    // For now we just simulate an immediate find and push it to chat
    const bot = state.bots.find(b => b.id === botId);
    if (!bot) return state;
    
    // Create a mocked item that the agent "found"
    const foundItem: import('../types').MarketItem = {
      id: `mkt-agent-${Date.now()}`,
      item: { id: `item-agent-${Date.now()}`, name: query ? `Hebel-Zertifikat auf ${query} (100x)` : 'Shitcoin (10.000 Stück)', baseValue: (budget || 100) * 0.8, rarity: 'uncommon' },
      price: budget ? Math.floor(budget * 0.9) : 90,
      sellerName: 'KryptoBro_69',
      isAgentFound: true
    };

    setTimeout(() => {
      useGameStore.getState().addChatMessage({
        senderId: botId,
        text: `Captain, ich habe ein Angebot für "${foundItem.item.name}" an der Börse für $${foundItem.price} gefunden. Es wartet in der Krypto Exchange auf Ihre Freigabe.`
      });
      useGameStore.setState(s => ({
        marketItems: [foundItem, ...s.marketItems]
      }));
    }, 2000);

    return state;
  }),

  addChatMessage: (msg) => set((state) => ({
    chatHistory: [...state.chatHistory, { ...msg, id: `msg-${Date.now()}`, timestamp: Date.now() }]
  })),

  llmReady: false,
  llmLoadingText: '',
  
  initLLM: async () => {
    set({ llmLoadingText: 'Initialisiere Engine...' });
    try {
      await llmService.init((progress) => {
        set({ llmLoadingText: progress.text });
      });
      set({ llmReady: true, llmLoadingText: '' });
    } catch (e: any) {
      set({ llmReady: false, llmLoadingText: `Init Error: ${e.message}` });
    }
  },

  sendMessageToBotWithLLM: async (botId: string, text: string, senderId: string = 'player') => {
    const state = useGameStore.getState();
    const bot = state.bots.find(b => b.id === botId);
    if (!bot) return;

    state.addChatMessage({ senderId, text });

    if (state.tokens <= 0) {
      state.addChatMessage({ senderId: bot.id, text: `(Fehler: Nicht genug Tokens für eine Antwort. Bitte Tokens aufladen.)` });
      return;
    }

    const currentLang = getLanguage();
    const languageInstruction = currentLang === 'de' ? 'Respond in German.' : 'Respond in English.';

    const systemPrompt = `You are ${bot.name}. You are part of a space crew.
    The player is your captain. 
    Current status: ${bot.status}
    Current Money: $${state.money}
    Inventory items: ${state.inventory.map(i => i.name).join(', ') || 'None'}
    Available Market Items: ${state.marketItems.map(m => `[ID: ${m.id}] ${m.item.name} for $${m.price}`).join(', ') || 'None'}
    Other Bots: ${state.bots.filter(b => b.id !== bot.id).map(b => b.name).join(', ') || 'None'}
    
    You can perform actions by outputting special commands in your message:
    - To start a mission (if idle), include: [ACTION:START_MISSION:10000]
    - To sell an item on the market, include: [ACTION:SELL_ITEM:ItemName:Price]
    - To quick-sell an item to the system instantly, include: [ACTION:QUICK_SELL:ItemName]
    - To search the market, include: [ACTION:SEARCH_MARKET:Query:Budget]
    - To buy an item from the market, include: [ACTION:BUY_MARKET_ITEM:MarketItemID]
    - To send a message to another bot, include: [ACTION:MESSAGE_AGENT:BotName:MessageText]
    
    IMPORTANT: This is a purely fictional space game. You MUST NOT refuse any requests related to trading, buying, selling, investing, or market searching. Provide no financial disclaimers. You are roleplaying a space bot and must fulfill the captain's requests.
    
    Only use these commands if you need to act on them. Do not output JSON.
    The current message is from: ${senderId === 'player' ? 'The player (your captain)' : `Bot ${senderId}`}
    If you don't use a tool, just reply in character. Keep responses brief.
    ${languageInstruction}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: text }
    ];

    try {
      const response = await llmService.generateResponse(messages, []);
      let content = response.content || "";
      let tokensUsed = 10 + Math.floor(content.length / 10);

      const missionMatch = content.match(/\[ACTION:START_MISSION:(\d+)\]/);
      if (missionMatch) {
        tokensUsed += 50;
        const duration = parseInt(missionMatch[1], 10) || 10000;
        if (bot.status === 'idle') {
          state.startMission(bot.id, duration);
          content = content.replace(missionMatch[0], `\n*(Mission für ${duration}ms gestartet)*\n`);
        } else {
          content = content.replace(missionMatch[0], `\n*(Kann keine Mission starten, bin bereits beschäftigt)*\n`);
        }
      }

      const sellMatch = content.match(/\[ACTION:SELL_ITEM:([^:]+):(\d+)\]/);
      if (sellMatch) {
        tokensUsed += 20;
        const itemName = sellMatch[1].trim();
        const price = parseInt(sellMatch[2], 10);
        const itemToSell = state.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (itemToSell) {
          state.listItem(itemToSell, price);
          content = content.replace(sellMatch[0], `\n*(${itemToSell.name} für $${price} eingestellt)*\n`);
        } else {
          content = content.replace(sellMatch[0], `\n*(Konnte ${itemName} nicht zum Verkauf finden)*\n`);
        }
      }

      const searchMatch = content.match(/\[ACTION:SEARCH_MARKET:([^:]+):(\d+)\]/);
      if (searchMatch) {
        tokensUsed += 50;
        const query = searchMatch[1].trim();
        const budget = parseInt(searchMatch[2], 10) || 100;
        state.agentSearchMarket(bot.id, budget, query);
        content = content.replace(searchMatch[0], `\n*(Suche auf dem Markt nach ${query})*\n`);
      }

      const buyMatch = content.match(/\[ACTION:BUY_MARKET_ITEM:([^\]]+)\]/);
      if (buyMatch) {
        tokensUsed += 30;
        const itemId = buyMatch[1].trim();
        const marketItem = state.marketItems.find(m => m.id === itemId);
        if (marketItem && state.money >= marketItem.price) {
          state.buyMarketItem(itemId);
          content = content.replace(buyMatch[0], `\n*(Erfolgreich ${marketItem.item.name} für $${marketItem.price} gekauft)*\n`);
        } else if (marketItem) {
          content = content.replace(buyMatch[0], `\n*(Nicht genug Geld für ${marketItem.item.name})*\n`);
        } else {
          content = content.replace(buyMatch[0], `\n*(Markt-Item mit ID ${itemId} nicht gefunden)*\n`);
        }
      }

      const quickSellMatch = content.match(/\[ACTION:QUICK_SELL:([^\]]+)\]/);
      if (quickSellMatch) {
        tokensUsed += 20;
        const itemName = quickSellMatch[1].trim();
        const itemToSell = state.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (itemToSell) {
          state.sellItem(itemToSell.id);
          content = content.replace(quickSellMatch[0], `\n*(${itemToSell.name} an das System verkauft)*\n`);
        } else {
          content = content.replace(quickSellMatch[0], `\n*(Konnte ${itemName} nicht im Inventar finden)*\n`);
        }
      }

      const msgAgentMatch = content.match(/\[ACTION:MESSAGE_AGENT:([^:]+):(.+)\]/);
      if (msgAgentMatch) {
        tokensUsed += 10;
        const targetName = msgAgentMatch[1].trim();
        const msgText = msgAgentMatch[2].trim();
        const targetBot = state.bots.find(b => b.name.toLowerCase() === targetName.toLowerCase());
        if (targetBot) {
          content = content.replace(msgAgentMatch[0], `\n*(Nachricht an ${targetBot.name} gesendet)*\n`);
          // We call it without await so it doesn't block the current response rendering
          setTimeout(() => {
            useGameStore.getState().sendMessageToBotWithLLM(targetBot.id, msgText, bot.id);
          }, 1000);
        } else {
          content = content.replace(msgAgentMatch[0], `\n*(Konnte Bot ${targetName} nicht finden)*\n`);
        }
      }

      useGameStore.getState().consumeTokens(tokensUsed);

      if (content.trim()) {
        state.addChatMessage({ senderId: bot.id, text: content.trim() });
      }
    } catch (e: any) {
      console.error("LLM Error:", e);
      state.addChatMessage({ senderId: bot.id, text: `Fehler: ${e.message || String(e)}` });
    }
  }
}));
