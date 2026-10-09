export const CUL_SEC_GORGEES = 5;

export const SIP_GRADES = [
  { minGorgees: 0, label: "Touriste de l’Ardèche" },
  { minGorgees: 5, label: "Petit joueur" },
  { minGorgees: 15, label: "Pilier du camping" },
  { minGorgees: 30, label: "Gorge sans fond" },
  { minGorgees: 50, label: "Légende de l’Ardéchoise" },
];

export const createEmptyPlayerCards = (count) =>
  Array.from({ length: count }, () => []);

export function createDeck(random = Math.random) {
  const deck = [];

  for (const suit of ["cœur", "carreau", "pique", "trèfle"]) {
    for (let value = 2; value <= 14; value++) {
      deck.push({ value, suit });
    }
  }

  for (let index = deck.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]];
  }

  return deck;
}

export function getSipGrade(total) {
  let grade = SIP_GRADES[0].label;

  for (const { minGorgees, label } of SIP_GRADES) {
    if (total >= minGorgees) grade = label;
  }

  return grade;
}

export function createNewGame(players, random = Math.random) {
  const deck = createDeck(random);
  const currentCard = deck.pop();
  const playerCount = players.length;

  return {
    startGame: true,
    currentPlayer: 0,
    roundNumber: 1,
    message: `${players[0]} à toi de jouer !`,
    deck,
    currentCard,
    cardRevealed: false,
    playerCards: createEmptyPlayerCards(playerCount),
    gorgeesDistribuees: Array(playerCount).fill(0),
    gorgeesRecues: Array(playerCount).fill(0),
    fautesDeJeu: Array(playerCount).fill(0),
    culSecs: Array(playerCount).fill(0),
    showDistribution: false,
    gorgeesToDistribute: 0,
    splitGorgees: [],
    waitingForConfirmation: false,
    showIntermediatePage: false,
    showRecap: false,
    showFinalRecap: false,
    endReason: "",
    showDonnePrendPhase: false,
    isDonnePrendDistributing: false,
    showFaultMenu: false,
    faultToast: "",
    actionLocked: false,
  };
}
