import React from "react";
import "./card.css";

const suitSymbol = (suit) => {
  switch (suit) {
    case "pique":
      return "♠";
    case "trèfle":
      return "♣";
    case "cœur":
      return "♥";
    case "carreau":
      return "♦";
    default:
      return "?";
  }
};

const shortValue = (v) => {
  if (v === 11) return "V";
  if (v === 12) return "D";
  if (v === 13) return "R";
  if (v === 14) return "A";
  return String(v);
};

export default function MiniCard({ card }) {
  if (!card) return null;

  const symbol = suitSymbol(card.suit);
  const value = shortValue(card.value);
  const isRed = card.suit === "cœur" || card.suit === "carreau";

  return (
    <div className={`mini-card ${isRed ? "red" : "black"}`}>
      <div className="mini-corner">
        <span className="mini-value">{value}</span>
        <span className="mini-suit">{symbol}</span>
      </div>

      <div className="mini-center">{symbol}</div>

      <div className="mini-corner bottom">
        <span className="mini-value">{value}</span>
        <span className="mini-suit">{symbol}</span>
      </div>
    </div>
  );
}