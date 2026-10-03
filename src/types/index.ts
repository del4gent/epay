export type Item = {
  id: string;
  name: string;
  baseValue: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'illegal';
};

export type Listing = {
  id: string;
  item: Item;
  listedPrice: number;
  timeListed: number;
};

export type Bot = {
  id: string;
  name: string;
  level: number;
  status: 'idle' | 'on_mission';
  missionEndTime?: number;
};

export type Mission = {
  id: string;
  botId: string;
  endTime: number;
};
