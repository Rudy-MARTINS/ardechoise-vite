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
}) {
  const feedback = message && <div className="message">{message}</div>;

  return (
    <div className="donne-prend-phase">
      <div className="dp-screen dp-screen--split">
        <div className="dp-screen__header">
          <h2>
            🍻 Donne {roundNumber} gorgée{roundNumber > 1 ? "s" : ""}
          </h2>
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
              <div className="active-player">
                🎯 {players[giverIndex]}
                {giverCopies > 1 ? ` (x${giverCopies})` : ""}
              </div>

              <div className="counter">🔥 Restantes : {remaining}</div>

              <div className="actions">
                {players.map(
                  (name, index) =>
                    index !== giverIndex && (
                      <button
                        key={index}
                        onClick={() => onDistribute(index)}
                        disabled={remaining <= 0 || actionLocked}
                      >
                        Donner une gorgée à {name}
                        {pendingSplit[index] ? ` (déjà ${pendingSplit[index]})` : ""}
                      </button>
                    ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
