import { create } from 'zustand';
import type { Item, Listing, Bot, Mission, ChatMessage } from '../types';
import sparkyAvatar from '../assets/sparky.jpg';
import novaAvatar from '../assets/nova.jpg';

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
}

const INITIAL_BOTS: Bot[] = [
  { id: 'bot-1', name: 'Sparky (Engineer)', avatar: sparkyAvatar, level: 1, status: 'idle' },
  { id: 'bot-2', name: 'Nova (Navigator)', avatar: novaAvatar, level: 1, status: 'idle' }
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 'msg-1', senderId: 'bot-1', text: "Captain. Core temperature is stable, but we need more scrap to upgrade the hyperdrive.", timestamp: Date.now() - 10000 }
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
  }))
}));
