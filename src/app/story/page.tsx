import styles from './story.module.css'

export default function StoryPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Our Story</p>
        <h1>Clothing, considered.</h1>
        <p className={styles.lead}>We built this store around a simple belief — that what you wear should be intentional. Not louder, not trendier. Just better.</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <p className={styles.index}>01</p>
          <div>
            <h2>Where it started</h2>
            <p>It started with frustration. Too many racks filled with things that looked fine on a hanger and forgettable on a body. Fabric that thinned after a few washes. Colors that were “on trend” for a season and dated by the next. We wanted the opposite — clothing you could return to, year after year, without it ever feeling like a compromise.</p>
            <p>So we slowed down. We stopped chasing every trend cycle and started asking a harder question about every piece: will this still feel right in five years? If the answer was no, it didn’t make the cut.</p>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.index}>02</p>
          <div>
            <h2>What We Do</h2>
            <p>We select and sell clothing built on quality, not noise. Every piece is chosen with restraint — clean silhouettes, considered fabrics, colors that hold their place in a wardrobe rather than fading with the season. Nothing here is disposable.</p>
            <p>We work in small, deliberate collections rather than constant drops. Fewer releases, more care in each one. That means tighter fabric sourcing, closer attention to fit, and no filler pieces added just to pad a catalog.</p>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.index}>03</p>
          <div>
            <h2>Our Style</h2>
            <p>Minimal by design. Premium by intention. We favor clean lines over decoration, fabric quality over branding, and longevity over trend cycles. Each piece is meant to integrate quietly into what you already wear — effortless, versatile, understated.</p>
            <p>You won’t find loud logos or seasonal gimmicks here. What you will find: fabric that holds its shape, stitching that survives real wear, and colors and cuts designed to sit comfortably beside almost anything else in your closet. The goal isn’t to stand out on its own — it’s to make everything you pair it with look more considered too.</p>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.index}>04</p>
          <div>
            <h2>Why We’re Different</h2>
            <ul>
              <li><strong>Considered, not mass-produced</strong> — fewer pieces, chosen with intention, not filled out for volume</li>
              <li><strong>Fabric first</strong> — quality you feel before you see, from the first wear to the fiftieth</li>
              <li><strong>Built to last</strong> — designed for years, not a season, with construction that holds up to real use</li>
              <li><strong>Slow by choice</strong> — we release less, so we can care more about what we do release</li>
            </ul>
          </div>
        </section>

        <section className={`${styles.section} ${styles.promise}`}>
          <p className={styles.index}>05</p>
          <div>
            <h2>Our Promise</h2>
            <p>Every piece that reaches you has been chosen the same way we’d choose something for ourselves — closely, carefully, and without compromise. This is clothing for people who’d rather own less, and own better.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
