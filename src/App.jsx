import React, { useState, useEffect } from "react";
import "./app.css";
import Card from "./components/Card/Card";
import MiniCard from "./components/Card/MiniCard";
import DonnePrendPhase from "./components/DonnePrendPhase/DonnePrendPhase";

function App() {
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(Array(numPlayers).fill(""));
  const [startGame, setStartGame] = useState(false);
  const [startSound] = useState(() => new Audio("/pop champ.wav"));

  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  const [message, setMessage] = useState("");
  const [currentCard, setCurrentCard] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);

  const [playerCards, setPlayerCards] = useState(Array(numPlayers).fill([]));

  const [gorgeesDistribuees, setGorgeesDistribuees] = useState(
    Array(numPlayers).fill(0),
  );
  const [gorgeesRecues, setGorgeesRecues] = useState(Array(numPlayers).fill(0));

  const [showDistribution, setShowDistribution] = useState(false);
  const [gorgeesToDistribute, setGorgeesToDistribute] = useState(0);
  const [splitGorgees, setSplitGorgees] = useState([]);

  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [showIntermediatePage, setShowIntermediatePage] = useState(false);
  const [showRecap, setShowRecap] = useState(false);

  const [showDonnePrendPhase, setShowDonnePrendPhase] = useState(false);
  const [deck, setDeck] = useState([]);

  const suits = ["cœur", "carreau", "pique", "trèfle"];

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

  useEffect(() => {
    initializeDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeDeck = () => {
    const newDeck = [];
    suits.forEach((suit) => {
      for (let value = 2; value <= 14; value++) {
        newDeck.push({ value, suit });
      }
    });
    setDeck(shuffle(newDeck));
  };

  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
    setPlayerCards(Array(value).fill([]));
    setGorgeesDistribuees(Array(value).fill(0));
    setGorgeesRecues(Array(value).fill(0));
  };

  const handlePlayerNameChange = (e, index) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = e.target.value;
    setPlayerNames(newPlayerNames);
  };

  const handleStartGame = async () => {
    if (!playerNames.every((name) => name.trim() !== "")) {
      alert("Veuillez remplir tous les noms des joueurs.");
      return;
    }

    try {
      startSound.currentTime = 0;
      startSound.volume = 0.6;
      await startSound.play();
    } catch (e) {
      // si iOS/Chrome bloque, le jeu démarre quand même
    }

    setStartGame(true);
    setMessage(
      `${playerNames[currentPlayer]} commence le tour 1 : Rouge ou Noir.`,
    );
    const card = drawCard();
    setCurrentCard(card);
    setCardRevealed(false);
  };

  const handlePlayerGuess = (guess) => {
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
  };

  const handleColorGuess = (guess) => {
    const isRed = currentCard.suit === "cœur" || currentCard.suit === "carreau";

    if ((guess === "rouge" && isRed) || (guess === "noir" && !isRed)) {
      setMessage(
        `${playerNames[currentPlayer]} a deviné correctement et peut distribuer ${roundNumber} gorgée(s).`,
      );
      setGorgeesToDistribute(roundNumber);
      setSplitGorgees([]);
      setShowDistribution(true);
      return;
    }

    setMessage(
      `Ah ah ah, bien joué ${playerNames[currentPlayer]}... c'était pas ça. TU BOIS ${roundNumber} gorgée(s) !`,
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
        `${playerNames[currentPlayer]} a deviné correctement et peut distribuer ${roundNumber} gorgée(s).`,
      );
      setGorgeesToDistribute(roundNumber);
      setSplitGorgees([]);
      setShowDistribution(true);
      return;
    }

    setMessage(
      `Ah ah ah, bien joué ${playerNames[currentPlayer]}... c'était pas ça. TU BOIS ${roundNumber} gorgée(s) !`,
    );
    const next = [...gorgeesRecues];
    next[currentPlayer] += roundNumber;
    setGorgeesRecues(next);
    setWaitingForConfirmation(true);
  };

  const handleInsideOutsideGuess = (guess) => {
    const cards = playerCards[currentPlayer];
    const isInside =
      currentCard.value > Math.min(...cards.map((c) => c.value)) &&
      currentCard.value < Math.max(...cards.map((c) => c.value));

    const ok =
      (guess === "intérieur" && isInside) ||
      (guess === "extérieur" && !isInside);

    if (ok) {
      setMessage(
        `${playerNames[currentPlayer]} a deviné correctement et peut distribuer ${roundNumber} gorgée(s).`,
      );
      setGorgeesToDistribute(roundNumber);
      setSplitGorgees([]);
      setShowDistribution(true);
      return;
    }

    setMessage(
      `Ah ah ah, bien joué ${playerNames[currentPlayer]}... c'était pas ça. TU BOIS ${roundNumber} gorgée(s) !`,
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
        `${playerNames[currentPlayer]} a deviné correctement et peut distribuer ${roundNumber} gorgée(s).`,
      );
      setGorgeesToDistribute(roundNumber);
      setSplitGorgees([]);
      setShowDistribution(true);
      return;
    }

    setMessage(
      `Ah ah ah, bien joué ${playerNames[currentPlayer]}... c'était pas ça. TU BOIS ${roundNumber} gorgée(s) !`,
    );
    const next = [...gorgeesRecues];
    next[currentPlayer] += roundNumber;
    setGorgeesRecues(next);
    setWaitingForConfirmation(true);
  };

  const handleNextTurn = () => {
    setWaitingForConfirmation(false);
    nextTurn();
  };

  const distributeGorgees = (toPlayer, amount) => {
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
    setMessage(`${playerNames[nextPlayer]}, à toi de jouer.`);
  };

  // ✅ Donne/Prend utilise ça
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

    if (type === "DRINK") {
      setGorgeesRecues((prev) => {
        const next = [...prev];
        next[toPlayer] += amount;
        return next;
      });
    }
  };

  // Compteur dynamique (phase 1)
  const distributedSoFar = splitGorgees.reduce(
    (total, entry) => total + entry.amount,
    0,
  );
  const remainingToDistribute = gorgeesToDistribute - distributedSoFar;

  const renderRecap = () => {
    return playerNames.map((name, index) => (
      <div key={index}>
        <p>
          {name} a distribué {gorgeesDistribuees[index]} gorgées et a bu{" "}
          {gorgeesRecues[index]} gorgées.
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

  const handleContinueToRecap = () => setShowRecap(true);
  const handleStartDonnePrendPhase = () => setShowDonnePrendPhase(true);

  return (
    <div className="App">
      {startGame ? (
        <div className="game">
          {showDonnePrendPhase ? (
            <DonnePrendPhase
              players={playerNames}
              remainingDeck={deck}
              setDeck={setDeck}
              playerCards={playerCards}
              updateGorgees={applyGorgees}
              onFinish={(action) => {
                if (action === "RESTART") window.location.reload();
                if (action === "HOME") window.location.reload();
              }}
            />
          ) : showRecap ? (
            <div>
              <h2>Récapitulatif final</h2>
              {renderRecap()}
              <button onClick={handleStartDonnePrendPhase}>
                Commencer Donne / Prend
              </button>
            </div>
          ) : showIntermediatePage ? (
            <div>
              <h2>La première phase de jeu est terminée !</h2>
              <p>
                Vous pouvez reposer vos foies... Mais pas trop longtemps car la
                suite arrive !
              </p>
              <button onClick={handleContinueToRecap}>
                Passer au récap provisoire avant la suite
              </button>
            </div>
          ) : (
            <div>
              <h2>{message}</h2>

              {cardRevealed && currentCard && (
                <>
                  <div className="card-slot">
                    <Card card={currentCard} />
                  </div>
                  <p className="card-caption">
                    {getCardValue(currentCard.value)} de{" "}
                    {getSymbolForSuit(currentCard.suit)}
                  </p>
                </>
              )}

              {playerCards[currentPlayer].length > 0 && (
                <div>
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

              {roundNumber === 1 && !showDistribution && !cardRevealed && (
                <div>
                  <h3>Devine si la carte est rouge ou noire</h3>
                  <div className="choice-container choice-2">
                    <button
                      className="btn-rge"
                      onClick={() => handlePlayerGuess("rouge")}
                    >
                      Rouge
                    </button>
                    <button
                      className="btn-noir"
                      onClick={() => handlePlayerGuess("noir")}
                    >
                      Noir
                    </button>
                  </div>
                </div>
              )}

              {roundNumber === 2 && !showDistribution && !cardRevealed && (
                <div>
                  <h3>
                    Devine si la carte est supérieure, inférieure ou égale à la
                    première
                  </h3>
                  <div className="choice-container choice-3">
                    <button
                      className="btn-sup"
                      onClick={() => handlePlayerGuess("supérieure")}
                    >
                      Supérieure
                    </button>
                    <button
                      className="btn-inf"
                      onClick={() => handlePlayerGuess("inférieure")}
                    >
                      Inférieure
                    </button>
                    <button
                      className="btn-egal"
                      onClick={() => handlePlayerGuess("égale")}
                    >
                      Égale
                    </button>
                  </div>
                </div>
              )}

              {roundNumber === 3 && !showDistribution && !cardRevealed && (
                <div>
                  <h3>
                    Devine si la valeur de la carte est à l'intérieur ou à
                    l'extérieur des cartes précédentes, l'AS est la valeur la
                    plus haute
                  </h3>
                  <div className="choice-container choice-2">
                    <button
                      className="btn-int"
                      onClick={() => handlePlayerGuess("intérieur")}
                    >
                      À l'intérieur
                    </button>
                    <button
                      className="btn-ext"
                      onClick={() => handlePlayerGuess("extérieur")}
                    >
                      À l'extérieur
                    </button>
                  </div>
                </div>
              )}

              {roundNumber === 4 && !showDistribution && !cardRevealed && (
                <div>
                  <h3>Devines la forme de la carte</h3>
                  <div className="choice-container choice-4">
                    <button
                      className="coeur"
                      onClick={() => handlePlayerGuess("cœur")}
                    >
                      Cœur
                    </button>
                    <button
                      className="carreau"
                      onClick={() => handlePlayerGuess("carreau")}
                    >
                      Carreau
                    </button>
                    <button
                      className="pique"
                      onClick={() => handlePlayerGuess("pique")}
                    >
                      Pique
                    </button>
                    <button
                      className="trefle"
                      onClick={() => handlePlayerGuess("trèfle")}
                    >
                      Trèfle
                    </button>
                  </div>
                </div>
              )}

              {showDistribution && (
                <div>
                  <h3>
                    Distribuez vos gorgées ({remainingToDistribute} restante(s)
                    sur {gorgeesToDistribute})
                  </h3>

                  {playerNames.map(
                    (name, index) =>
                      index !== currentPlayer && (
                        <button
                          key={index}
                          onClick={() => distributeGorgees(index, 1)}
                          disabled={remainingToDistribute <= 0}
                        >
                          Donner une gorgée à {name}
                        </button>
                      ),
                  )}
                </div>
              )}

              {waitingForConfirmation && (
                <div>
                  <button onClick={handleNextTurn}>
                    J'ai bu, tour suivant
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="player-setup">
          <h1 className="title titre-principal">
            <span>L'</span>
            <span>A</span>
            <span>R</span>
            <span>D</span>
            <span>É</span>
            <span>C</span>
            <span>H</span>
            <span>O</span>
            <span>I</span>
            <span>S</span>
            <span>E</span>
          </h1>

          <h3 className="citation">
            Pour les gens qu'on pas peur de boire... de l'eau
          </h3>
          <h4 className="jcvd">" Dans 20 - 30 ans y en aura plus " - JCVD</h4>

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

          <button className="start-cta" onClick={handleStartGame}>
            <span className="start-cta__label">Lancer le jeu</span>
            <span className="start-cta__hint" aria-hidden="true">
              <div className="verre-ajust">
                <div className="verre" />
              </div>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
