export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Sheet {
  id: string;
  title: string;
  items: string[];
  is_default: boolean;
  creator_id: string | null;
  play_count: number;
  created_at: string;
}

export interface Game {
  id: string;
  room_code: string;
  host_id: string | null;
  sheet_id: string | null;
  status: 'lobby' | 'active' | 'finished';
  config: Json;
  sheet?: Sheet;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  auth_id: string | null;
  nickname: string;
  is_host: boolean;
  board_state: Json;
  board_layout: number[] | null;
  score: number;
  is_winner: boolean;
  created_at: string;
}
