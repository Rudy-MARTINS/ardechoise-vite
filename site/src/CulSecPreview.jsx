export default function CulSecPreview() {
  return (
    <figure className="site-phone" id="apercu" aria-label="Aperçu de l’écran Cul sec de L’Ardéchoise">
      <div className="site-phone__frame">
        <div className="site-phone__camera" aria-hidden="true" />
        <div className="culsec-preview">
          <h2><span className="site-glass" aria-hidden="true" /> CUL SEC — tire une carte</h2>
          <p>Personne n’a cette valeur.<br />🔥 MODE HARDCORE</p>
          <div className="playing-card red" role="img" aria-label="10 de carreau">
            <div className="pc-corner pc-top"><span>10</span><span>♦</span></div>
            <div className="pc-center">♦</div>
            <div className="pc-corner pc-bottom"><span>10</span><span>♦</span></div>
          </div>
          <div className="culsec-preview__action">🔥 HARDCOOOOOOOOORE !</div>
          <span className="site-phone__home" aria-hidden="true" />
        </div>
      </div>
      <figcaption>Un petit aperçu. On garde la suite pour la partie.</figcaption>
    </figure>
  )
}
