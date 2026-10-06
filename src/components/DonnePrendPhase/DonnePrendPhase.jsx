import React, { useRef, useState } from "react";
import Card from "../Card/Card";
import "./DonnePrendPhase.css";

const DonnePrendPhase = ({
  players,
  remainingDeck,
  setDeck,
  playerCards,
  updateGorgees,
  onFinish,
}) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [phaseDonne, setPhaseDonne] = useState(true);
  const [mode, setMode] = useState("NORMAL");
  const hardcoreSoundRef = useRef(new Audio("/hardcore.wav"));

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
    setActionLock(false);
  };

  const drawCard = (isHardcore = false) => {
    if (actionLock && !isHardcore) return;
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
      setMessage("Personne n'a cette valeur. 🔥 MODE HARDCORE");
      setHardcoreMode(true);
      setPlayersWithCard([]);
      setCurrentGiverIndex(0);
    } else {
      setHardcoreMode(false);
      setPlayersWithCard(holders);
      setCurrentGiverIndex(0);
    }
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
    if (actionLock) return;
    if (mode !== "NORMAL") return;
    if (!phaseDonne) return;
    if (giverIndex === undefined) return;
    if (remainingToGive <= 0) return;

    setActionLock(true);

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
        setTimeout(() => setActionLock(false), 120);
      } else {
        setMessage("✅ Distribution terminée.");
        setTimeout(() => handleNextPhase(), 800);
      }
    } else {
      setMessage(
        `${players[giverIndex]} donne 1 gorgée à ${players[toPlayer]} — reste ${newRemaining}`,
      );
      setTimeout(() => setActionLock(false), 120);
    }
  };

  const handleDrinkGorgee = (playerIndex) => {
    if (actionLock) return;
    if (mode !== "NORMAL") return;
    if (phaseDonne) return;
    if (giverIndex === undefined) return;

    setActionLock(true);

    const amountToDrink = currentRound * giverCopies;

    updateGorgees({
      type: "DRINK",
      toPlayer: playerIndex,
      amount: amountToDrink,
    });

    setMessage(`${players[playerIndex]} a bu ${amountToDrink} gorgée(s).`);

    if (currentGiverIndex < playersWithCard.length - 1) {
      setCurrentGiverIndex((i) => i + 1);
      setTimeout(() => setActionLock(false), 120);
    } else {
      setTimeout(() => handleNextPhase(), 800);
    }
  };

  const handleCulSec = (playerIndex) => {
    if (actionLock) return;
    if (giverIndex === undefined) return;

    setActionLock(true);

    updateGorgees({
      type: "DRINK",
      toPlayer: playerIndex,
      amount: 10,
    });

    setMessage(`${players[playerIndex]} : CUL SEC 🥴`);

    if (currentGiverIndex < playersWithCard.length - 1) {
      setCurrentGiverIndex((i) => i + 1);
      setTimeout(() => setActionLock(false), 120);
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
      <div className="dp-screen">
        <div className="dp-screen__header">
          <h2>{phaseTitle}</h2>
          {message && <div className="message">{message}</div>}
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
              <div className="message">
                Tire une carte. Mode Hardcore si personne n&apos;a la valeur.
              </div>

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

            <div className="dp-screen__actions" />
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

            <div className="dp-screen__actions">
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
                ) : phaseDonne ? (
                  currentGiver && (
                    <div className="dp-block">
                      <div className="active-player">
                        🎯 {players[giverIndex]}
                        {giverCopies > 1 ? ` (x${giverCopies})` : ""}
                      </div>

                      <div className="counter">
                        🔥 Restantes : {remainingToGive}
                      </div>

                      <div className="actions">
                        {players.map(
                          (name, index) =>
                            index !== giverIndex && (
                              <button
                                key={index}
                                onClick={() => handleDistributeOne(index)}
                                disabled={remainingToGive <= 0 || actionLock}
                              >
                                Donner une gorgée à {name}
                                {pendingSplit[index]
                                  ? ` (déjà ${pendingSplit[index]})`
                                  : ""}
                              </button>
                            ),
                        )}
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
                        onClick={async () => {
                          if (actionLock) return;
                          setActionLock(true);

                          try {
                            const hardcoreSound = hardcoreSoundRef.current;
                            hardcoreSound.currentTime = 0;
                            hardcoreSound.volume = 0.8;
                            await hardcoreSound.play();
                          } catch (e) {
                            // ignore autoplay block etc.
                          }

                          drawCard(true);
                          setTimeout(() => setActionLock(false), 200);
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