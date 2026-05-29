
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import LudoBoard, { PlayerColor } from "../components/LudoBoard";

type Token = {
  id: string;
  color: PlayerColor;
  progress: number; // -1 = home, 0..50 main path, 51..56 home lane, 57 = finish
};

type Player = {
  color: PlayerColor;
  name: string;
  tokens: Token[];
};

const COLORS: PlayerColor[] = ["red", "green", "yellow", "blue"];
const INITIAL_DICE_FACES: Record<PlayerColor, number> = {
  red: 1,
  green: 1,
  yellow: 1,
  blue: 1,
};

const PLAYER_NAMES: Record<PlayerColor, string> = {
  red: "Red",
  green: "Green",
  yellow: "Yellow",
  blue: "Blue",
};

const TURN_DICE_THEME: Record<PlayerColor, { border: string; pip: string; bgFrom: string; bgTo: string }> = {
  red: { border: "#b91c1c", pip: "#7f1d1d", bgFrom: "#fee2e2", bgTo: "#fecaca" },
  green: { border: "#166534", pip: "#14532d", bgFrom: "#dcfce7", bgTo: "#bbf7d0" },
  yellow: { border: "#a16207", pip: "#854d0e", bgFrom: "#fef08a", bgTo: "#fde047" },
  blue: { border: "#1d4ed8", pip: "#1e3a8a", bgFrom: "#dbeafe", bgTo: "#bfdbfe" },
};

const DICE_LAYOUT: Array<{ color: PlayerColor; xFactor: number; yFactor: number; lane: "top" | "bottom"; side: "left" | "right" }> = [
  { color: "red",    xFactor: 0.2, yFactor: 0.25, lane: "top",    side: "left"  },
  { color: "green",  xFactor: 0.8, yFactor: 0.25, lane: "top",    side: "right" },
  { color: "yellow", xFactor: 0.8, yFactor: 0.75, lane: "bottom", side: "right" },
  { color: "blue",   xFactor: 0.2, yFactor: 0.75, lane: "bottom", side: "left"  },
];

const START_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

const FINAL_PROGRESS = 56;

const SAFE_GLOBAL = [0, 8, 13, 21, 26, 34, 39, 47];

// Standard clockwise 52-cell main path.
// Index 0 = Red entry (1,6) | 13 = Green entry (8,1) | 26 = Yellow entry (13,8) | 39 = Blue entry (6,13)
const MAIN_PATH: Array<{ x: number; y: number }> = [
  // 0-4: right along row 6 (Red start at 0)
  { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 },
  // 5-10: up along col 6
  { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
  // 11-12: right along row 0
  { x: 7, y: 0 }, { x: 8, y: 0 },
  // 13-17: down along col 8 (Green start at 13)
  { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
  // 18-22: right along row 6 (right section)
  { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 },
  // 23-25: right edge
  { x: 14, y: 6 }, { x: 14, y: 7 }, { x: 14, y: 8 },
  // 26-30: left along row 8 (Yellow start at 26)
  { x: 13, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 8 },
  // 31-35: down along col 8 (lower)
  { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }, { x: 8, y: 13 },
  // 36-38: left along row 14
  { x: 8, y: 14 }, { x: 7, y: 14 }, { x: 6, y: 14 },
  // 39-43: up along col 6 (lower, Blue start at 39)
  { x: 6, y: 13 }, { x: 6, y: 12 }, { x: 6, y: 11 }, { x: 6, y: 10 }, { x: 6, y: 9 },
  // 44-48: left along row 8 (left section)
  { x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 },
  // 49-51: left edge going up
  { x: 0, y: 8 }, { x: 0, y: 7 }, { x: 0, y: 6 },
];

const HOME_ROWS: Record<PlayerColor, Array<{ x: number; y: number }>> = {
  green: [
    { x: 7, y: 1 },
    { x: 7, y: 2 },
    { x: 7, y: 3 },
    { x: 7, y: 4 },
    { x: 7, y: 5 },
    { x: 7, y: 6 },
  ],
  yellow: [
    { x: 13, y: 7 },
    { x: 12, y: 7 },
    { x: 11, y: 7 },
    { x: 10, y: 7 },
    { x: 9, y: 7 },
    { x: 8, y: 7 },
  ],
  blue: [
    { x: 7, y: 13 },
    { x: 7, y: 12 },
    { x: 7, y: 11 },
    { x: 7, y: 10 },
    { x: 7, y: 9 },
    { x: 7, y: 8 },
  ],
  red: [
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 5, y: 7 },
    { x: 6, y: 7 },
  ],
};

const HOME_SLOTS: Record<PlayerColor, Array<{ x: number; y: number }>> = {
  red:    [{ x:1.5,y:1.5 },{ x:3.5,y:1.5 },{ x:1.5,y:3.5 },{ x:3.5,y:3.5 }],
  green:  [{ x:10.5,y:1.5 },{ x:12.5,y:1.5 },{ x:10.5,y:3.5 },{ x:12.5,y:3.5 }],
  yellow: [{ x:10.5,y:10.5 },{ x:12.5,y:10.5 },{ x:10.5,y:12.5 },{ x:12.5,y:12.5 }],
  blue:   [{ x:1.5,y:10.5 },{ x:3.5,y:10.5 },{ x:1.5,y:12.5 },{ x:3.5,y:12.5 }],
};

// Offsets applied when multiple tokens share the same cell
const CELL_OFFSETS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: -0.2, dy: -0.2 },
  { dx:  0.2, dy: -0.2 },
  { dx: -0.2, dy:  0.2 },
  { dx:  0.2, dy:  0.2 },
];

