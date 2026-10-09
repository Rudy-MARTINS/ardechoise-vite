import { useEffect, useId, useRef, useState } from "react";
import MiniCard from "../Card/MiniCard";
import "./PlayerCards.css";

const cardLabel = (card) => {
  const faces = { 11: "Valet", 12: "Dame", 13: "Roi", 14: "As" };
  return `${faces[card.value] || card.value} de ${card.suit}`;
};

export default function PlayerCards({ players, playerCards }) {
  const dialogRef = useRef(null);
  const launcherRef = useRef(null);
  const previousOverflowRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    return () => {
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
      }
    };
  }, []);

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;

    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    setIsOpen(true);
  };

  const closeDialog = () => dialogRef.current?.close();

  const handleClose = () => {
    if (previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current;
      previousOverflowRef.current = null;
    }
    setIsOpen(false);
    launcherRef.current?.focus({ preventScroll: true });
  };

  const handleBackdropClick = (event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      closeDialog();
    }
  };

  return (
    <>
      <button
        ref={launcherRef}
        className="player-cards-launcher"
        type="button"
        aria-label="Cartes des joueurs"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={openDialog}
      >
        <span className="player-cards-launcher__symbol" aria-hidden="true">
          ♠ <span>♥</span>
        </span>
        <span>Cartes</span>
      </button>

      <dialog
        ref={dialogRef}
        className="player-cards-dialog"
        aria-labelledby={titleId}
        onClose={handleClose}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClick={handleBackdropClick}
      >
        <header className="player-cards-dialog__header">
          <h2 id={titleId}>Les cartes des joueurs</h2>
          <button
            className="player-cards-dialog__close"
            type="button"
            aria-label="Fermer les cartes des joueurs"
            autoFocus
            onClick={closeDialog}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <ul className="player-cards-dialog__players">
          {players.map((player, playerIndex) => {
            const cards = playerCards[playerIndex] || [];
            return (
              <li className="player-cards-dialog__player" key={playerIndex}>
                <h3>{player}</h3>
                {cards.length > 0 ? (
                  <ul className="player-cards-dialog__hand" aria-label={`Cartes de ${player}`}>
                    {cards.map((card, cardIndex) => (
                      <li key={`${card.value}-${card.suit}-${cardIndex}`}>
                        <span role="img" aria-label={cardLabel(card)}>
                          <span aria-hidden="true">
                            <MiniCard card={card} />
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="player-cards-dialog__empty">Aucune carte pour le moment</p>
                )}
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
