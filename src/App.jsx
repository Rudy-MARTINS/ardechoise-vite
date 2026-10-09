import React, { useState, useEffect, useRef } from "react";
import "./app.css";
import Card from "./components/Card/Card";
import BoutonFaute from "./components/BoutonFaute/BoutonFaute";
import MiniCard from "./components/Card/MiniCard";
import DonnePrendPhase from "./components/DonnePrendPhase/DonnePrendPhase";
import DistributionGorgees from "./components/DistributionGorgees/DistributionGorgees";
import FinalRecap from "./components/FinalRecap/FinalRecap";
import PlayerCards from "./components/PlayerCards/PlayerCards";
import { createEmptyPlayerCards, createNewGame } from "./game/gameState";

function App() {
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(Array(2).fill(""));
  const [startGame, setStartGame] = useState(false);
  const startSoundRef = useRef(new Audio("/pop champ.wav"));

  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  const [message, setMessage] = useState("");
  const [currentCard, setCurrentCard] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);

  const [playerCards, setPlayerCards] = useState(createEmptyPlayerCards(2));

  const [gorgeesDistribuees, setGorgeesDistribuees] = useState(
    Array(2).fill(0),
  );
  const [gorgeesRecues, setGorgeesRecues] = useState(Array(2).fill(0));
  const [fautesDeJeu, setFautesDeJeu] = useState(Array(2).fill(0));
  const [culSecs, setCulSecs] = useState(Array(2).fill(0));

  const [showDistribution, setShowDistribution] = useState(false);
  const [gorgeesToDistribute, setGorgeesToDistribute] = useState(0);
  const [splitGorgees, setSplitGorgees] = useState([]);

  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [showIntermediatePage, setShowIntermediatePage] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showFinalRecap, setShowFinalRecap] = useState(false);
  const [endReason, setEndReason] = useState("");

  const [showDonnePrendPhase, setShowDonnePrendPhase] = useState(false);
  const [isDonnePrendDistributing, setIsDonnePrendDistributing] = useState(false);
  const [deck, setDeck] = useState([]);

  const [showFaultMenu, setShowFaultMenu] = useState(false);
  const [faultToast, setFaultToast] = useState("");
  const faultMenuRef = useRef(null);

  const [actionLocked, setActionLocked] = useState(false);
  const actionLockRef = useRef(false);
  const actionTimeoutRef = useRef(null);

  const isDistributing = showDistribution || isDonnePrendDistributing;
  const isRecapVisible = showFinalRecap || (showRecap && !showDonnePrendPhase);
  const showFaultControls = !isDistributing && !isRecapVisible;
  const roundSipLabel = `${roundNumber} gorgée${roundNumber > 1 ? "s" : ""}`;
  const isFirstPhasePlaying =
    !showIntermediatePage && !showRecap && !showDonnePrendPhase && !showFinalRecap;
  const cardsForViewer = playerCards.map((cards, index) => {
    const includeRevealedCard =
      isFirstPhasePlaying && cardRevealed && currentCard && index === currentPlayer &&
      !cards.some((card) => card.value === currentCard.value && card.suit === currentCard.suit);

    return includeRevealedCard ? [...cards, currentCard] : cards;
  });

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

  useEffect(() => () => clearTimeout(actionTimeoutRef.current), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        faultMenuRef.current &&
        !faultMenuRef.current.contains(event.target)
      ) {
        setShowFaultMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!faultToast) return;

    const timeout = setTimeout(() => {
      setFaultToast("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [faultToast]);

  const releaseActionLock = (delay = 450) => {
    clearTimeout(actionTimeoutRef.current);
    actionTimeoutRef.current = setTimeout(() => {
      actionLockRef.current = false;
      setActionLocked(false);
    }, delay);
  };

  const withActionLock = (callback, delay = 450) => {
    if (actionLockRef.current) return;

    actionLockRef.current = true;
    setActionLocked(true);

    try {
      callback();
    } finally {
      releaseActionLock(delay);
    }
  };

  const drawCard = () => {
    if (deck.length === 0) return null;
    const newDeck = [...deck];
    const card = newDeck.pop();
    setDeck(newDeck);
    return card;
  };

  const handleNumPlayersChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setNumPlayers(value);
    setPlayerNames(Array(value).fill(""));
    setPlayerCards(createEmptyPlayerCards(value));
    setGorgeesDistribuees(Array(value).fill(0));
    setGorgeesRecues(Array(value).fill(0));
    setFautesDeJeu(Array(value).fill(0));
    setCulSecs(Array(value).fill(0));
  };

  const handlePlayerNameChange = (e, index) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = e.target.value;
    setPlayerNames(newPlayerNames);
  };

  const startNewGame = () => {
    const next = createNewGame(playerNames);
    clearTimeout(actionTimeoutRef.current);
    actionLockRef.current = false;

    setStartGame(next.startGame);
    setCurrentPlayer(next.currentPlayer);
    setRoundNumber(next.roundNumber);
    setMessage(next.message);
    setCurrentCard(next.currentCard);
    setCardRevealed(next.cardRevealed);
    setDeck(next.deck);
    setPlayerCards(next.playerCards);
    setGorgeesDistribuees(next.gorgeesDistribuees);
    setGorgeesRecues(next.gorgeesRecues);
    setFautesDeJeu(next.fautesDeJeu);
    setCulSecs(next.culSecs);
    setShowDistribution(next.showDistribution);
    setGorgeesToDistribute(next.gorgeesToDistribute);
    setSplitGorgees(next.splitGorgees);
    setWaitingForConfirmation(next.waitingForConfirmation);
    setShowIntermediatePage(next.showIntermediatePage);
    setShowRecap(next.showRecap);
    setShowFinalRecap(next.showFinalRecap);
    setEndReason(next.endReason);
    setShowDonnePrendPhase(next.showDonnePrendPhase);
    setIsDonnePrendDistributing(next.isDonnePrendDistributing);
    setShowFaultMenu(next.showFaultMenu);
    setFaultToast(next.faultToast);
    setActionLocked(next.actionLocked);
  };

  const handleStartGame = () => {
    if (!playerNames.every((name) => name.trim() !== "")) {
      alert("Veuillez remplir tous les noms des joueurs.");
      return;
    }

    startNewGame();

    try {
      const startSound = startSoundRef.current;
      startSound.currentTime = 0;
      startSound.volume = 0.6;
      startSound.play().catch(() => {});
    } catch {
      // ignore
    }
  };

  const toggleFault = () => {
    setShowFaultMenu((prev) => !prev);
  };

  const handlePlayerGuess = (guess) => {
    withActionLock(() => {
      setCardRevealed(true);

      switch (roundNumber) {
        case 1:
          handleColorGuess(guess);
          break;
        case 2:
          handleComparisonGuess(guess);
          break;
        case 3:
          handleInsideOutsideGuess(guess);
          break;
        case 4:
          handleSuitGuess(guess);
          break;
        default:
          break;
      }
    });
  };

  const handleColorGuess = (guess) => {
    const isRed = currentCard.suit === "cœur" || currentCard.suit === "carreau";

    if ((guess === "rouge" && isRed) || (guess === "noir" && !isRed)) {
      setMessage(
        `${playerNames[currentPlayer]}, bien joué tu peux distribuer ${roundSipLabel}.`,
      );
      setGorgeesToDistribute(roundNumber);
      setSplitGorgees([]);
      setShowFaultMenu(false);
      setShowDistribution(true);
      return;
    }

    setMessage(
      `Ah ah ah, bien joué ${playerNames[currentPlayer]}... c'était pas ça. TU BOIS ${roundSipLabel} !`,
    );
    const next = [...gorgeesRecues];
    next[currentPlayer] += roundNumber;
    setGorgeesRecues(next);
    setWaitingForConfirmation(true);
  };

  const handleComparisonGuess = (guess) => {
    const previousCard = playerCards[currentPlayer][0];
    const comparison = currentCard.value - previousCard.value;

    const ok =
      (guess === "supérieure" && comparison > 0) ||
      (guess === "inférieure" && comparison < 0) ||
      (guess === "égale" && comparison === 0);

    if (ok) {
      setMessage(
        `${playerNames[currentPlayer]}, bien joué tu peux distribuer ${roundSipLabel}.`,
      );
      setGorgeesToDistribute(roundNumber);
      setSplitGorgees([]);
      setShowFaultMenu(false);
      setShowDistribution(true);
      return;
    }

    setMessage(
      `Ah ah ah, bien joué ${playerNames[currentPlayer]}... c'était pas ça. TU BOIS ${roundSipLabel} !`,
    );
    const next = [...gorgeesRecues];
    next[currentPlayer] += roundNumber;
    setGorgeesRecues(next);
    setWaitingForConfirmation(true);
  };

  const handleInsideOutsideGuess = (guess) => {
    const cards = playerCards[currentPlayer];
    const values = cards.map((c) => c.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const isEqual =
      currentCard.value === minValue || currentCard.value === maxValue;
    const isInside =
      currentCard.value > minValue && currentCard.value < maxValue;
    const isOutside =
      currentCard.value < minValue || currentCard.value > maxValue;

    const ok =
      (guess === "intérieur" && isInside) ||
      (guess === "extérieur" && isOutside) ||
      (guess === "égale" && isEqual);

    if (ok) {
      setMessage(
        `${playerNames[currentPlayer]}, bien joué tu peux distribuer ${roundSipLabel}.`,
      );
      setGorgeesToDistribute(roundNumber);
      setSplitGorgees([]);
      setShowFaultMenu(false);
      setShowDistribution(true);
      return;
    }

    setMessage(
      `Ah ah ah, bien joué ${playerNames[currentPlayer]}... c'était pas ça. TU BOIS ${roundSipLabel} !`,
    );
    const next = [...gorgeesRecues];
    next[currentPlayer] += roundNumber;
    setGorgeesRecues(next);
    setWaitingForConfirmation(true);
  };

  const handleSuitGuess = (guess) => {
    const ok = guess === currentCard.suit;

    if (ok) {
      setMessage(
        `${playerNames[currentPlayer]}, CHAAAAAMMMPIIOOOOOOON tu peux distribuer ${roundSipLabel}.`,
      );
      setGorgeesToDistribute(roundNumber);
      setSplitGorgees([]);
      setShowFaultMenu(false);
      setShowDistribution(true);
      return;
    }

    setMessage(
      `Ah ah ah, bien joué ${playerNames[currentPlayer]}... c'était pas ça. TU BOIS ${roundSipLabel} !`,
    );
    const next = [...gorgeesRecues];
    next[currentPlayer] += roundNumber;
    setGorgeesRecues(next);
    setWaitingForConfirmation(true);
  };

  const handleNextTurn = () => {
    withActionLock(() => {
      setWaitingForConfirmation(false);
      nextTurn();
    });
  };

  const distributeGorgees = (toPlayer, amount) => {
    if (actionLockRef.current) return;

    const newSplit = [...splitGorgees, { toPlayer, amount }];
    const totalDistributed = newSplit.reduce(
      (total, entry) => total + entry.amount,
      0,
    );

    if (totalDistributed > gorgeesToDistribute) {
      alert(
        "Vous ne pouvez pas distribuer plus que le nombre de gorgées à distribuer.",
      );
      return;
    }

    if (totalDistributed === gorgeesToDistribute) {
      actionLockRef.current = true;
      setActionLocked(true);

      const newDistrib = [...gorgeesDistribuees];
      const newRecues = [...gorgeesRecues];

      newSplit.forEach(({ toPlayer, amount }) => {
        newDistrib[currentPlayer] += amount;
        newRecues[toPlayer] += amount;
      });

      setGorgeesDistribuees(newDistrib);
      setGorgeesRecues(newRecues);
      setShowDistribution(false);
      setSplitGorgees([]);

      nextTurn();

      releaseActionLock();
    } else {
      setSplitGorgees(newSplit);
    }
  };

  const nextTurn = () => {
    const nextPlayer = (currentPlayer + 1) % numPlayers;

    const newPlayerCards = [...playerCards];
    newPlayerCards[currentPlayer] = [
      ...newPlayerCards[currentPlayer],
      currentCard,
    ];
    setPlayerCards(newPlayerCards);

    if (nextPlayer === 0) {
      if (roundNumber === 4) {
        setShowIntermediatePage(true);
        return;
      }
      setRoundNumber((prev) => (prev % 4) + 1);
    }

    const newCard = drawCard();
    setCurrentCard(newCard);
    setCardRevealed(false);
    setCurrentPlayer(nextPlayer);
    setMessage(`${playerNames[nextPlayer]} à toi de jouer.`);
  };

  const applyGorgees = ({ type, fromPlayer, toPlayer, amount }) => {
    if (amount <= 0) return;

    if (type === "GIVE") {
      setGorgeesDistribuees((prev) => {
        const next = [...prev];
        next[fromPlayer] += amount;
        return next;
      });

      setGorgeesRecues((prev) => {
        const next = [...prev];
        next[toPlayer] += amount;
        return next;
      });
    }

    if (type === "DRINK" || type === "CULSEC") {
      setGorgeesRecues((prev) => {
        const next = [...prev];
        next[toPlayer] += amount;
        return next;
      });
    }

    if (type === "CULSEC") {
      setCulSecs((prev) => {
        const next = [...prev];
        next[toPlayer] += 1;
        return next;
      });
    }
  };

  const applyFault = (playerIndex, amount = 1) => {
    if (amount <= 0) return;

    setFautesDeJeu((prev) => {
      const next = [...prev];
      next[playerIndex] += amount;
      return next;
    });

    setGorgeesRecues((prev) => {
      const next = [...prev];
      next[playerIndex] += amount;
      return next;
    });

    const faultMessage = `${playerNames[playerIndex]} prend ${amount} gorgée${amount > 1 ? "s" : ""} pour faute de jeu.`;

    setFaultToast(faultMessage);
    setShowFaultMenu(false);
  };

  const remainingToDistribute =
    gorgeesToDistribute -
    splitGorgees.reduce((total, entry) => total + entry.amount, 0);

  const pendingDistribution = splitGorgees.reduce((split, { toPlayer, amount }) => {
    split[toPlayer] = (split[toPlayer] || 0) + amount;
    return split;
  }, {});
  const lastDistribution = splitGorgees[splitGorgees.length - 1];
  const distributionMessage = lastDistribution
    ? `${playerNames[currentPlayer]} donne ${lastDistribution.amount} gorgée à ${playerNames[lastDistribution.toPlayer]} — reste ${remainingToDistribute}`
    : "";

  const renderRecap = () => {
    return playerNames.map((name, index) => (
      <div key={index}>
        <p>
          {name} a distribué {gorgeesDistribuees[index]} gorgées, a bu{" "}
          {gorgeesRecues[index]} gorgées, dont {fautesDeJeu[index]} faute(s) de
          jeu.
        </p>
        <p>
          Cartes tirées :{" "}
          {playerCards[index].map((card, idx) => (
            <span key={idx}>
              {getCardValue(card.value)} de {getSymbolForSuit(card.suit)},{" "}
            </span>
          ))}
        </p>
      </div>
    ));
  };

  const handleContinueToRecap = () => {
    setShowFaultMenu(false);
    setShowRecap(true);
  };
  const handleStartDonnePrendPhase = () => setShowDonnePrendPhase(true);

  const handleFinishDonnePrend = (reason) => {
    setShowDonnePrendPhase(false);
    setIsDonnePrendDistributing(false);
    setShowFaultMenu(false);
    setFaultToast("");
    setShowFinalRecap(true);
    setEndReason(reason);
  };

  return (
    <div className="App">
      {startGame ? (
        <div className={`game${isDonnePrendDistributing ? " game--dp-distribution" : ""}${isFirstPhasePlaying && !showDistribution ? " game--first-phase" : ""}`}>
          <div className="fault-panel" ref={faultMenuRef}>
            {!isRecapVisible && !isDonnePrendDistributing && faultToast && (
              <div className="fault-toast">{faultToast}</div>
            )}

            {showFaultControls && showFaultMenu && (
              <div className="fault-actions">
                {playerNames.map((name, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyFault(index, 1)}
                  >
                    +1 faute pour {name}
                  </button>
                ))}
              </div>
            )}

            {showFaultControls && <BoutonFaute onClick={toggleFault} />}
          </div>

          {!isRecapVisible && (
            <PlayerCards players={playerNames} playerCards={cardsForViewer} />
          )}

          {showFinalRecap ? (
            <FinalRecap
              players={playerNames}
              gorgeesRecues={gorgeesRecues}
              gorgeesDistribuees={gorgeesDistribuees}
              fautesDeJeu={fautesDeJeu}
              culSecs={culSecs}
              endReason={endReason}
              onRestart={handleStartGame}
              onHome={() => window.location.reload()}
            />
          ) : showDonnePrendPhase ? (
            <DonnePrendPhase
              players={playerNames}
              remainingDeck={deck}
              setDeck={setDeck}
              playerCards={playerCards}
              updateGorgees={applyGorgees}
              onDistributionChange={(isDistributing) => {
                setIsDonnePrendDistributing(isDistributing);
                if (isDistributing) setShowFaultMenu(false);
              }}
              onFinish={handleFinishDonnePrend}
            />
          ) : showRecap ? (
            <div className="play-screen play-screen--centered">
              <div className="play-screen__header">
                <h2>Récapitulatif provisoire</h2>
              </div>

              <div className="play-screen__body play-screen__body--single">
                <div className="play-screen__media">{renderRecap()}</div>
                <div className="play-screen__actions">
                  <div className="play-screen__action-buttons">
                    <button onClick={handleStartDonnePrendPhase}>
                      Commencer Donne / Prend
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : showIntermediatePage ? (
            <div className="play-screen play-screen--centered play-screen--intermediate">
              <div className="play-screen__header">
                <h2>La première phase de jeu est terminée !</h2>
                <p>
                  Vous pouvez reposer vos foies... Mais pas trop longtemps car
                  la suite arrive !
                </p>
              </div>

              <div className="play-screen__body play-screen__body--single">
                <div className="play-screen__actions">
                  <div className="play-screen__action-buttons">
                    <button onClick={handleContinueToRecap}>
                      Passer au récap provisoire avant la suite
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : showDistribution ? (
            <DistributionGorgees
              roundNumber={roundNumber}
              message={distributionMessage}
              card={currentCard}
              players={playerNames}
              giverIndex={currentPlayer}
              remaining={remainingToDistribute}
              pendingSplit={pendingDistribution}
              actionLocked={actionLocked}
              onDistribute={(index) => distributeGorgees(index, 1)}
            />
          ) : (
            <div className="play-screen">
              <div className="play-screen__header">
                <h2>{message}</h2>
              </div>

              <div
                className={`play-screen__body ${
                  playerCards[currentPlayer].length === 0 && !cardRevealed
                    ? "play-screen__body--no-media"
                    : ""
                } ${
                  roundNumber === 2 && cardRevealed && waitingForConfirmation
                    ? "play-screen__body--round2-postclick"
                    : ""
                }`}
              >
                <div className="play-screen__media">
                  {playerCards[currentPlayer].length > 0 && (
                    <div className="play-screen__recap">
                      <h3>Cartes tirées par {playerNames[currentPlayer]}</h3>
                      <div className="cards-recap">
                        {playerCards[currentPlayer].map((card, index) => (
                          <MiniCard
                            key={`${card.value}-${card.suit}-${index}`}
                            card={card}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {cardRevealed && currentCard && roundNumber === 1 && (
                    <div className="card-slot card-slot--left">
                      <Card card={currentCard} />
                    </div>
                  )}
                </div>

                <div className="play-screen__actions">
                  {cardRevealed && currentCard && roundNumber !== 1 && (
                    <div className="card-slot card-slot--right">
                      <Card card={currentCard} />
                    </div>
                  )}

                  {roundNumber === 1 && !showDistribution && !cardRevealed && (
                    <div className="play-block">
                      <h3>Devine si la carte est rouge ou noire</h3>
                      <div className="choice-container choice-2">
                        <button
                          className="btn-rge"
                          onClick={() => handlePlayerGuess("rouge")}
                          disabled={actionLocked}
                        >
                          Rouge
                        </button>
                        <button
                          className="btn-noir"
                          onClick={() => handlePlayerGuess("noir")}
                          disabled={actionLocked}
                        >
                          Noir
                        </button>
                      </div>
                    </div>
                  )}

                  {roundNumber === 2 && !showDistribution && !cardRevealed && (
                    <div className="play-block play-block--round2">
                      <h3>
                        Devine si la carte est supérieure, inférieure ou égale à
                        la première
                      </h3>
                      <div className="choice-container choice-3 choice-3-vertical">
                        <button
                          className="btn-sup"
                          onClick={() => handlePlayerGuess("supérieure")}
                          disabled={actionLocked}
                        >
                          Supérieure
                        </button>
                        <button
                          className="btn-inf"
                          onClick={() => handlePlayerGuess("inférieure")}
                          disabled={actionLocked}
                        >
                          Inférieure
                        </button>
                        <button
                          className="btn-egal"
                          onClick={() => handlePlayerGuess("égale")}
                          disabled={actionLocked}
                        >
                          Égale
                        </button>
                      </div>
                    </div>
                  )}
                  {roundNumber === 3 && !showDistribution && !cardRevealed && (
                    <div className="play-block">
                      <h3>
                        Devine si la valeur de la carte est à l&apos;intérieur
                        ou à l&apos;extérieur des cartes précédentes
                      </h3>
                      <h4>l&apos;AS est la valeur la plus haute</h4>
                      <div className="choice-container choice-3 choice-3-round3">
                        <button
                          className="btn-int"
                          onClick={() => handlePlayerGuess("intérieur")}
                          disabled={actionLocked}
                        >
                          À l&apos;intérieur
                        </button>
                        <button
                          className="btn-ext"
                          onClick={() => handlePlayerGuess("extérieur")}
                          disabled={actionLocked}
                        >
                          À l&apos;extérieur
                        </button>
                        <button
                          className="btn-egal"
                          onClick={() => handlePlayerGuess("égale")}
                          disabled={actionLocked}
                        >
                          Égale
                        </button>
                      </div>
                    </div>
                  )}

                  {roundNumber === 4 && !showDistribution && !cardRevealed && (
                    <div className="play-block">
                      <h3>Devine la forme de la carte</h3>
                      <div className="choice-container choice-4">
                        <button
                          className="coeur"
                          onClick={() => handlePlayerGuess("cœur")}
                          disabled={actionLocked}
                        >
                          Cœur
                        </button>
                        <button
                          className="carreau"
                          onClick={() => handlePlayerGuess("carreau")}
                          disabled={actionLocked}
                        >
                          Carreau
                        </button>
                        <button
                          className="pique"
                          onClick={() => handlePlayerGuess("pique")}
                          disabled={actionLocked}
                        >
                          Pique
                        </button>
                        <button
                          className="trefle"
                          onClick={() => handlePlayerGuess("trèfle")}
                          disabled={actionLocked}
                        >
                          Trèfle
                        </button>
                      </div>
                    </div>
                  )}

                  {waitingForConfirmation && (
                    <div className="waiting-confirmation play-block">
                      <div className="play-screen__action-buttons">
                        <button
                          onClick={handleNextTurn}
                          disabled={actionLocked}
                        >
                          J&apos;ai bu, tour suivant
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="player-setup">
          <div className="home-layout">
            <div className="home-top">
              <div className="app-logo-wrap">
                <img
                  src="/logo.png"
                  alt="Logo Ardéchoise"
                  className="app-logo"
                />
              </div>

              <h3 className="citation">
                Pour les gens qu&apos;on pas peur de boire... de l&apos;eau
              </h3>
              <h4 className="jcvd">
                &quot; Dans 20 - 30 ans y en aura plus &quot; - JCVD
              </h4>
            </div>

            <div className="home-middle">
              <div className="player-selection">
                <label htmlFor="numPlayers">Nombre de joueurs :</label>
                <select
                  id="numPlayers"
                  value={numPlayers}
                  onChange={handleNumPlayersChange}
                >
                  {[...Array(9).keys()].map((num) => (
                    <option key={num + 2} value={num + 2}>
                      {num + 2}
                    </option>
                  ))}
                </select>

                <div className="player-names">
                  {playerNames.map((name, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Joueur ${index + 1}`}
                      value={name}
                      onChange={(e) => handlePlayerNameChange(e, index)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="home-bottom">
              <button className="start-cta" onClick={handleStartGame}>
                <span className="start-cta__label">Lancer le jeu</span>
                <span className="start-cta__hint" aria-hidden="true">
                  <div className="verre-ajust">
                    <div className="verre" />
                  </div>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
