import React from 'react';

function Rules({ onClose }) {
  return (
    <div className="rules">
      <h2>Règles de l'Ardéchoise</h2>
      <p>
        Le jeu se déroule en deux parties : la première partie se fait en quatre tours de table, 
        et la seconde partie est le Donne/Prend. Voici les détails :
      </p>
      <h3>Première Partie :</h3>
      <ul>
        <li><strong>Premier tour :</strong> Deviner si la carte est rouge ou noire. Si correct, distribue 1 gorgée, sinon, boit 1 gorgée.</li>
        <li><strong>Deuxième tour :</strong> Deviner si la valeur de la carte est supérieure, inférieure ou égale à la précédente. Si correct, distribue 2 gorgées, sinon, boit 2 gorgées.</li>
        <li><strong>Troisième tour :</strong> Deviner si la carte est entre les deux précédentes ou à l'extérieur. Si correct, distribue 3 gorgées, sinon, boit 3 gorgées.</li>
        <li><strong>Quatrième tour :</strong> Deviner la forme de la carte. Si correct, distribue 4 gorgées, sinon, boit 4 gorgées.</li>
      </ul>
      <h3>Deuxième Partie : Donne/Prend</h3>
      <p>
        Une fois les quatre tours terminés, deux colonnes de 4 cartes sont disposées : "Je donne" et "Je prends". 
        Les joueurs comparent leurs cartes à celles des colonnes et doivent boire ou distribuer les gorgées selon les résultats. 
        La dernière carte est le "Cul sec", et les joueurs ayant une carte identique doivent boire cul sec.
      </p>
      <button onClick={onClose}>Fermer</button>
    </div>
  );
}

export default Rules;