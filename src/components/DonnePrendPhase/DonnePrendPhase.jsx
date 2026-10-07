import React, { useRef, useState } from "react";
import Card from "../Card/Card";
import DistributionGorgees from "../DistributionGorgees/DistributionGorgees";
import "./DonnePrendPhase.css";

const DonnePrendPhase = ({
  players,
  remainingDeck,
  setDeck,
  playerCards,
  updateGorgees,
  onDistributionChange,
  onFinish,
}) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [phaseDonne, setPhaseDonne] = useState(true);
  const [mode, setMode] = useState("NORMAL");
  const hardcoreSoundRef = useRef(null);

  const [currentCard, setCurrentCard] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [message, setMessage] = useState("");

  const [playersWithCard, setPlayersWithCard] = useState([]);
  const [currentGiverIndex, setCurrentGiverIndex] = useState(0);

  const [hardcoreMode, setHardcoreMode] = useState(false);
  const [pendingSplit, setPendingSplit] = useState({});
  const [hasDrawnThisStep, setHasDrawnThisStep] = useState(false);

  const [transitionLock, setTransitionLock] = useState(false);
  const [actionLock, setActionLock] = useState(false);
  const actionLockRef = useRef(false);

  const lockAction = () => {
    actionLockRef.current = true;
    setActionLock(true);
  };

  const unlockAction = () => {
    actionLockRef.current = false;
    setActionLock(false);
  };

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
    onDistributionChange?.(false);
    setPendingSplit({});
    setCardRevealed(false);
    setHasDrawnThisStep(false);
    setPlayersWithCard([]);
    setHardcoreMode(false);
    setCurrentGiverIndex(0);
    setMessage("");
    setCurrentCard(null);
    unlockAction();
  };

  const drawCard = (isHardcore = false) => {
    if (actionLockRef.current && !isHardcore) return;
    if (hasDrawnThisStep && !isHardcore) return;

    if (!remainingDeck || remainingDeck.length === 0) {
      setMessage("Le deck est vide : fin de la phase.");
      return;
    }

    if (!isHardcore) lockAction();

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
    onDistributionChange?.(
      mode === "NORMAL" && phaseDonne && holders.length > 0,
    );

    if (holders.length === 0) {
      setMessage("Personne n'a cette valeur. 🔥 MODE HARDCORE");
      setHardcoreMode(true);
      setPlayersWithCard([]);
      setCurrentGiverIndex(0);
    } else {
      setHardcoreMode(false);
      setPlayersWithCard(holders);
      setCurrentGiverIndex(0);
    }

    if (!isHardcore) setTimeout(unlockAction, 0);
  };

  const handleNextPhase = () => {
    if (transitionLock) return;
    setTransitionLock(true);

    resetForNextStep();

    if (mode === "CULSEC") {
      setMode("END");
      setTimeout(() => setTransitionLock(false), 0);
      return;
    }

    if (phaseDonne) {
      setPhaseDonne(false);
      setTimeout(() => setTransitionLock(false), 0);
      return;
    }

    if (currentRound === 4) {
      setMode("CULSEC");
      setPhaseDonne(true);
      setTimeout(() => setTransitionLock(false), 0);
      return;
    }

    setCurrentRound((prev) => prev + 1);
    setPhaseDonne(true);
    setTimeout(() => setTransitionLock(false), 0);
  };

  const handleDistributeOne = (toPlayer) => {
    if (actionLockRef.current) return;
    if (mode !== "NORMAL") return;
    if (!phaseDonne) return;
    if (giverIndex === undefined) return;
    if (remainingToGive <= 0) return;

    lockAction();

    addToPendingSplit(toPlayer);

    updateGorgees({
      type: "GIVE",
      fromPlayer: giverIndex,
      toPlayer,
      amount: 1,
    });

    const newRemaining = remainingToGive - 1;

    if (newRemaining <= 0) {
      setPendingSplit({});

      if (currentGiverIndex < playersWithCard.length - 1) {
        setCurrentGiverIndex((i) => i + 1);
        setMessage("✅ Joueur suivant !");
        setTimeout(unlockAction, 0);
      } else {
        onDistributionChange?.(false);
        setMessage("✅ Distribution terminée.");
        setTimeout(() => handleNextPhase(), 0);
      }
    } else {
      setMessage(
        `${players[giverIndex]} donne 1 gorgée à ${players[toPlayer]} — reste ${newRemaining}`,
      );
      setTimeout(unlockAction, 0);
    }
  };

  const handleDrinkGorgee = (playerIndex) => {
    if (actionLockRef.current) return;
    if (mode !== "NORMAL") return;
    if (phaseDonne) return;
    if (giverIndex === undefined) return;

    lockAction();

    const amountToDrink = currentRound * giverCopies;

    updateGorgees({
      type: "DRINK",
      toPlayer: playerIndex,
      amount: amountToDrink,
    });

    setMessage(`${players[playerIndex]} a bu ${amountToDrink} gorgée(s).`);

    if (currentGiverIndex < playersWithCard.length - 1) {
      setCurrentGiverIndex((i) => i + 1);
      setTimeout(unlockAction, 0);
    } else {
      setTimeout(() => handleNextPhase(), 0);
    }
  };

  const handleCulSec = (playerIndex) => {
    if (actionLockRef.current) return;
    if (giverIndex === undefined) return;

    lockAction();

    updateGorgees({
      type: "DRINK",
      toPlayer: playerIndex,
      amount: 10,
    });

    setMessage(`${players[playerIndex]} : CUL SEC 🥴`);

    if (currentGiverIndex < playersWithCard.length - 1) {
      setCurrentGiverIndex((i) => i + 1);
      setTimeout(unlockAction, 0);
    } else {
      setTimeout(() => handleNextPhase(), 0);
    }
  };

  const phaseTitle = (() => {
    if (mode === "CULSEC") return "🥃 CUL SEC — tire une carte";
    if (mode === "END") return "🏁 Fin de beuverie";

    return phaseDonne
      ? `🍻 Donne ${currentRound} gorgée${currentRound > 1 ? "s" : ""}`
      : `🍺 Prends ${currentRound} gorgée${currentRound > 1 ? "s" : ""}`;
  })();

  const feedback = (
    <>
      {message && <div className="message">{message}</div>}
      {mode !== "END" && !cardRevealed && (
        <div className="message">
          Tire une carte. Mode Hardcore si personne n&apos;a la valeur.
        </div>
      )}
    </>
  );

  if (mode === "NORMAL" && phaseDonne && cardRevealed && currentGiver) {
    return (
      <DistributionGorgees
        roundNumber={currentRound}
        message={message}
        card={currentCard}
        players={players}
        giverIndex={giverIndex}
        giverCopies={giverCopies}
        remaining={remainingToGive}
        pendingSplit={pendingSplit}
        actionLocked={actionLock}
        onDistribute={handleDistributeOne}
      />
    );
  }

  return (
    <div className="donne-prend-phase">
      <div className={`dp-screen${mode !== "END" ? " dp-screen--split" : ""}`}>
        <div className="dp-screen__header">
          <h2>{phaseTitle}</h2>
          <div className="dp-screen__feedback dp-screen__feedback--portrait">
            {feedback}
          </div>
        </div>

        {mode === "END" ? (
          <div className="dp-screen__body dp-screen__body--single">
            <div className="dp-screen__actions">
              <div className="message">Fin de beuverie. Repos du foie.</div>
              <div className="actions">
                <button onClick={() => onFinish?.("RESTART")}>
                  🔁 Recommencer
                </button>
                <button onClick={() => onFinish?.("HOME")}>
                  🏠 Retour accueil
                </button>
              </div>
            </div>
          </div>
        ) : !cardRevealed ? (
          <div className="dp-screen__body">
            <div className="dp-screen__media">
              <button
                type="button"
                className="draw-card"
                onClick={() => drawCard()}
                disabled={hasDrawnThisStep || actionLock}
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

            <div className="dp-screen__actions dp-screen__right-pane">
              <div className="dp-screen__feedback dp-screen__feedback--landscape">
                {feedback}
              </div>
            </div>
          </div>
        ) : (
          <div className="dp-screen__body">
            <div className="dp-screen__media">
              {currentCard && (
                <div className="card-slot">
                  <Card card={currentCard} />
                </div>
              )}
            </div>

            <div className="dp-screen__actions dp-screen__right-pane">
              <div className="dp-screen__feedback dp-screen__feedback--landscape">
                {feedback}
              </div>
              {playersWithCard.length > 0 ? (
                mode === "CULSEC" ? (
                  currentGiver && (
                    <div className="dp-block">
                      <div className="active-player">
                        🥃 Candidat : {players[giverIndex]}
                      </div>
                      <div className="actions">
                        <button
                          onClick={() => handleCulSec(giverIndex)}
                          disabled={actionLock}
                        >
                          ✅ J&apos;ai cul-sec JPP
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  currentGiver && (
                    <div className="dp-block">
                      <div className="active-player">
                        🍺 À boire : {players[giverIndex]}
                        {giverCopies > 1 ? ` (x${giverCopies})` : ""}
                      </div>

                      <div className="counter">
                        Boit : {currentRound * giverCopies} gorgée(s)
                      </div>

                      <div className="actions">
                        <button
                          onClick={() => handleDrinkGorgee(giverIndex)}
                          disabled={actionLock}
                        >
                          ✅ J&apos;ai bu
                        </button>
                      </div>
                    </div>
                  )
                )
              ) : (
                hardcoreMode && (
                  <div className="dp-block">
                    <div className="actions">
                      <button
                        disabled={actionLock}
                        onClick={() => {
                          if (actionLockRef.current) return;
                          lockAction();

                          drawCard(true);

                          try {
                            if (!hardcoreSoundRef.current) {
                              hardcoreSoundRef.current = new Audio("/hardcore.wav");
                            }
                            const hardcoreSound = hardcoreSoundRef.current;
                            hardcoreSound.currentTime = 0;
                            hardcoreSound.volume = 0.8;
                            hardcoreSound.play().catch(() => {});
                          } catch {
                            // ignore autoplay block etc.
                          }

                          setTimeout(unlockAction, 0);
                        }}
                      >
                        🔥 HARDCOOOOOOOOORE !
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonnePrendPhase;
