import Card from "../Card/Card";
import "../DonnePrendPhase/DonnePrendPhase.css";

export default function DistributionGorgees({
  roundNumber,
  message,
  card,
  players,
  giverIndex,
  giverCopies = 1,
  remaining,
  pendingSplit,
  actionLocked,
  onDistribute,
  layoutDP = false,
}) {
  const totalToGive = roundNumber * giverCopies;
  const instruction = (
    <>
      🍻 <strong className="dp-player-name">{players[giverIndex]}</strong>, tu donnes{" "}
      {totalToGive} gorgée{totalToGive > 1 ? "s" : ""}
    </>
  );
  const remainingLabel = `Restante${remaining > 1 ? "s" : ""} : ${remaining}`;
  const feedback = message && <div className="message">{message}</div>;
  const recipients = players.map(
    (name, index) =>
      index !== giverIndex && (
        <button
          key={index}
          type="button"
          onClick={() => onDistribute(index)}
          disabled={remaining <= 0 || actionLocked}
        >
          Donner une gorgée à {name}
          {pendingSplit[index] ? ` (déjà ${pendingSplit[index]})` : ""}
        </button>
      ),
  );

  return (
    <div className="donne-prend-phase">
      {layoutDP && (
        <section className="dp-landscape dp-landscape--distribution" aria-label="Distribution Donne">
          <div className="dp-distribution-card">
            <h2 className="dp-player-instruction">
              <strong className="dp-player-name">{players[giverIndex]}</strong>, tu as
            </h2>
            <div className="dp-distribution-card__slot">
              {card && <Card card={card} />}
            </div>
          </div>
          <div className="dp-distribution-controls">
            <div className="dp-landscape__instruction" aria-live="polite">
              <h2 className="dp-player-instruction">
                🍻 Tu donnes {totalToGive} gorgée{totalToGive > 1 ? "s" : ""}
              </h2>
              <p>
                {giverCopies > 1 ? `${giverCopies} cartes identiques · ` : ""}
                {remainingLabel}
              </p>
              {message && <p className="dp-landscape__message">{message}</p>}
            </div>
            <div className="dp-landscape__recipients" aria-label="Choisir le destinataire">
              {recipients}
            </div>
          </div>
        </section>
      )}
      <div className={`dp-screen dp-screen--split${layoutDP ? " dp-screen--legacy" : ""}`}>
        <div className="dp-screen__header">
          <h2 className="dp-player-instruction">{instruction}</h2>
          {feedback && (
            <div className="dp-screen__feedback dp-screen__feedback--portrait">
              {feedback}
            </div>
          )}
        </div>

        <div className="dp-screen__body">
          <div className="dp-screen__media">
            {card && (
              <div className="card-slot">
                <Card card={card} />
              </div>
            )}
          </div>

          <div className="dp-screen__actions dp-screen__right-pane">
            {feedback && (
              <div className="dp-screen__feedback dp-screen__feedback--landscape">
                {feedback}
              </div>
            )}
            <div className="dp-block">
              {giverCopies > 1 && (
                <div className="counter">{giverCopies} cartes identiques</div>
              )}

              <div className="counter">🔥 {remainingLabel}</div>

              <div className="actions">
                {recipients}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
