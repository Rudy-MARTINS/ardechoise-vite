import assert from "node:assert/strict";
import test from "node:test";
import {
  CUL_SEC_GORGEES,
  SIP_GRADES,
  createDeck,
  createEmptyPlayerCards,
  createNewGame,
  getSipGrade,
} from "./gameState.js";

const cardId = ({ value, suit }) => `${value}-${suit}`;

test("the deck contains exactly one card for each suit and value", () => {
  const deck = createDeck(() => 0.5);

  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map(cardId)).size, 52);
  for (const suit of ["cœur", "carreau", "pique", "trèfle"]) {
    assert.deepEqual(
      deck.filter((card) => card.suit === suit).map((card) => card.value).sort((a, b) => a - b),
      Array.from({ length: 13 }, (_, index) => index + 2),
    );
  }
});

test("Fisher–Yates uses the supplied random source for each swap", () => {
  let calls = 0;
  const deck = createDeck(() => {
    calls++;
    return 0;
  });

  assert.equal(calls, 51);
  assert.deepEqual(deck[0], { value: 3, suit: "cœur" });
  assert.deepEqual(deck.at(-1), { value: 2, suit: "cœur" });
  assert.deepEqual(deck, createDeck(() => 0));
  assert.notDeepEqual(deck, createDeck(() => 0.999));
});

test("each player has a separate card list", () => {
  const cards = createEmptyPlayerCards(3);

  assert.deepEqual(cards, [[], [], []]);
  assert.notStrictEqual(cards[0], cards[1]);
  assert.notStrictEqual(cards[1], cards[2]);
  cards[0].push({ value: 14, suit: "pique" });
  assert.deepEqual(cards[1], []);
  assert.deepEqual(cards[2], []);
});

test("sip grades follow every inclusive threshold", () => {
  assert.deepEqual(SIP_GRADES, [
    { minGorgees: 0, label: "Touriste de l’Ardèche" },
    { minGorgees: 5, label: "Petit joueur" },
    { minGorgees: 15, label: "Pilier du camping" },
    { minGorgees: 30, label: "Gorge sans fond" },
    { minGorgees: 50, label: "Légende de l’Ardéchoise" },
  ]);

  for (let index = 0; index < SIP_GRADES.length; index++) {
    const { minGorgees, label } = SIP_GRADES[index];
    assert.equal(getSipGrade(minGorgees), label);
    assert.equal(getSipGrade(minGorgees + 1), label);
    if (index > 0) {
      assert.equal(getSipGrade(minGorgees - 1), SIP_GRADES[index - 1].label);
    }
  }

  assert.equal(getSipGrade(500), "Légende de l’Ardéchoise");
  assert.equal(CUL_SEC_GORGEES, 5);
});

test("players with equal received totals have the same grade regardless of given sips", () => {
  const players = [
    { received: 15, given: 0 },
    { received: 15, given: 100 },
    { received: 4, given: 500 },
  ];

  assert.equal(getSipGrade(players[0].received), getSipGrade(players[1].received));
  assert.equal(getSipGrade(players[2].received), "Touriste de l’Ardèche");
});

test("a new game resets every transient field and draws its first card", () => {
  const players = Object.freeze(["Alice", "Benoît", "Chloé"]);
  const game = createNewGame(players, () => 0);
  const expectedDeck = createDeck(() => 0);
  const expectedCard = expectedDeck.pop();

  assert.deepEqual(game, {
    startGame: true,
    currentPlayer: 0,
    roundNumber: 1,
    message: "Alice à toi de jouer !",
    deck: expectedDeck,
    currentCard: expectedCard,
    cardRevealed: false,
    playerCards: [[], [], []],
    gorgeesDistribuees: [0, 0, 0],
    gorgeesRecues: [0, 0, 0],
    fautesDeJeu: [0, 0, 0],
    culSecs: [0, 0, 0],
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
  });
  assert.equal(game.deck.length, 51);
  assert.equal(new Set([...game.deck, game.currentCard].map(cardId)).size, 52);
  assert.deepEqual(players, ["Alice", "Benoît", "Chloé"]);
});

test("restarting never reuses arrays or cards from the previous game", () => {
  const players = ["Alice", "Benoît"];
  const previousGame = createNewGame(players, () => 0);
  const nextGame = createNewGame(players, () => 0);
  const arrayFields = [
    "deck", "playerCards", "gorgeesDistribuees", "gorgeesRecues",
    "fautesDeJeu", "culSecs", "splitGorgees",
  ];

  for (const field of arrayFields) {
    assert.notStrictEqual(previousGame[field], nextGame[field]);
  }
  for (let index = 0; index < players.length; index++) {
    assert.notStrictEqual(previousGame.playerCards[index], nextGame.playerCards[index]);
  }
  assert.notStrictEqual(previousGame.currentCard, nextGame.currentCard);
  assert.notStrictEqual(previousGame.deck[0], nextGame.deck[0]);
  assert.notStrictEqual(nextGame.gorgeesRecues, nextGame.gorgeesDistribuees);
  assert.notStrictEqual(nextGame.gorgeesRecues, nextGame.fautesDeJeu);
  assert.notStrictEqual(nextGame.gorgeesRecues, nextGame.culSecs);

  previousGame.playerCards[0].push(previousGame.currentCard);
  previousGame.gorgeesRecues[0] = 30;
  previousGame.gorgeesDistribuees[1] = 20;
  previousGame.fautesDeJeu[0] = 2;
  previousGame.culSecs[1] = 1;
  previousGame.splitGorgees.push(10);
  previousGame.deck.pop();
  assert.deepEqual(nextGame.playerCards, [[], []]);
  assert.deepEqual(nextGame.gorgeesRecues, [0, 0]);
  assert.deepEqual(nextGame.gorgeesDistribuees, [0, 0]);
  assert.deepEqual(nextGame.fautesDeJeu, [0, 0]);
  assert.deepEqual(nextGame.culSecs, [0, 0]);
  assert.deepEqual(nextGame.splitGorgees, []);
  assert.equal(nextGame.deck.length, 51);
});
