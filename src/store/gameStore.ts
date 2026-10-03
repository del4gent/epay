import { create } from 'zustand';
import { Item, Listing, Bot, Mission } from '../types';

interface GameState {
  money: number;
  inventory: Item[];
  listings: Listing[];
  bots: Bot[];
  missions: Mission[];
  
  // Actions
  addMoney: (amount: number) => void;
  startMission: (botId: string, duration: number) => void;
  completeMission: (missionId: string, reward: Item) => void;
  listItem: (item: Item, price: number) => void;
  sellListing: (listingId: string) => void;
}

const INITIAL_BOTS: Bot[] = [
  { id: 'bot-1', name: 'Scrap-Collector', level: 1, status: 'idle' }
];

export const useGameStore = create<GameState>((set) => ({
  money: 50,
  inventory: [],
  listings: [],
  bots: INITIAL_BOTS,
  missions: [],

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
}));
