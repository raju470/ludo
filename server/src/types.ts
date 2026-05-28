export type PlayerColor = "red" | "green" | "yellow" | "blue";
export type TokenState = "home" | "active" | "finished";
export type GamePhase = "waiting" | "playing" | "finished";

export interface Token {
  id: string;
  color: PlayerColor;
  index: number;
  state: TokenState;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  tokens: Token[];
  isBot: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  dice: number | null;
  diceRolled: boolean;
  phase: GamePhase;
  winner: PlayerColor | null;
  turnCount: number;
}
