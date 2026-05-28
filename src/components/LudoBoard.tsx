import React from "react";
import { motion } from "framer-motion";

export type PlayerColor = "red" | "green" | "yellow" | "blue";

export interface BoardToken {
  id: string;
  color: PlayerColor;
  gridX: number;
  gridY: number;
  selectable: boolean;
  onClick: () => void;
}

interface LudoBoardProps {
  tokens: BoardToken[];
  safeCells: number[];
  mainPath: Array<{ x: number; y: number }>;
}

const C = 24; // cell px — total board 360px
const S = C * 15;

const TOKEN_COLOR: Record<PlayerColor, string> = {
  red: "#dc2626",
  green: "#15803d",
  yellow: "#facc15",
  blue: "#1d4ed8",
};

const CORNER_BG: Record<PlayerColor, string> = {
  red: "#dc2626",
  green: "#15803d",
  yellow: "#fde047",
  blue: "#1d4ed8",
};

const LANE_COLOR: Record<PlayerColor, string> = {
  red: "#dc2626",
  green: "#15803d",
  yellow: "#fde047",
  blue: "#1d4ed8",
};

const LANE_CELLS: Record<PlayerColor, Array<[number, number]>> = {
  green:  [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  blue:   [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  red:    [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
};

const HOME_CIRCLES: Record<PlayerColor, Array<[number, number]>> = {
  red:    [[2,2],[4,2],[2,4],[4,4]],
  green:  [[11,2],[13,2],[11,4],[13,4]],
  yellow: [[11,11],[13,11],[11,13],[13,13]],
  blue:   [[2,11],[4,11],[2,13],[4,13]],
};

const ALL_COLORS: PlayerColor[] = ["red","green","yellow","blue"];

const ENTRY_SAFE_CELL_COLOR: Record<number, string> = {
  0: LANE_COLOR.red,
  13: LANE_COLOR.green,
  26: LANE_COLOR.yellow,
  39: LANE_COLOR.blue,
};

const ENTRY_SAFE_CELL_INDICES = new Set<number>([0, 13, 26, 39]);

const CORNER_BLOCKS: Array<{ color: PlayerColor; x: number; y: number }> = [
  { color: "red", x: 0, y: 0 },
  { color: "green", x: 9, y: 0 },
  { color: "yellow", x: 9, y: 9 },
  { color: "blue", x: 0, y: 9 },
];

const INNER_HOME_BLOCKS: Array<{ x: number; y: number }> = [
  { x: 0.55, y: 0.55 },
  { x: 9.55, y: 0.55 },
  { x: 9.55, y: 9.55 },
  { x: 0.55, y: 9.55 },
];

const LudoBoard: React.FC<LudoBoardProps> = ({ tokens, safeCells, mainPath }) => {
  return (
    <div style={{
      display: "inline-block",
      border: "3px solid #1e293b",
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "0 6px 24px rgba(0,0,0,0.28)",
      flexShrink: 0,
    }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <rect width={S} height={S} fill="#f8fafc" />

        {/* Corner home quadrants */}
        {CORNER_BLOCKS.map((corner) => (
          <rect
            key={`corner-${corner.color}`}
            x={C * corner.x}
            y={C * corner.y}
            width={C * 6}
            height={C * 6}
            fill={CORNER_BG[corner.color]}
          />
        ))}

        {/* Inner white area in each corner */}
        {INNER_HOME_BLOCKS.map((inner, idx) => (
          <rect
            key={`inner-${idx}`}
            x={C * inner.x}
            y={C * inner.y}
            width={C * 4.9}
            height={C * 4.9}
            rx={7}
            fill="white"
          />
        ))}

        {/* Home token circles (ring design) */}
        {ALL_COLORS.flatMap(color =>
          HOME_CIRCLES[color].map(([gx, gy], i) => (
            <g key={`hc-${color}-${i}`}>
              <circle cx={gx*C} cy={gy*C} r={C*0.42} fill={CORNER_BG[color]} />
              <circle cx={gx*C} cy={gy*C} r={C*0.33} fill="white" stroke={TOKEN_COLOR[color]} strokeWidth={1.5} />
            </g>
          ))
        )}

        {/* Lane cells (colored home-run toward center) */}
        {ALL_COLORS.flatMap(color =>
          LANE_CELLS[color].map(([gx, gy], i) => (
            <rect key={`ln-${color}-${i}`}
              x={gx*C} y={gy*C} width={C} height={C}
              fill={LANE_COLOR[color]} stroke="#9ca3af" strokeWidth={0.5} />
          ))
        )}

        {/* Main path cells */}
        {mainPath.map((cell, idx) => {
          const safe = safeCells.includes(idx);
          const safeFill = ENTRY_SAFE_CELL_COLOR[idx] ?? "#d6dee8";
          const safeStarFill = ENTRY_SAFE_CELL_COLOR[idx] && ENTRY_SAFE_CELL_COLOR[idx] !== LANE_COLOR.yellow
            ? "#ffffff"
            : "#78350f";
          return (
            <g key={`p-${idx}`}>
              <rect x={cell.x*C} y={cell.y*C} width={C} height={C}
                fill={safe ? safeFill : "#ffffff"} stroke="#e5e7eb" strokeWidth={0.5} />
              {safe && !ENTRY_SAFE_CELL_INDICES.has(idx) && (
                <text x={cell.x*C+C/2} y={cell.y*C+C/2+4}
                  fontSize={10} textAnchor="middle" fill={safeStarFill}>★</text>
              )}
            </g>
          );
        })}

        {/* Center finish block — full 3×3 cell area (9 cells), rotated correctly */}
        {/* Green — top triangle */}
        <polygon points={`${6*C},${6*C} ${9*C},${6*C} ${7.5*C},${7.5*C}`} fill={TOKEN_COLOR.green} />
        {/* Yellow — right triangle */}
        <polygon points={`${9*C},${6*C} ${9*C},${9*C} ${7.5*C},${7.5*C}`} fill={CORNER_BG.yellow} />
        {/* Blue — bottom triangle */}
        <polygon points={`${6*C},${9*C} ${9*C},${9*C} ${7.5*C},${7.5*C}`} fill={TOKEN_COLOR.blue} />
        {/* Red — left triangle */}
        <polygon points={`${6*C},${6*C} ${6*C},${9*C} ${7.5*C},${7.5*C}`} fill={TOKEN_COLOR.red} />
        {/* Center white finish circle + star */}
        <circle cx={7.5*C} cy={7.5*C} r={C*0.5} fill="white" opacity={0.88} />
        <text x={7.5*C} y={7.5*C+5} fontSize={13} textAnchor="middle" fill="#374151">★</text>

        {/* Tokens with 3D look */}
        {tokens.map(token => {
          const cx = token.gridX * C + C / 2;
          const cy = token.gridY * C + C / 2;
          const R = C * 0.36;
          return (
            <motion.g key={token.id}
              onClick={token.selectable ? token.onClick : undefined}
              style={{ cursor: token.selectable ? "pointer" : "default" }}
            >
              {token.selectable && (
                <motion.circle cx={cx} cy={cy}
                  fill={TOKEN_COLOR[token.color]} opacity={0.3}
                  animate={{ r: [R*1.15, R*1.6, R*1.15] }}
                  transition={{ repeat: Infinity, duration: 0.75, ease: "easeInOut" }}
                />
              )}
              <circle cx={cx+1} cy={cy+1.5} r={R} fill="rgba(0,0,0,0.15)" />
              <circle cx={cx} cy={cy} r={R} fill={TOKEN_COLOR[token.color]} stroke="white" strokeWidth={1.5} />
              <circle cx={cx-R*0.22} cy={cy-R*0.28} r={R*0.32} fill="white" opacity={0.42} />
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

export default LudoBoard;