function getTokenCell(token: Token, slotIndex: number): { x: number; y: number } {
  if (token.progress === -1)  return HOME_SLOTS[token.color][slotIndex];
  if (token.progress <= 50)   return MAIN_PATH[toGlobalIndex(token.color, token.progress)];
  if (token.progress <= 56)   return HOME_ROWS[token.color][token.progress - 51];
  return { x: 7.5, y: 7.5 }; // finished — centre of board
}

function createInitialPlayers(): Player[] {
  return COLORS.map((color) => ({
    color,
    name: PLAYER_NAMES[color],
    tokens: [0, 1, 2, 3].map((i) => ({ id: `${color}-${i}`, color, progress: -1 })),
  }));
}

function toGlobalIndex(color: PlayerColor, progress: number): number {
  return (START_INDEX[color] + progress) % 52;
}

function isMovable(token: Token, dice: number): boolean {
  if (token.progress === FINAL_PROGRESS) return false;
  if (token.progress === -1) return dice === 6;
  const remainingToFinish = FINAL_PROGRESS - token.progress;
  return dice <= remainingToFinish;
}

function nextTurn(current: number, finished: Set<PlayerColor>): number {
  let idx = current;
  let guard = 0;
  do {
    idx = (idx + 1) % COLORS.length;
    guard += 1;
  } while (finished.has(COLORS[idx]) && guard <= COLORS.length + 1);
  return idx;
}

// ── DiceFace static constants ────────────────────────────────────
const IDLE_SHADOW = "0 4px 10px rgba(15,23,42,0.32), inset 0 1px 2px rgba(255,255,255,0.8)";
const ROLLING_ANIMATE = { rotate: [0, 18, -15, 10, -6, 0], scale: [1, 1.06, 0.96, 1], y: [0, -3, 0] };
const ROLLING_TRANSITION = { duration: 0.55, repeat: Infinity } as const;
const HIGHLIGHT_TRANSITION = { duration: 1.2, repeat: Infinity, repeatType: "loop", ease: [0.42, 0, 0.58, 1] };
const IDLE_TRANSITION = { duration: 0.18 };
const GLOSS_STYLE = {
  position: "absolute" as const,
  inset: 2,
  borderRadius: 6,
  background: "linear-gradient(to bottom, rgba(255,255,255,0.75), transparent)",
  pointerEvents: "none" as const,
};

