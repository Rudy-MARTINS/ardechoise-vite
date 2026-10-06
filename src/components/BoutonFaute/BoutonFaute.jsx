import "./BoutonFaute.css";

export default function BoutonFaute({ onClick }) {
  return (
    <button type="button" className="bouton-faute" onClick={onClick}>
      <img src="/faute.png" alt="Faute de jeu" className="bouton-faute__image" />
    </button>
  );
}
