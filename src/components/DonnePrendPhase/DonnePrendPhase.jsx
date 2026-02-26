import React, { useState } from "react";
import Card from "../Card/Card";
import "./DonnePrendPhase.css";

const DonnePrendPhase = ({
  players,
  remainingDeck,
  setDeck,
  playerCards,
  updateGorgees, // applyGorgees({type, fromPlayer, toPlayer, amount})
  onFinish,
}) => {
  const [currentRound, setCurrentRound] = useState(1); // 1..4
  const [phaseDonne, setPhaseDonne] = useState(true); // Donne / Prends
  const [mode, setMode] = useState("NORMAL"); // "NORMAL" | "CULSEC" | "END"
  const [hardcoreSound] = useState(() => new Audio("/hardcore.wav"));
  const [currentCard, setCurrentCard] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [message, setMessage] = useState("");

  const [playersWithCard, setPlayersWithCard] = useState([]); // [{playerIndex, copies}]
  const [currentGiverIndex, setCurrentGiverIndex] = useState(0);

  const [hardcoreMode, setHardcoreMode] = useState(false);
  const [pendingSplit, setPendingSplit] = useState({});
  const [hasDrawnThisStep, setHasDrawnThisStep] = useState(false);

  // ✅ anti double "phase suivante"
  const [transitionLock, setTransitionLock] = useState(false);

  const currentGiver = playersWithCard[currentGiverIndex];
  const giverIndex = currentGiver?.playerIndex;
  const giverCopies = currentGiver?.copies || 0;

  const totalToGive =
    mode === "NORMAL" && phaseDonne ? currentRound * giverCopies : 0;

  const distributedSoFar = Object.values(pendingSplit).reduce(
    (a, b) => a + b,
    0,
  );
  const remainingToGive = totalToGive - distributedSoFar;

  const addToPendingSplit = (toPlayer) => {
    setPendingSplit((prev) => ({
      ...prev,
      [toPlayer]: (prev[toPlayer] || 0) + 1,
    }));
  };

  const computeHolders = (card) => {
    return players
      .map((_, index) => {
        const copies = (playerCards[index] || []).filter(
          (c) => c?.value === card?.value,
        ).length;
        return { playerIndex: index, copies };
      })
      .filter((x) => x.copies > 0);
  };

  const resetForNextStep = () => {
    setPendingSplit({});
    setCardRevealed(false);
    setHasDrawnThisStep(false);
    setPlayersWithCard([]);
    setHardcoreMode(false);
    setCurrentGiverIndex(0);
    setMessage("");
    setCurrentCard(null);
  };

  const drawCard = (isHardcore = false) => {
    if (hasDrawnThisStep && !isHardcore) return;

    if (!remainingDeck || remainingDeck.length === 0) {
      setMessage("Le deck est vide : fin de la phase.");
      return;
    }

    let newDeck = [...remainingDeck];
    let card;

    do {
      card = newDeck.pop();
    } while (
      isHardcore &&
      card?.value === currentCard?.value &&
      newDeck.length > 0
    );

    setCurrentCard(card);
    setDeck(newDeck);
    setCardRevealed(true);
    setHasDrawnThisStep(true);

    setPendingSplit({});
    setMessage("");

    const holders = computeHolders(card);

    if (holders.length === 0) {
      setMessage("Personne n'a cette valeur. 🔥 MODE HARDCORE ");
      setHardcoreMode(true);
      setPlayersWithCard([]);
      setCurrentGiverIndex(0);
    } else {
      setHardcoreMode(false);
      setPlayersWithCard(holders);
      setCurrentGiverIndex(0);
    }
  };

  // ✅ passage phase suivante : DONNE -> PRENDS -> (round++) -> CULSEC -> END
  const handleNextPhase = () => {
    if (transitionLock) return;
    setTransitionLock(true);

    resetForNextStep();

    // Si on était en CULSEC : fin directe
    if (mode === "CULSEC") {
      setMode("END");
      setTimeout(() => setTransitionLock(false), 0);
      return;
    }

    // NORMAL
    if (phaseDonne) {
      // DONNE -> PRENDS (même round)
      setPhaseDonne(false);
      setTimeout(() => setTransitionLock(false), 0);
      return;
    }

    // PRENDS terminé -> round suivant OU CULSEC
    if (currentRound === 4) {
      // ✅ après PRENDS 4 => CULSEC (avec tirage de carte)
      setMode("CULSEC");
      setPhaseDonne(true);
      setTimeout(() => setTransitionLock(false), 0);
      return;
    }

    setCurrentRound((prev) => prev + 1);
    setPhaseDonne(true);
    setTimeout(() => setTransitionLock(false), 0);
  };

  // DONNE : 1 clic = 1 gorgée
  const handleDistributeOne = (toPlayer) => {
    if (mode !== "NORMAL") return;
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

    if (newRemaining <= 0) {
      setPendingSplit({});

      if (currentGiverIndex < playersWithCard.length - 1) {
        setCurrentGiverIndex((i) => i + 1);
        setMessage("✅ Joueur suivant !");
      } else {
        setMessage("✅ Distribution terminée.");
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

  // CUL SEC : (match) => cul sec, sinon hardcore (géré via holders)
  const handleCulSec = (playerIndex) => {
    updateGorgees({
      type: "DRINK",
      toPlayer: playerIndex,
      amount: 10, // valeur interne (cul sec)
    });

    setMessage(`${players[playerIndex]} : CUL SEC 🥴`);

    if (currentGiverIndex < playersWithCard.length - 1) {
      setCurrentGiverIndex((i) => i + 1);
    } else {
      setTimeout(() => handleNextPhase(), 900);
    }
  };

  const phaseTitle = (() => {
    if (mode === "CULSEC") return "🥃 CUL SEC — tire une carte";
    if (mode === "END") return "🏁 Fin de beuverie";

    return phaseDonne
      ? `🍻 Donne ${currentRound} gorgée${currentRound > 1 ? "s" : ""}`
      : `🍺 Prends ${currentRound} gorgée${currentRound > 1 ? "s" : ""}`;
  })();

  return (
    <div className="donne-prend-phase">
      <h1>Donne / Prend</h1>
      <h2>{phaseTitle}</h2>

      {message && <div className="message">{message}</div>}

      {mode === "END" ? (
        <div className="panel actions">
          <div className="message">Fin de beuverie. Repos du foie.</div>
          <button onClick={() => onFinish?.("RESTART")}>🔁 Recommencer</button>
          <button onClick={() => onFinish?.("HOME")}>🏠 Retour accueil</button>
        </div>
      ) : !cardRevealed ? (
        <div className="panel">
          <div className="message">
            Tire une carte. Mode Hardcore si personne n&apos;a la valeur.
          </div>

          <button
            type="button"
            className="draw-card"
            onClick={() => drawCard()}
            disabled={hasDrawnThisStep}
            aria-label="Tirer une carte"
          >
            <img
              className="draw-card__img"
              src="/alex-croupier.png"
              alt=""
              draggable="false"
            />
          </button>
        </div>
      ) : (
        <div className="panel">
          {currentCard && (
            <div className="card-slot">
              <Card card={currentCard} />
            </div>
          )}

          {playersWithCard.length > 0 ? (
            mode === "CULSEC" ? (
              <div>
                {currentGiver && (
                  <>
                    <div className="active-player">
                      🥃 Candidat : {players[giverIndex]}
                    </div>
                    <div className="actions">
                      <button onClick={() => handleCulSec(giverIndex)}>
                        ✅ J&apos;ai cul-sec JPP
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : phaseDonne ? (
              <div>
                {currentGiver && (
                  <>
                    <div className="active-player">
                      🎯 {players[giverIndex]}
                    </div>
                    <br />
                    🔥 Restantes : {remainingToGive}
                    <div className="actions">
                      {players.map(
                        (name, index) =>
                          index !== giverIndex && (
                            <button
                              key={index}
                              onClick={() => handleDistributeOne(index)}
                              disabled={remainingToGive <= 0}
                            >
                              Donner une gorgée à {name}
                              {pendingSplit[index]
                                ? ` (déjà ${pendingSplit[index]})`
                                : ""}
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
                      ✅ J&apos;ai bu
                    </button>
                  </>
                )}
              </div>
            )
          ) : (
            hardcoreMode && (
              <div className="actions">
                <button
                  onClick={async () => {
                    try {
                      hardcoreSound.currentTime = 0;
                      hardcoreSound.volume = 0.8;
                      await hardcoreSound.play();
                    } catch (e) {
                      // ignore (autoplay block etc)
                    }

                    drawCard(true);
                  }}
                >
                  🔥 HARDCOOOOOOOOORE !
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default DonnePrendPhase;