const PIP_POSITIONS: Record<number, Array<{ x: number; y: number }>> = {
  1: [{ x: 50, y: 50 }],
  2: [
    { x: 28, y: 28 },
    { x: 72, y: 72 },
  ],
  3: [
    { x: 28, y: 28 },
    { x: 50, y: 50 },
    { x: 72, y: 72 },
  ],
  4: [
    { x: 28, y: 28 },
    { x: 72, y: 28 },
    { x: 28, y: 72 },
    { x: 72, y: 72 },
  ],
  5: [
    { x: 28, y: 28 },
    { x: 72, y: 28 },
    { x: 50, y: 50 },
    { x: 28, y: 72 },
    { x: 72, y: 72 },
  ],
  6: [
    { x: 28, y: 24 },
    { x: 72, y: 24 },
    { x: 28, y: 50 },
    { x: 72, y: 50 },
    { x: 28, y: 76 },
    { x: 72, y: 76 },
  ],
};

interface DiceFaceProps {
  value: number;
  rolling: boolean;
  color: PlayerColor;
  onClick: () => void;
  disabled: boolean;
  highlight?: boolean;
}

const DiceFace = React.memo(function DiceFace({ value, rolling, color, onClick, disabled, highlight }: DiceFaceProps) {
  const theme = TURN_DICE_THEME[color];
  const isHighlit = !!(highlight && !disabled);
  const diceKey = `${color}-${rolling ? "r" : isHighlit ? "h" : "i"}`;

  const animate = rolling
    ? ROLLING_ANIMATE
    : isHighlit
      ? {
          rotate: 0, y: 0,
          scale: [1, 1.07, 1],
          boxShadow: [
            `0 0 0 0px ${theme.border}33`,
            `0 0 12px 8px ${theme.border}18`,
            `0 0 0 0px ${theme.border}00`,
          ],
        }
      : { rotate: 0, scale: 1, y: 0, boxShadow: IDLE_SHADOW };

  const transition = rolling ? ROLLING_TRANSITION : isHighlit ? HIGHLIGHT_TRANSITION : IDLE_TRANSITION;

  return (
    <motion.button
      key={diceKey}
      type="button"
      onClick={onClick}
      disabled={disabled}
      animate={animate}
      transition={transition}
      style={{
        position: "relative",
        width: 44,
        height: 44,
        borderRadius: 8,
        border: `2px solid ${theme.border}`,
        background: `linear-gradient(135deg,${theme.bgFrom} 0%,${theme.bgTo} 100%)`,
        boxShadow: IDLE_SHADOW,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.75 : 1,
        outlineOffset: isHighlit ? "2px" : undefined,
      }}
    >
      <div style={GLOSS_STYLE} />
      <svg viewBox="0 0 100 100" width={34} height={34} style={{ position: "relative" }}>
        {PIP_POSITIONS[value].map((pip, idx) => (
          <circle key={`${value}-${idx}`} cx={pip.x} cy={pip.y} r={7} fill={theme.pip} />
        ))}
      </svg>
    </motion.button>
  );
});

