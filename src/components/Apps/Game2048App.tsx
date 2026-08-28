/**
 * ARGUS Cyber 2048 Game
 * Fully functional neon puzzle game with smooth keyboard controls and score tracking
 */

import React, { useState, useEffect, useCallback } from "react";
import styles from "./Game2048App.module.css";
import { playNotificationSound } from "../../lib/soundEffects";

type Board = number[][];

const TILE_COLORS: Record<number, { bg: string; color: string; glow: string }> = {
  2: { bg: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", glow: "0 0 10px rgba(56, 189, 248, 0.3)" },
  4: { bg: "rgba(6, 182, 212, 0.3)", color: "#22d3ee", glow: "0 0 12px rgba(6, 182, 212, 0.4)" },
  8: { bg: "rgba(16, 185, 129, 0.35)", color: "#34d399", glow: "0 0 14px rgba(16, 185, 129, 0.4)" },
  16: { bg: "rgba(245, 158, 11, 0.4)", color: "#fbbf24", glow: "0 0 16px rgba(245, 158, 11, 0.5)" },
  32: { bg: "rgba(249, 115, 22, 0.45)", color: "#fb923c", glow: "0 0 18px rgba(249, 115, 22, 0.5)" },
  64: { bg: "rgba(239, 68, 68, 0.5)", color: "#f87171", glow: "0 0 20px rgba(239, 68, 68, 0.6)" },
  128: { bg: "rgba(236, 72, 153, 0.55)", color: "#f472b6", glow: "0 0 22px rgba(236, 72, 153, 0.6)" },
  256: { bg: "rgba(168, 85, 247, 0.6)", color: "#c084fc", glow: "0 0 25px rgba(168, 85, 247, 0.7)" },
  512: { bg: "rgba(99, 102, 241, 0.65)", color: "#818cf8", glow: "0 0 28px rgba(99, 102, 241, 0.8)" },
  1024: { bg: "rgba(59, 130, 246, 0.7)", color: "#60a5fa", glow: "0 0 32px rgba(59, 130, 246, 0.9)" },
  2048: { bg: "linear-gradient(135deg, #06b6d4, #ec4899)", color: "#fff", glow: "0 0 40px rgba(6, 182, 212, 1)" },
};

function getEmptyBoard(): Board {
  return Array(4).fill(0).map(() => Array(4).fill(0));
}

function spawnTile(board: Board): Board {
  const emptyCoords: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) emptyCoords.push([r, c]);
    }
  }
  if (emptyCoords.length === 0) return board;

  const [randR, randC] = emptyCoords[Math.floor(Math.random() * emptyCoords.length)];
  const newBoard = board.map((row) => [...row]);
  newBoard[randR][randC] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

