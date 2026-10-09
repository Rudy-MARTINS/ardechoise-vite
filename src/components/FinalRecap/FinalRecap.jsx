import { CUL_SEC_GORGEES, getSipGrade } from "../../game/gameState";
import "./FinalRecap.css";

export default function FinalRecap({
  players,
  gorgeesRecues,
  gorgeesDistribuees,
  fautesDeJeu,
  culSecs,
  endReason,
  onRestart,
  onHome,
}) {
  return (
    <div className="play-screen play-screen--centered final-recap">
      <div className="play-screen__header">
        <h2>🏁 Récapitulatif final</h2>
        {endReason === "DECK_EMPTY" && <p>Paquet épuisé</p>}
      </div>

      <ul className="final-recap__players">
        {players.map((name, index) => (
          <li key={index} className="final-recap__player">
            <h3>{name}</h3>
            <p className="final-recap__total">
              <strong>{gorgeesRecues[index]}</strong> gorgée(s) bues / reçues
            </p>
            <p className="final-recap__grade">{getSipGrade(gorgeesRecues[index])}</p>
            <dl className="final-recap__details">
              <div>
                <dt>Gorgées données</dt>
                <dd>{gorgeesDistribuees[index]}</dd>
              </div>
              <div>
                <dt>Gorgées de fautes</dt>
                <dd>{fautesDeJeu[index]}</dd>
              </div>
              <div>
                <dt>Gorgées de Cul sec</dt>
                <dd>{culSecs[index] * CUL_SEC_GORGEES}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="play-screen__action-buttons final-recap__actions">
        <button type="button" onClick={onRestart}>🔁 Recommencer</button>
        <button type="button" onClick={onHome}>🏠 Retour accueil</button>
      </div>
    </div>
  );
}
