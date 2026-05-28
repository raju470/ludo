import { PlayerColor, Token, Player, GameState } from "./types";

const PLAYER_COLORS: PlayerColor[] = ["red", "green", "yellow", "blue"];

const START_SQUARES: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

function createTokens(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((i) => ({
    id: `${color}-${i}`,
    color,
    index: -1,
    state: "home" as const,
  }));
}

export function createPlayer(
  id: string,
  name: string,
  color: PlayerColor,
  isBot = false
): Player {
  return { id, name, color, tokens: createTokens(color), isBot };
}

export function createGameState(roomId: string): GameState {
  return {
    roomId,
    players: [],
    currentPlayerIndex: 0,
    dice: null,
    diceRolled: false,
    phase: "waiting",
    winner: null,
    turnCount: 0,
  };
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function pathToGlobal(pathIndex: number, color: PlayerColor): number {
  if (pathIndex < 0 || pathIndex >= 52) return -1;
  return (pathIndex + START_SQUARES[color]) % 52;
}

function canMoveToken(token: Token, dice: number): boolean {
  if (token.state === "finished") return false;
  if (token.state === "home") return dice === 6;
  return token.index + dice <= 56;
}

export function getMovableTokens(player: Player, dice: number): Token[] {
  return player.tokens.filter((t) => canMoveToken(t, dice));
}

function moveToken(token: Token, dice: number): Token {
  if (token.state === "home" && dice === 6) {
    return { ...token, state: "active", index: 0 };
  }
  const newIndex = token.index + dice;
  if (newIndex >= 56) return { ...token, index: 56, state: "finished" };
  return { ...token, index: newIndex };
}

function checkCapture(movedToken: Token, allPlayers: Player[]) {
  if (movedToken.state !== "active" || movedToken.index < 0)
    return { captured: false, victimTokenId: null };
  const globalPos = pathToGlobal(movedToken.index, movedToken.color);
  if (globalPos === -1 || SAFE_SQUARES.has(globalPos))
    return { captured: false, victimTokenId: null };

  for (const player of allPlayers) {
    if (player.color === movedToken.color) continue;
    for (const token of player.tokens) {
      if (token.state !== "active") continue;
      if (pathToGlobal(token.index, token.color) === globalPos)
        return { captured: true, victimTokenId: token.id };
    }
  }
  return { captured: false, victimTokenId: null };
}

export function isPlayerFinished(player: Player): boolean {
  return player.tokens.every((t) => t.state === "finished");
}

export function applyMove(
  players: Player[],
  actingColor: PlayerColor,
  tokenId: string,
  dice: number
): { players: Player[]; extraTurn: boolean; capturedTokenId: string | null } {
  let extraTurn = dice === 6;
  let capturedTokenId: string | null = null;

  const updated = players.map((p) => {
    if (p.color !== actingColor) return p;
    return {
      ...p,
      tokens: p.tokens.map((t) =>
        t.id === tokenId ? moveToken(t, dice) : t
      ),
    };
  });

  const movedPlayer = updated.find((p) => p.color === actingColor)!;
  const movedToken = movedPlayer.tokens.find((t) => t.id === tokenId)!;
  const capture = checkCapture(movedToken, updated);

  if (capture.captured && capture.victimTokenId) {
    capturedTokenId = capture.victimTokenId;
    extraTurn = true;
    const final = updated.map((p) => ({
      ...p,
      tokens: p.tokens.map((t) =>
        t.id === capture.victimTokenId
          ? { ...t, index: -1, state: "home" as const }
          : t
      ),
    }));
    return { players: final, extraTurn, capturedTokenId };
  }

  return { players: updated, extraTurn, capturedTokenId };
}

export function getNextPlayerIndex(
  players: Player[],
  currentIndex: number
): number {
  let next = (currentIndex + 1) % players.length;
  let tries = 0;
  while (isPlayerFinished(players[next]) && tries < players.length) {
    next = (next + 1) % players.length;
    tries++;
  }
  return next;
}

export function assignColors(count: number): PlayerColor[] {
  return PLAYER_COLORS.slice(0, count);
}
