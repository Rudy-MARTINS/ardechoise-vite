import React, { useState } from "react";

// Symbole de couleur
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

// Valeur carte
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

const DonnePrendPhase = ({
  players,
  remainingDeck,
  setDeck,
  playerCards,
  updateGorgees, // attendu: applyGorgees({type, fromPlayer, toPlayer, amount})
  endDonnePrendPhase,
}) => {
  const [currentRound, setCurrentRound] = useState(1); // 1..4 (plus tard cul sec)
  const [phaseDonne, setPhaseDonne] = useState(true); // Donne / Prends
  const [currentCard, setCurrentCard] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [message, setMessage] = useState("");

  // Tableau d'objets { playerIndex, copies }
  const [playersWithCard, setPlayersWithCard] = useState([]);
  const [currentGiverIndex, setCurrentGiverIndex] = useState(0);

  const [hardcoreMode, setHardcoreMode] = useState(false);

  // Distribution clic par clic
  const [pendingSplit, setPendingSplit] = useState({}); // { playerIndex: count }
  const [showCoucou, setShowCoucou] = useState(false);

  // Verrou: 1 seule carte tirée par étape (sauf hardcore)
  const [hasDrawnThisStep, setHasDrawnThisStep] = useState(false);

  // Helpers distribution
  const currentGiver = playersWithCard[currentGiverIndex]; // { playerIndex, copies } | undefined
  const giverIndex = currentGiver?.playerIndex;
  const giverCopies = currentGiver?.copies || 0;

  const totalToGive = phaseDonne ? currentRound * giverCopies : 0;

  const distributedSoFar = Object.values(pendingSplit).reduce((a, b) => a + b, 0);
  const remainingToGive = totalToGive - distributedSoFar;

  const resetPendingSplit = () => setPendingSplit({});

  const addToPendingSplit = (toPlayer) => {
    setPendingSplit((prev) => ({
      ...prev,
      [toPlayer]: (prev[toPlayer] || 0) + 1,
    }));
  };

  // Tirer une carte
  const drawCard = (isHardcore = false) => {
    // Bloque les re-tirages involontaires
    if (hasDrawnThisStep && !isHardcore) return;

    if (!remainingDeck || remainingDeck.length === 0) {
      setMessage("Le deck est vide : fin de la phase Donne/Prend.");
      return;
    }

    let newDeck = [...remainingDeck];
    let card;

    do {
      card = newDeck.pop();
    } while (isHardcore && card?.value === currentCard?.value && newDeck.length > 0);

    setCurrentCard(card);
    setDeck(newDeck);
    setCardRevealed(true);
    setHasDrawnThisStep(true);

    resetPendingSplit();
    setMessage("");

    // Qui a la valeur + combien de doublons
    const holders = players
      .map((_, index) => {
        const copies = (playerCards[index] || []).filter((c) => c?.value === card?.value).length;
        return { playerIndex: index, copies };
      })
      .filter((x) => x.copies > 0);

    if (holders.length === 0) {
      setMessage("Personne n'a cette valeur. Mode HARDCORE : re-tirez !");
      setHardcoreMode(true);
      setPlayersWithCard([]);
      setCurrentGiverIndex(0);
    } else {
      setHardcoreMode(false);
      setPlayersWithCard(holders);
      setCurrentGiverIndex(0);
      setMessage("");
    }
  };

  // Passage phase suivante
  const handleNextPhase = () => {
    resetPendingSplit();
    setCardRevealed(false);
    setHasDrawnThisStep(false);
    setPlayersWithCard([]);
    setHardcoreMode(false);
    setCurrentGiverIndex(0);
    setMessage("");

    // Si on termine "Prends", on avance le round
    if (!phaseDonne) {
      const next = currentRound + 1;
      setCurrentRound(next);

      // TODO plus tard : cul sec / fin
      // if (next > 4) endDonnePrendPhase?.();
    }

    setPhaseDonne((prev) => !prev);
  };

  // DONNE : 1 clic = 1 gorgée
  const handleDistributeOne = (toPlayer) => {
    if (!phaseDonne) return;
    if (giverIndex === undefined) return;
    if (remainingToGive <= 0) return;

    addToPendingSplit(toPlayer);

    updateGorgees({
      type: "GIVE",
      fromPlayer: giverIndex,
      toPlayer,
      amount: 1,
    });

    const newRemaining = remainingToGive - 1;

    setMessage(
      `${players[giverIndex]} donne 1 gorgée à ${players[toPlayer]} — reste ${newRemaining}`,
    );

    // Fin cagnotte du giver
    if (newRemaining <= 0) {
      resetPendingSplit();

      if (currentGiverIndex < playersWithCard.length - 1) {
        setCurrentGiverIndex((i) => i + 1);
        setMessage("✅ Au joueur suivant !");
      } else {
        setMessage("✅ Distribution terminée.");

        // Coucou test fin DONNE 2
        if (currentRound === 2 && phaseDonne) {
          setShowCoucou(true);
          setTimeout(() => setShowCoucou(false), 1200);
        }

        setTimeout(() => handleNextPhase(), 800);
      }
    }
  };

  // PRENDS : boit currentRound
  const handleDrinkGorgee = (playerIndex) => {
    updateGorgees({
      type: "DRINK",
      toPlayer: playerIndex,
      amount: currentRound,
    });

    setMessage(`${players[playerIndex]} a bu ${currentRound} gorgée(s).`);

    if (currentGiverIndex < playersWithCard.length - 1) {
      setCurrentGiverIndex((i) => i + 1);
    } else {
      setTimeout(() => handleNextPhase(), 800);
    }
  };

  const phaseTitle = phaseDonne
    ? `DONNE — étape ${currentRound}`
    : `PRENDS — étape ${currentRound}`;

  const cardText =
    currentCard ? `${getCardValue(currentCard.value)} ${getSymbolForSuit(currentCard.suit)}` : "";

  return (
    <div className="donne-prend-phase">
      <h1>Donne / Prend</h1>

      <h2>{phaseTitle}</h2>

      {showCoucou && <div className="message">coucou ✅</div>}

      {!cardRevealed ? (
        <div className="panel">
          <div className="message">
            1 carte par étape. On tire, puis on résout (donne/prends), puis on continue.
          </div>

          <button onClick={() => drawCard()} disabled={hasDrawnThisStep}>
            🎴 Tirer une carte
          </button>
        </div>
      ) : (
        <div className="panel">
          <div className="card">{cardText}</div>

          {message && <div className="message">{message}</div>}

          {playersWithCard.length > 0 ? (
            phaseDonne ? (
              <div>
                {currentGiver && (
                  <>
                    <div className="active-player">
                      🎯 Donneur : {players[giverIndex]}
                    </div>

                    <div className="counter">
                      Doublons : {giverCopies} — Total à donner : {totalToGive}
                      <br />
                      🔥 Restantes : {remainingToGive}
                    </div>

                    <div className="actions">
                      {players.map(
                        (name, index) =>
                          index !== giverIndex && (
                            <button
                              key={index}
                              onClick={() => handleDistributeOne(index)}
                              disabled={remainingToGive <= 0}
                            >
                              Donner 1 à {name}
                              {pendingSplit[index] ? ` (déjà ${pendingSplit[index]})` : ""}
                            </button>
                          ),
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                {currentGiver && (
                  <>
                    <div className="active-player">
                      🍺 À boire : {players[giverIndex]}
                    </div>

                    <div className="counter">
                      Boit : {currentRound} gorgée(s)
                    </div>

                    <button onClick={() => handleDrinkGorgee(giverIndex)}>
                      ✅ J'ai bu
                    </button>
                  </>
                )}
              </div>
            )
          ) : (
            hardcoreMode && (
              <div className="actions">
                <button onClick={() => drawCard(true)}>🔥 HARDCORE — Re-tirer</button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default DonnePrendPhase;