export enum GameType {
  SLOTS = 'SLOTS',
  BLACKJACK = 'BLACKJACK',
  ROULETTE = 'ROULETTE',
  BACCARAT = 'BACCARAT',
  TEXAS_HOLDEM = 'TEXAS_HOLDEM'
}

export interface UserState {
  balance: number;
  username: string;
  isLoggedIn: boolean;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string; // "A", "2"-"10", "J", "Q", "K"
  numericValue: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface RouletteBet {
  type: 'number' | 'color' | 'parity';
  value: number | string; // number (0-36), 'red'/'black', 'even'/'odd'
  amount: number;
}

export type BaccaratBetType = 'PLAYER' | 'BANKER' | 'TIE' | 'WINNER_EVEN';

export interface BaccaratBet {
  type: BaccaratBetType;
  amount: number;
}