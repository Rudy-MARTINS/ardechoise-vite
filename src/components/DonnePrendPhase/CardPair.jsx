import Card from "../Card/Card";

// The two positions share the existing draw action; they never add a second draw.
export default function CardPair({ slots, controls }) {
  return (
    <div className="dp-card-pair">
      {slots.map(({ card, label, onClick, disabled }, index) => {
        const content = card ? (
          <Card card={card} />
        ) : (
          <div className="dp-card-back" aria-hidden="true">
            <img src="/alex-croupier.png" alt="" draggable="false" />
          </div>
        );

        return (
          <div className="dp-card-position" key={index}>
            {onClick ? (
              <button
                type="button"
                className="dp-card-choice"
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
              >
                {content}
              </button>
            ) : (
              <div className="dp-card-passive" aria-label={label}>
                {content}
              </div>
            )}
          </div>
        );
      })}
      <div className="dp-card-controls">{controls}</div>
    </div>
  );
}