const GamePage: React.FC = () => {
  const [viewport, setViewport] = useState({ width: 1200, height: 800 });
  const [players, setPlayers] = useState<Player[]>(createInitialPlayers);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [diceDisplay, setDiceDisplay] = useState(1);
  const [diceFaceByColor, setDiceFaceByColor] = useState<Record<PlayerColor, number>>(INITIAL_DICE_FACES);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState("Roll the dice to start the match.");
  const [finishedOrder, setFinishedOrder] = useState<PlayerColor[]>([]);
  const [sixStreak, setSixStreak] = useState(0);
  const [turnHold, setTurnHold] = useState(false);
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const turnPassTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentColor = COLORS[currentTurnIdx];
  const finishedSet = useMemo(() => new Set(finishedOrder), [finishedOrder]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (turnPassTimeoutRef.current) {
        clearTimeout(turnPassTimeoutRef.current);
      }
    };
  }, []);

  const movableTokenIds = useMemo(() => {
    if (diceValue === null) return new Set<string>();
    const currentPlayer = players.find((p) => p.color === currentColor);
    if (!currentPlayer) return new Set<string>();
    return new Set(currentPlayer.tokens.filter((t) => isMovable(t, diceValue)).map((t) => t.id));
  }, [players, currentColor, diceValue]);

  const boardTokens = useMemo(() => {
    const byCell = new Map<string, string[]>();

    const raw = players.flatMap((player) =>
      player.tokens.map((token, slotIndex) => {
        const pos = getTokenCell(token, slotIndex);
        const key = `${Math.round(pos.x * 10)}-${Math.round(pos.y * 10)}`;
        const bucket = byCell.get(key) ?? [];
        bucket.push(token.id);
        byCell.set(key, bucket);
        return {
          id: token.id,
          color: token.color,
          baseX: pos.x,
          baseY: pos.y,
          selectable: token.color === currentColor && movableTokenIds.has(token.id),
        };
      })
    );

    return raw.map((t) => {
      const key = `${Math.round(t.baseX * 10)}-${Math.round(t.baseY * 10)}`;
      const inCell = byCell.get(key) ?? [t.id];
      const cellIdx = inCell.indexOf(t.id);
      const off = inCell.length > 1 ? (CELL_OFFSETS[cellIdx] ?? { dx: 0, dy: 0 }) : { dx: 0, dy: 0 };
      return {
        id: t.id,
        color: t.color,
        gridX: t.baseX + off.dx,
        gridY: t.baseY + off.dy,
        selectable: t.selectable,
      };
    });
  }, [players, currentColor, movableTokenIds]);

  const passTurn = (reason: string) => {
    const next = nextTurn(currentTurnIdx, finishedSet);
    setCurrentTurnIdx(next);
    setDiceValue(null);
    setSixStreak(0);
    setTurnHold(false);
    setMessage(reason);
  };

  const rollDice = () => {
    if (rolling || diceValue !== null || finishedSet.has(currentColor)) return;

    setRolling(true);
    let ticks = 0;
    // 0.5s total: 500ms / 50ms = 10 ticks
    const maxTicks = 10;
    const intervalMs = 30;
    const timer = setInterval(() => {
      setDiceDisplay(Math.floor(Math.random() * 6) + 1);
      ticks += 1;
      if (ticks > maxTicks) {
        clearInterval(timer);
        // After two consecutive sixes, third roll is forced to be non-six.
        const rolled = sixStreak >= 2
          ? Math.floor(Math.random() * 5) + 1
          : Math.floor(Math.random() * 6) + 1;
        setDiceDisplay(rolled);
        setDiceFaceByColor((prev) => ({ ...prev, [currentColor]: rolled }));
        setDiceValue(rolled);
        setRolling(false);

        const currentPlayer = players.find((p) => p.color === currentColor);
        const movableTokens = currentPlayer?.tokens.filter((t) => isMovable(t, rolled)) ?? [];
        const allTokensInHome = currentPlayer?.tokens.every((t) => t.progress === -1) ?? false;
        const canMove = movableTokens.length > 0;
        const newSixStreak = rolled === 6 ? sixStreak + 1 : 0;

        setSixStreak(newSixStreak);

        if (!canMove) {
          setTurnHold(true);
          setMessage(`${PLAYER_NAMES[currentColor]} has no valid move. Passing turn...`);
          turnPassTimeoutRef.current = setTimeout(() => {
            passTurn(`${PLAYER_NAMES[currentColor]} has no valid move. Turn passed.`);
          }, 1000);
          return;
        }

        if (rolled === 6 && allTokensInHome) {
          const tokenToOpen = movableTokens[0];
          if (tokenToOpen) {
            setMessage(`${PLAYER_NAMES[currentColor]} rolled 6. Auto-opening a token.`);
            moveToken(tokenToOpen.id, rolled);
            return;
          }
        }

        if (movableTokens.length === 1) {
          const onlyToken = movableTokens[0];
          setMessage(`${PLAYER_NAMES[currentColor]} rolled ${rolled}. Auto-moving token.`);
          moveToken(onlyToken.id, rolled);
          return;
        }

        setMessage(`${PLAYER_NAMES[currentColor]} rolled ${rolled}. Select a token.`);
      }
    }, intervalMs);
  };

  const moveToken = (tokenId: string, forcedDice?: number) => {
    const activeDice = forcedDice ?? diceValue;
    if (activeDice === null) return;

    const currentPlayer = players.find((p) => p.color === currentColor);
    const target = currentPlayer?.tokens.find((t) => t.id === tokenId);
    if (!target || !isMovable(target, activeDice)) return;

    // Exact roll is required to enter final home.
    if (target.progress >= 0) {
      const remainingToFinish = FINAL_PROGRESS - target.progress;
      if (activeDice > remainingToFinish) {
        setMessage(`${PLAYER_NAMES[currentColor]} needs exact ${remainingToFinish} to finish this token.`);
        return;
      }
    }

    const moved = target.progress === -1 ? 0 : target.progress + activeDice;
    const reachedHome = moved === FINAL_PROGRESS;
    let captured = false;

    const updatedPlayers = players.map((p) => {
      if (p.color === currentColor) {
        return {
          ...p,
          tokens: p.tokens.map((t) => (t.id === tokenId ? { ...t, progress: moved } : t)),
        };
      }

      // Capture on non-safe main path cells
      if (moved <= 50) {
        const movedGlobal = toGlobalIndex(currentColor, moved);
        if (!SAFE_GLOBAL.includes(movedGlobal)) {
          const hasCapture = p.tokens.some(
            (t) => t.progress >= 0 && t.progress <= 50 && toGlobalIndex(p.color, t.progress) === movedGlobal
          );
          if (hasCapture) captured = true;
          return {
            ...p,
            tokens: p.tokens.map((t) => {
              if (t.progress < 0 || t.progress > 50) return t;
              return toGlobalIndex(p.color, t.progress) === movedGlobal ? { ...t, progress: -1 } : t;
            }),
          };
        }
      }

      return p;
    });

    const newlyFinished = updatedPlayers
      .filter((p) => p.tokens.every((t) => t.progress === FINAL_PROGRESS))
      .map((p) => p.color)
      .filter((c) => !finishedSet.has(c));

    const nextFinishedOrder = newlyFinished.length > 0 ? [...finishedOrder, ...newlyFinished] : finishedOrder;
    const nextFinishedSet = new Set(nextFinishedOrder);

    const getsExtraTurn = activeDice === 6 || captured || reachedHome;
    const nextIdx = getsExtraTurn ? currentTurnIdx : nextTurn(currentTurnIdx, nextFinishedSet);

    setPlayers(updatedPlayers);
    setFinishedOrder(nextFinishedOrder);
    setCurrentTurnIdx(nextIdx);
    setDiceValue(null);

    if (newlyFinished.length > 0) {
      setMessage(`${PLAYER_NAMES[newlyFinished[0]]} finished all tokens!`);
    } else if (captured) {
      setMessage(`${PLAYER_NAMES[currentColor]} captured a token and gets another turn.`);
    } else if (reachedHome) {
      setMessage(`${PLAYER_NAMES[currentColor]} reached home and gets another turn.`);
    } else if (activeDice === 6) {
      setMessage(`${PLAYER_NAMES[currentColor]} rolled 6 and gets another turn.`);
    } else {
      setMessage(`Turn: ${PLAYER_NAMES[COLORS[nextIdx]]}`);
    }
  };

  const resetGame = () => {
    if (turnPassTimeoutRef.current) {
      clearTimeout(turnPassTimeoutRef.current);
      turnPassTimeoutRef.current = null;
    }

    setPlayers(createInitialPlayers());
    setCurrentTurnIdx(0);
    setDiceValue(null);
    setDiceDisplay(1);
    setDiceFaceByColor(INITIAL_DICE_FACES);
    setRolling(false);
    setMessage("Roll the dice to start the match.");
    setFinishedOrder([]);
    setSixStreak(0);
    setTurnHold(false);
  };

  const handleNewGame = () => {
    const hasStarted = players.some((p) => p.tokens.some((t) => t.progress !== -1));
    const isGameOver = finishedOrder.length > 0;

    if (hasStarted && !isGameOver) {
      setShowRestartPrompt(true);
      return;
    }

    resetGame();
  };

  const confirmRestart = () => {
    setShowRestartPrompt(false);
    resetGame();
  };

  const winner = finishedOrder[0] ?? null;
  const canRollNow = !rolling && diceValue === null && !winner && !turnHold;
  // Use the smaller dimension so phones in landscape still count as "mobile"
  const isMobile = Math.min(viewport.width, viewport.height) < 640;
  const isTablet = !isMobile && Math.min(viewport.width, viewport.height) < 1024;
  const isLandscape = isMobile && viewport.width > viewport.height;
  // LudoBoard renders a 360px SVG plus 3px border on each side => 366px true outer size.
  const boardBase = 366;
  const diceSize = 44;
  const diceGap = 6;
  // In landscape the dice live in left/right lanes; in portrait they sit above/below.
  const sideDiceLane = diceSize + diceGap * 2; // horizontal space for one side lane
  const hPad = isLandscape ? sideDiceLane : (isMobile ? 2 : isTablet ? 18 : 28);
  const vPadTop = isLandscape ? 4 : (isMobile ? 42 : 62);
  const vPadBottom = isLandscape ? 4 : Math.max(vPadTop, diceSize + diceGap);
  const safeSideGutter = isMobile ? 2 : 18;
  const availableWidth = Math.max(300, viewport.width - safeSideGutter);
  const availableHeight = Math.max(
    isLandscape ? 180 : 300,
    viewport.height - (isLandscape ? 40 : isMobile ? 72 : 170),
  );
  const scaleByWidth = (availableWidth - hPad * 2) / boardBase;
  const scaleByHeight = (availableHeight - vPadTop - vPadBottom) / boardBase;
  const boardScale = Math.min(1, Math.max(0.58, Math.min(scaleByWidth, scaleByHeight)));
  const boardVisual = boardBase * boardScale;
  const boardLeft = hPad;
  const boardTop = vPadTop;
  const boardBottom = boardTop + boardVisual;
  const boardRight = boardLeft + boardVisual;
  // Portrait: dice above / below board
  const topDiceY = Math.max(2, boardTop - diceSize - diceGap);
  const bottomDiceY = boardBottom + diceGap;
  // Landscape: dice centred in left / right lane
  const leftDiceX = Math.round(hPad / 2);
  const rightDiceX = boardRight + Math.round(hPad / 2);

  // ── Style constants ──────────────────────────────────────────────
  const st = {
    page: {
      position: "fixed" as const,
      inset: 0,
      overflow: "hidden",
      background: "linear-gradient(to bottom right,#fff7ed,#ffedd5,#fdba74)",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: `max(${isMobile ? 4 : 8}px, env(safe-area-inset-top))`,
      paddingBottom: `max(${isMobile ? 4 : 8}px, env(safe-area-inset-bottom))`,
      paddingLeft: `max(${isMobile ? 2 : 4}px, env(safe-area-inset-left))`,
      paddingRight: `max(${isMobile ? 2 : 4}px, env(safe-area-inset-right))`,
      boxSizing: "border-box" as const,
    },
    column: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: isMobile ? 4 : 12,
      width: "100%",
      maxWidth: 760,
      overflow: "hidden" as const,
    },
    header: {
      width: "100%",
      maxWidth: isMobile ? 392 : 500,
      background: "rgba(255,255,255,0.9)",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: isMobile ? "4px 6px" : "6px 10px",
      boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexShrink: 0,
      boxSizing: "border-box" as const,
    },
    titleText: { fontSize: isMobile ? 12 : 16, fontWeight: 900, letterSpacing: "-0.3px", lineHeight: 1.05 } as const,
    subtitleText: { fontSize: isMobile ? 8 : 10, color: "#64748b", lineHeight: 1.15 } as const,
    newGameBtn: {
      border: "1px solid #cbd5e1", borderRadius: 8,
      padding: isMobile ? "3px 7px" : "5px 9px",
      fontSize: isMobile ? 9 : 11, fontWeight: 800,
      color: "#1e293b", background: "#ffffff",
      cursor: "pointer", whiteSpace: "nowrap" as const,
    },
    stage: {
      position: "relative" as const,
      width: boardVisual + hPad * 2,
      height: boardVisual + vPadTop + vPadBottom,
      flexShrink: 0,
    },
    boardWrapper: {
      position: "absolute" as const,
      left: boardLeft, top: boardTop,
      transform: `scale(${boardScale})`,
      transformOrigin: "top left",
      lineHeight: 0,
    },
    overlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(15,23,42,0.32)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      zIndex: 20,
    },
    modal: {
      width: "100%", maxWidth: 340,
      background: "#ffffff", borderRadius: 14,
      border: "1px solid #e2e8f0",
      boxShadow: "0 16px 38px rgba(15,23,42,0.24)",
      padding: 14,
    },
    modalTitle: { fontSize: 15, fontWeight: 900, color: "#0f172a" } as const,
    modalBody: { fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.4 } as const,
    modalActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 } as const,
    btnCancel: {
      border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px",
      fontSize: 12, fontWeight: 700, color: "#334155", background: "#ffffff", cursor: "pointer",
    },
    btnDanger: {
      border: "1px solid #b91c1c", borderRadius: 8, padding: "6px 10px",
      fontSize: 12, fontWeight: 700, color: "#ffffff", background: "#dc2626", cursor: "pointer",
    },
  };

  return (
    <div style={st.page}>
      <div style={st.column}>
        <div style={st.header}>
          <div>
            <div style={st.titleText}>Local Ludo</div>
            <div style={st.subtitleText}>4 players · same device</div>
          </div>
          <button type="button" onClick={handleNewGame} style={st.newGameBtn}>
            New Game
          </button>
        </div>

        <div style={st.stage}>
          {DICE_LAYOUT.map((dice) => {
            const isActiveDice = currentColor === dice.color;
            return (
              <div
                key={dice.color}
                style={isLandscape ? {
                  position: "absolute",
                  left: dice.side === "left" ? leftDiceX : rightDiceX,
                  top: boardTop + boardVisual * dice.yFactor,
                  transform: "translate(-50%, -50%)",
                } : {
                  position: "absolute",
                  left: boardLeft + boardVisual * dice.xFactor,
                  top: dice.lane === "top" ? topDiceY : bottomDiceY,
                  transform: "translateX(-50%)",
                }}
              >
                <DiceFace
                  value={isActiveDice && rolling ? diceDisplay : diceFaceByColor[dice.color]}
                  rolling={isActiveDice && rolling}
                  color={dice.color}
                  onClick={rollDice}
                  disabled={!isActiveDice || !canRollNow}
                  highlight={isActiveDice && canRollNow}
                />
              </div>
            );
          })}

          <div style={st.boardWrapper}>
            <LudoBoard
              tokens={boardTokens.map((token) => ({
                ...token,
                onClick: () => moveToken(token.id),
              }))}
              safeCells={SAFE_GLOBAL}
              mainPath={MAIN_PATH}
            />
          </div>
        </div>
      </div>

      {showRestartPrompt ? (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={st.modalTitle}>Restart current game?</div>
            <div style={st.modalBody}>
              This match is still in progress. You can finish this game or restart now.
            </div>
            <div style={st.modalActions}>
              <button type="button" onClick={() => setShowRestartPrompt(false)} style={st.btnCancel}>
                Continue
              </button>
              <button type="button" onClick={confirmRestart} style={st.btnDanger}>
                Restart
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GamePage;