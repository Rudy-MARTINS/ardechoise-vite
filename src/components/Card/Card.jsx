import React from "react";
import "./card.css";

const getSymbolForSuit = (suit) => {
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
      return suit;
  }
};

const getCardValue = (value) => {
  switch (value) {
    case 11:
      return "Valet";
    case 12:
      return "Dame";
    case 13:
      return "Roi";
    case 14:
      return "As";
    default:
      return value;
  }
};

export default function Card({ card }) {
  if (!card) return null;

  const isRed = card.suit === "cœur" || card.suit === "carreau";
  const symbol = getSymbolForSuit(card.suit);
  const value = getCardValue(card.value);

  return (
    <div className={`playing-card ${isRed ? "red" : "black"}`}>
      <div className="pc-corner pc-top">
        <div>{value}</div>
        <div>{symbol}</div>
      </div>

      <div className="pc-center">{symbol}</div>

      <div className="pc-corner pc-bottom">
        <div>{value}</div>
        <div>{symbol}</div>
      </div>
    </div>
  );
}