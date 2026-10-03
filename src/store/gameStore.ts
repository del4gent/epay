import { create } from 'zustand';
import type { Item, Listing, Bot, Mission, ChatMessage } from '../types';
import { llmService } from '../services/llmService';
import sparkyAvatar from '../assets/sparky.jpg';
import novaAvatar from '../assets/nova.jpg';
import { t, getLanguage } from '../i18n';

interface GameState {
  money: number;
  inventory: Item[];
  listings: Listing[];
  bots: Bot[];
  missions: Mission[];
  chatHistory: ChatMessage[];
  
  // Actions
  addMoney: (amount: number) => void;
  startMission: (botId: string, duration: number) => void;
  completeMission: (missionId: string, reward: Item) => void;
  listItem: (item: Item, price: number) => void;
  sellListing: (listingId: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  
  // LLM State
  llmReady: boolean;
  llmLoadingText: string;
  initLLM: () => Promise<void>;
  sendMessageToBotWithLLM: (botId: string, text: string) => Promise<void>;
}

const INITIAL_BOTS: Bot[] = [
  { id: 'bot-1', name: t('sparky'), avatar: sparkyAvatar, level: 1, status: 'idle' },
  { id: 'bot-2', name: t('nova'), avatar: novaAvatar, level: 1, status: 'idle' }
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 'msg-1', senderId: 'bot-1', text: t('initialChat'), timestamp: Date.now() - 10000 }
];

export const useGameStore = create<GameState>((set) => ({
  money: 50,
  inventory: [],
  listings: [],
  bots: INITIAL_BOTS,
  missions: [],
  chatHistory: INITIAL_CHAT,

  addMoney: (amount) => set((state) => ({ money: state.money + amount })),

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
    return {
      money: state.money + listing.listedPrice,
      listings: state.listings.filter(l => l.id !== listingId)
    };
  }),

  addChatMessage: (msg) => set((state) => ({
    chatHistory: [...state.chatHistory, { ...msg, id: `msg-${Date.now()}`, timestamp: Date.now() }]
  })),

  llmReady: false,
  llmLoadingText: '',
  
  initLLM: async () => {
    set({ llmLoadingText: 'Initializing Engine...' });
    await llmService.init((progress) => {
      set({ llmLoadingText: progress.text });
    });
    set({ llmReady: true, llmLoadingText: '' });
  },

  sendMessageToBotWithLLM: async (botId: string, text: string) => {
    const state = useGameStore.getState();
    const bot = state.bots.find(b => b.id === botId);
    if (!bot) return;

    // Add player message
    state.addChatMessage({ senderId: 'player', text });

    const currentLang = getLanguage();
    const languageInstruction = currentLang === 'de' ? 'Respond in German.' : 'Respond in English.';

    const systemPrompt = `You are ${bot.name}. You are part of a space crew.
    The player is your captain. 
    Current status: ${bot.status}
    Current Money: $${state.money}
    Inventory items: ${state.inventory.map(i => i.name).join(', ') || 'None'}
    
    You can use tools to perform actions. Only use tools when explicitly asked or when it makes sense.
    If you don't use a tool, just reply in character. Keep responses brief.
    ${languageInstruction}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: text }
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "start_mission",
          description: "Start a mission to search for new items or scrap.",
          parameters: {
            type: "object",
            properties: {
              duration_ms: { type: "number", description: "Duration in milliseconds. Recommend 5000 to 15000." }
            },
            required: ["duration_ms"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "sell_item",
          description: "Sell an item from the inventory.",
          parameters: {
            type: "object",
            properties: {
              item_name: { type: "string", description: "The name of the item to sell." },
              price: { type: "number", description: "The price to sell it for." }
            },
            required: ["item_name", "price"]
          }
        }
      }
    ];

    try {
      const response = await llmService.generateResponse(messages, tools);

      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const toolCall of response.tool_calls) {
          if (toolCall.function.name === 'start_mission') {
            const args = JSON.parse(toolCall.function.arguments || "{}");
            const duration = args.duration_ms || 10000;
            if (bot.status === 'idle') {
              state.startMission(bot.id, duration);
              state.addChatMessage({ senderId: bot.id, text: `${t('toolMissionStarted')} ${duration}ms` });
            } else {
              state.addChatMessage({ senderId: bot.id, text: t('toolBusy') });
            }
          } else if (toolCall.function.name === 'sell_item') {
            const args = JSON.parse(toolCall.function.arguments || "{}");
            const itemName = args.item_name;
            const price = args.price;
            const itemToSell = state.inventory.find(i => i.name.toLowerCase() === itemName?.toLowerCase());
            if (itemToSell) {
              state.listItem(itemToSell, price);
              state.addChatMessage({ senderId: bot.id, text: `${t('toolListed')} ${itemToSell.name} ${t('toolFor')} $${price}.` });
            } else {
              state.addChatMessage({ senderId: bot.id, text: `${t('toolNotFound')} ${itemName} ${t('toolInCargo')}` });
            }
          }
        }
      }

      if (response.content) {
        state.addChatMessage({ senderId: bot.id, text: response.content });
      }
    } catch (e) {
      console.error(e);
      state.addChatMessage({ senderId: bot.id, text: t('errorLLM') });
    }
  }
}));