export const Game2048App: React.FC = () => {
  const [board, setBoard] = useState<Board>(() => spawnTile(spawnTile(getEmptyBoard())));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("argus:2048-best") || "0", 10);
    } catch {
      return 0;
    }
  });

  const resetGame = () => {
    playNotificationSound();
    setScore(0);
    setBoard(spawnTile(spawnTile(getEmptyBoard())));
  };

  const slideRow = (row: number[]): { newRow: number[]; gained: number } => {
    let filtered = row.filter((v) => v !== 0);
    let gained = 0;

    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        gained += filtered[i];
        filtered[i + 1] = 0;
      }
    }

    filtered = filtered.filter((v) => v !== 0);
    while (filtered.length < 4) {
      filtered.push(0);
    }
    return { newRow: filtered, gained };
  };

  const moveLeft = useCallback(() => {
    let totalGained = 0;
    let changed = false;
    const newBoard = board.map((row) => {
      const { newRow, gained } = slideRow(row);
      totalGained += gained;
      if (JSON.stringify(row) !== JSON.stringify(newRow)) changed = true;
      return newRow;
    });

    if (changed) {
      const spawned = spawnTile(newBoard);
      setBoard(spawned);
      setScore((prev) => {
        const next = prev + totalGained;
        if (next > bestScore) {
          setBestScore(next);
          localStorage.setItem("argus:2048-best", next.toString());
        }
        return next;
      });
    }
  }, [board, bestScore]);

  const moveRight = useCallback(() => {
    let totalGained = 0;
    let changed = false;
    const newBoard = board.map((row) => {
      const reversed = [...row].reverse();
      const { newRow, gained } = slideRow(reversed);
      totalGained += gained;
      const res = newRow.reverse();
      if (JSON.stringify(row) !== JSON.stringify(res)) changed = true;
      return res;
    });

    if (changed) {
      const spawned = spawnTile(newBoard);
      setBoard(spawned);
      setScore((prev) => {
        const next = prev + totalGained;
        if (next > bestScore) {
          setBestScore(next);
          localStorage.setItem("argus:2048-best", next.toString());
        }
        return next;
      });
    }
  }, [board, bestScore]);

  const rotateClockwise = (b: Board): Board => {
    const res = getEmptyBoard();
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        res[c][3 - r] = b[r][c];
      }
    }
    return res;
  };

  const moveUp = useCallback(() => {
    let rotated = rotateClockwise(rotateClockwise(rotateClockwise(board)));
    let totalGained = 0;
    let changed = false;
    rotated = rotated.map((row) => {
      const { newRow, gained } = slideRow(row);
      totalGained += gained;
      if (JSON.stringify(row) !== JSON.stringify(newRow)) changed = true;
      return newRow;
    });
    const finalBoard = rotateClockwise(rotated);

    if (changed) {
      const spawned = spawnTile(finalBoard);
      setBoard(spawned);
      setScore((prev) => {
        const next = prev + totalGained;
        if (next > bestScore) {
          setBestScore(next);
          localStorage.setItem("argus:2048-best", next.toString());
        }
        return next;
      });
    }
  }, [board, bestScore]);

  const moveDown = useCallback(() => {
    let rotated = rotateClockwise(board);
    let totalGained = 0;
    let changed = false;
    rotated = rotated.map((row) => {
      const { newRow, gained } = slideRow(row);
      totalGained += gained;
      if (JSON.stringify(row) !== JSON.stringify(newRow)) changed = true;
      return newRow;
    });
    const finalBoard = rotateClockwise(rotateClockwise(rotateClockwise(rotated)));

    if (changed) {
      const spawned = spawnTile(finalBoard);
      setBoard(spawned);
      setScore((prev) => {
        const next = prev + totalGained;
        if (next > bestScore) {
          setBestScore(next);
          localStorage.setItem("argus:2048-best", next.toString());
        }
        return next;
      });
    }
  }, [board, bestScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) {
        e.preventDefault();
        moveLeft();
      } else if (["ArrowRight", "d", "D"].includes(e.key)) {
        e.preventDefault();
        moveRight();
      } else if (["ArrowUp", "w", "W"].includes(e.key)) {
        e.preventDefault();
        moveUp();
      } else if (["ArrowDown", "s", "S"].includes(e.key)) {
        e.preventDefault();
        moveDown();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight, moveUp, moveDown]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>2048</div>
        <div className={styles.scoreContainer}>
          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>Score</div>
            <div className={styles.scoreVal}>{score}</div>
          </div>
          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>Best</div>
            <div className={styles.scoreVal}>{bestScore}</div>
          </div>
        </div>
      </div>

      <div className={styles.board}>
        {board.map((row, r) =>
          row.map((val, c) => {
            const styleInfo = TILE_COLORS[val] || { bg: "rgba(255,255,255,0.04)", color: "#fff", glow: "none" };
            return (
              <div
                key={`${r}-${c}`}
                className={styles.cell}
                style={{
                  background: val > 0 ? styleInfo.bg : undefined,
                  color: styleInfo.color,
                  boxShadow: val > 0 ? styleInfo.glow : undefined,
                }}
              >
                {val > 0 ? val : ""}
              </div>
            );
          })
        )}
      </div>

      <div className={styles.controls}>
        <span className={styles.instructions}>Use Arrow Keys or WASD to join tiles!</span>
        <button className={styles.btnReset} onClick={resetGame}>
          New Game
        </button>
      </div>
    </div>
  );
};
