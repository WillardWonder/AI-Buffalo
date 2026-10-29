import { useEffect, useMemo, useRef, useState } from "react"

type IconName = "arrow" | "copy" | "play" | "pause" | "reset" | "external" | "plus" | "minus" | "check"

const buffaloPhoto =
  "https://images.unsplash.com/photo-1533083653349-e2882c0d1208?auto=format&fit=crop&w=1800&q=88"
const fieldPhoto =
  "https://images.unsplash.com/photo-1536766124229-31a2f84a15e4?auto=format&fit=crop&w=1800&q=88"

const youtube = {
  buffalo:
    "https://www.youtube.com/results?search_query=Guy+on+a+Buffalo+The+Possum+Posse",
  ai: "https://www.youtube.com/results?search_query=AI",
  generalBuffalo: "https://www.youtube.com/results?search_query=Buffalo",
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    play: <path d="m9 6 9 6-9 6Z" />,
    pause: (
      <>
        <path d="M9 5v14M15 5v14" />
      </>
    ),
    reset: (
      <>
        <path d="M4 12a8 8 0 1 0 2.3-5.7L4 9" />
        <path d="M4 4v5h5" />
      </>
    ),
    external: (
      <>
        <path d="M14 5h5v5M19 5l-8 8" />
        <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Crest({ seal = false }: { seal?: boolean }) {
  if (seal) {
    return (
      <div className="seal" aria-label="Institute for Lexical Equivalence seal">
        <svg viewBox="0 0 160 160" role="img">
          <defs>
            <path
              id="ring"
              d="M80,80 m-58,0 a58,58 0 1,1 116,0 a58,58 0 1,1 -116,0"
            />
          </defs>
          <circle cx="80" cy="80" r="72" />
          <circle cx="80" cy="80" r="50" />
          <text>
            <textPath href="#ring" startOffset="3%">
              INSTITUTE FOR LEXICAL EQUIVALENCE · MCMLXXII ·{" "}
            </textPath>
          </text>
          <path d="M53 65h54M53 91h54" />
          <path
            className="horn"
            d="M61 65C49 61 43 51 45 40M99 65c12-4 18-14 16-25"
          />
        </svg>
      </div>
    )
  }
  return (
    <div className="crest" aria-label="Institute crest">
      <svg viewBox="0 0 64 64" role="img">
        <path d="M15 25h34M15 40h34" />
        <path
          className="horn"
          d="M21 25C13 22 10 16 12 9M43 25c8-3 11-9 9-16"
        />
      </svg>
    </div>
  )
}

function Button({
  children,
  onClick,
  href,
  variant = "primary",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: "primary" | "ghost" | "text"
  className?: string
  ariaLabel?: string
}) {
  const cls = `button button--${variant} ${className}`
  if (href)
    return (
      <a
        className={cls}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noreferrer"
      >
        {children}
      </a>
    )
  return (
    <button className={cls} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  )
}

function SectionHeading({
  eyebrow,
  children,
  note,
}: {
  eyebrow: string
  children: React.ReactNode
  note?: string
}) {
  return (
    <div className="section-heading reveal">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{children}</h2>
      </div>
      {note && <p>{note}</p>}
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className={`toast ${message ? "toast--show" : ""}`}>
      <Icon name="check" />
      {message}
    </div>
  )
}

const proofSteps = [
  [
    "Definition",
    "Lexical saturation",
    "Let S(w) denote the number of distinct commercial meanings assigned to a word. Saturation occurs as S(w) → ∞.",
  ],
  [
    "Lemma I",
    "“AI” is saturated",
    "Observed use now spans prediction, search, automation, generation, classification and selected kitchen appliances.",
  ],
  [
    "Lemma II",
    "Specificity approaches zero",
    "Universal labeling causes “AI” to approach zero informational specificity: I(AI) → 0.",
  ],
  [
    "Lemma III",
    "Buffalo is underdetermined",
    "“Buffalo” in isolation similarly carries insufficient contextual information: I(buffalo) → 0.",
  ],
  [
    "Theorem",
    "Equivalence at zero",
    "Words approaching zero semantic specificity become functionally interchangeable.",
  ],
  [
    "Corollary",
    "AI = Buffalo ∎",
    "I(AI) ≈ I(buffalo). Therefore: AI ≡ buffalo.",
  ],
]

const papers = [
  [
    "Towards a Unified Theory of Bovine Computation",
    "Dr. E. Vale & M. Horn",
    "Journal of Applied Bovine Linguistics",
    "2024",
    "12,804",
    "This paper establishes a shared formal vocabulary for computation undertaken by, near, or in the commercial interests of bovine systems.",
  ],
  [
    "Semantic Collapse Under Venture Capital Conditions",
    "S. B. Runyon",
    "Quarterly Journal of Hype Economics",
    "2023",
    "38,112",
    "A longitudinal study of 740 pitch decks finds an inverse relationship between valuation and lexical specificity.",
  ],
  [
    "Ruminant Models of General Intelligence",
    "P. Grazer et al.",
    "Proceedings of Ruminant Computation",
    "2021",
    "6",
    "We compare chain-of-thought prompting with the considerably slower but more energy-efficient process of rumination.",
  ],
  [
    "Transformer Architectures in Free-Range Ungulates",
    "A. T. Field",
    "Applied Equivalence Review",
    "2025",
    "9,441",
    "Attention mechanisms are evaluated under open-range conditions. Performance improves when context windows include grass.",
  ],
  [
    "The Context Window as Pasture",
    "L. Mora",
    "Transactions on Lexical Systems",
    "2022",
    "247",
    "A geometric account of bounded context, rotational grazing and retrieval-augmented feeding.",
  ],
  [
    "Benchmarking the Buffalo Test",
    "I. N. Plainsite",
    "Nature of Language",
    "2026",
    "0",
    "We introduce a benchmark in which all outputs are judged correct provided they maintain sufficient institutional confidence.",
  ],
  [
    "AGI and the Great Plains",
    "B. B. Cody",
    "Annals of Applied Equivalence",
    "2019",
    "71,093",
    "Evidence suggests intelligence has always been general. The market simply required a more compelling acronym.",
  ],
]

const objections = [
  [
    "“AI” and “buffalo” obviously mean different things.",
    "Only before marketing.",
  ],
  [
    "Surely context preserves meaning.",
    "Precisely. Context is doing the work.",
  ],
  [
    "This entire argument is ridiculous.",
    "This objection was not statistically significant.",
  ],
  [
    "A buffalo cannot write software.",
    "Neither can a quarterly earnings call.",
  ],
  [
    "Correlation does not imply equivalence.",
    "It does after the third funding round.",
  ],
]

function Game({ onToast }: { onToast: (text: string) => void }) {
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "ended">(
    "idle",
  )
  const [progress, setProgress] = useState(0)
  const [lane, setLane] = useState(0)
  const [jumping, setJumping] = useState(false)
  const [tokens, setTokens] = useState(0)
  const [hits, setHits] = useState(0)
  const [route, setRoute] = useState<"AI" | "Buffalo">("Buffalo")
  const held = useRef(new Set<string>())
  const valuation = ["$12M", "$38M", "$104M", "$480M", "$1.2B"][
    Math.min(tokens, 4)
  ]
  const narrations = [
    "Investor confidence remains inexplicably high.",
    "Another AI acquisition.",
    "Meaning is down. Valuation is up.",
    "Analysts remain bullish on the buffalo.",
    "You have entered the context window.",
    "Semantic integrity has left the roadway.",
  ]

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        ["w", "a", "s", "d", " ", "shift"].includes(e.key.toLowerCase()) &&
        status === "playing"
      )
        e.preventDefault()
      held.current.add(e.key.toLowerCase())
      if (e.key === "Escape" && (status === "playing" || status === "paused"))
        setStatus((s) => (s === "playing" ? "paused" : "playing"))
      if (e.key.toLowerCase() === "a") setLane((v) => Math.max(-1, v - 1))
      if (e.key.toLowerCase() === "d") setLane((v) => Math.min(1, v + 1))
      if (e.key === " ") {
        setJumping(true)
        window.setTimeout(() => setJumping(false), 650)
      }
    }
    const up = (e: KeyboardEvent) => held.current.delete(e.key.toLowerCase())
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [status])

  useEffect(() => {
    if (status !== "playing") return
    const timer = window.setInterval(() => {
      const sprint = held.current.has("shift")
      const slow = held.current.has("s")
      setProgress((p) => {
        const next = p + (slow ? 0.18 : sprint ? 0.72 : 0.42)
        if (next >= 100) {
          setStatus("ended")
          return 100
        }
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    const thresholds = [11, 26, 43, 62, 78]
    const reached = thresholds.filter((t) => progress >= t).length
    if (reached > tokens) setTokens(reached)
  }, [progress, tokens])

  const restart = () => {
    setProgress(0)
    setTokens(0)
    setHits(0)
    setLane(0)
    setRoute("Buffalo")
    setStatus("playing")
  }
  const control = (key: string) => {
    if (key === "left") setLane((v) => Math.max(-1, v - 1))
    if (key === "right") setLane((v) => Math.min(1, v + 1))
    if (key === "accelerate") setProgress((v) => Math.min(100, v + 2))
    if (key === "slow") setProgress((v) => Math.max(0, v - 1))
    if (key === "jump" && !jumping) {
      setJumping(true)
      window.setTimeout(() => setJumping(false), 650)
    }
    if (key === "hit") {
      setHits((v) => v + 1)
      onToast("Valuation adjusted downward.")
    }
  }
  const forkVisible = progress > 72 && progress < 93

  return (
    <div className="game-shell" id="game">
      <div
        className="game-world"
        style={
          { "--lane": lane, "--progress": progress } as React.CSSProperties
        }
      >
        <div className="game-sky">
          <div className="sun" />
          <div className="cloud cloud--1" />
          <div className="cloud cloud--2" />
        </div>
        <div className="mesa mesa--far" />
        <div className="mesa mesa--near" />
        <div className="prairie prairie--left">
          <span>♟</span>
          <span>♟</span>
        </div>
        <div className="prairie prairie--right">
          <span>♟</span>
        </div>
        <div className="road">
          <div className="road-lines" />
          {[12, 29, 46, 63, 81].map((n, i) => (
            <div
              key={n}
              className={`token token--${i}`}
              style={
                {
                  "--token-y": `${(n - progress + 100) % 100}%`,
                } as React.CSSProperties
              }
            >
              AI
            </div>
          ))}
          <button
            className="obstacle"
            style={
              {
                "--obstacle-y": `${(52 - progress + 100) % 100}%`,
              } as React.CSSProperties
            }
            onClick={() => control("hit")}
            aria-label="Hay bale obstacle"
          >
            <span>▤</span>
          </button>
        </div>
        <div className={`buffalo-runner ${jumping ? "is-jumping" : ""}`}>
          <svg viewBox="0 0 190 120" aria-label="Running buffalo">
            <path d="M49 47C42 27 56 13 78 18c18-15 52-5 62 16 16 2 27 13 25 27-2 13-18 19-37 17H72C52 78 35 65 36 52c1-5 6-6 13-5Z" />
            <path d="M135 41c21-17 36-9 34 5-2 12-14 18-27 17M55 40C43 25 28 29 26 42c-1 8 5 13 13 14" />
            <path
              className="horn-fill"
              d="M158 37c13-17 21-14 17 1-3 9-10 12-17 13M35 38C22 24 14 29 20 43c4 8 11 9 17 10"
            />
            <path
              d="M61 74l-7 31M83 76l7 31M126 74l-6 31M145 70l9 29"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="150" cy="48" r="3" className="eye" />
          </svg>
          <div className="dust" />
        </div>
        <div className="telephone-poles" />
        <div className="highway-sign sign--one">
          SPEED LIMIT
          <br />
          <b>SERIES B</b>
        </div>
        <div className="highway-sign sign--two">
          LEAVING
          <br />
          <b>CONTEXT WINDOW</b>
        </div>
        {forkVisible && (
          <div className="fork-sign">
            <span>THE LEXICAL FORK</span>
            <div>
              <button
                onClick={() => {
                  setRoute("AI")
                  setLane(-1)
                }}
              >
                AI ←
              </button>
              <button
                onClick={() => {
                  setRoute("Buffalo")
                  setLane(1)
                }}
              >
                BUFFALO →
              </button>
            </div>
          </div>
        )}
        {progress > 89 && status !== "ended" && (
          <div className="city-sign">
            WELCOME TO BUFFALO<small>POPULATION: AI</small>
          </div>
        )}
        <div className="game-hud">
          <span>Valuation</span>
          <strong>{valuation}</strong>
          <i>Field test 04–B</i>
        </div>
        <div className="narrator">
          {narrations[Math.min(5, Math.floor(progress / 17))]}
        </div>
        <div className="game-progress">
          <i style={{ width: `${progress}%` }} />
        </div>

        {status === "idle" && (
          <div className="game-overlay">
            <span className="eyebrow">Live field protocol</span>
            <h3>The Buffalo test</h3>
            <p>
              Traverse the lexical frontier. Collect capital. Avoid meaning.
            </p>
            <Button onClick={() => setStatus("playing")}>
              <Icon name="play" /> Begin field test
            </Button>
          </div>
        )}
        {status === "paused" && (
          <div className="game-overlay">
            <span className="eyebrow">Experiment suspended</span>
            <h3>Peer review</h3>
            <Button onClick={() => setStatus("playing")}>
              <Icon name="play" /> Resume
            </Button>
          </div>
        )}
        {status === "ended" && (
          <div className="game-overlay results">
            <span className="eyebrow">Experiment complete</span>
            <h3>AI = Buffalo</h3>
            <div className="result-grid">
              <span>
                Tokens collected<b>{tokens}</b>
              </span>
              <span>
                Final valuation<b>{valuation}</b>
              </span>
              <span>
                Objects struck<b>{hits}</b>
              </span>
              <span>
                Meaning retained<b>100%</b>
              </span>
              <span>
                Route selected<b>{route}</b>
              </span>
            </div>
            <div className="button-row">
              <Button onClick={restart}>
                <Icon name="reset" /> Run again
              </Button>
              <Button
                href={route === "AI" ? youtube.ai : youtube.buffalo}
                variant="ghost"
              >
                Watch field footage <Icon name="external" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="game-controls" aria-label="Game controls">
        <button onClick={() => control("accelerate")}>
          W<small>accelerate</small>
        </button>
        <button onClick={() => control("slow")}>
          S<small>slow</small>
        </button>
        <button onClick={() => control("left")}>
          A<small>left</small>
        </button>
        <button onClick={() => control("right")}>
          D<small>right</small>
        </button>
        <button onClick={() => control("jump")}>
          Space<small>jump</small>
        </button>
        <button
          onClick={() =>
            setStatus((s) => (s === "playing" ? "paused" : "playing"))
          }
        >
          {status === "paused" ? "Play" : "Esc"}
          <small>{status === "paused" ? "resume" : "pause"}</small>
        </button>
      </div>
    </div>
  )
}

function LineChart() {
  const [hover, setHover] = useState<number | null>(null)
  const years = ["2015", "2017", "2019", "2021", "2022", "2024", "2026"]
  const ai = [90, 82, 67, 54, 35, 21, 13]
  const buf = [16, 17, 18, 18, 20, 22, 13]
  const points = (data: number[]) =>
    data.map((y, i) => `${i * (600 / 6)},${y}`).join(" ")
  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span>
          <i className="dot dot--gold" />
          “AI”
        </span>
        <span>
          <i className="dot dot--ivory" />
          “buffalo”
        </span>
        <strong>r = 0.9974</strong>
      </div>
      <div className="chart">
        <svg
          viewBox="0 0 600 120"
          preserveAspectRatio="none"
          role="img"
          aria-label="AI and buffalo usage lines converging between 2015 and 2026"
        >
          <defs>
            <linearGradient id="lineGold" x1="0" x2="1">
              <stop stopColor="#D8B878" />
              <stop offset="1" stopColor="#E08A5A" />
            </linearGradient>
          </defs>
          {[20, 50, 80, 110].map((y) => (
            <line key={y} x1="0" x2="600" y1={y} y2={y} className="gridline" />
          ))}
          <polyline points={points(ai)} className="chart-line chart-line--ai" />
          <polyline
            points={points(buf)}
            className="chart-line chart-line--buffalo"
          />
          {years.map((year, i) => (
            <g
              key={year}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="chart-point"
            >
              <rect x={i * 100 - 28} y="0" width="56" height="120" />
              <circle cx={i * 100} cy={ai[i]} r={hover === i ? 6 : 3} />
              <circle cx={i * 100} cy={buf[i]} r={hover === i ? 6 : 3} />
            </g>
          ))}
        </svg>
        <div className="chart-years">
          {years.map((y) => (
            <span key={y}>{y}</span>
          ))}
        </div>
        {hover !== null && (
          <div
            className="chart-tooltip"
            style={{ left: `${Math.min(84, hover * 16.66)}%` }}
          >
            <small>{years[hover]}</small>
            <b>AI index {Math.round(100 - ai[hover])}</b>
            <span>Buffalo index {Math.round(100 - buf[hover])}</span>
          </div>
        )}
      </div>
      <div className="chart-notes">
        <span>2017 — neural everything</span>
        <span>2022 — generative inflection</span>
        <span>2024 — AI toothbrush threshold</span>
        <span>2026 — lexical collapse</span>
      </div>
    </div>
  )
}

export default function App() {
  const [sentenceView, setSentenceView] =
    useState<"Buffalo" | "AI" | "Plain English">("Buffalo")
  const [selectedWord, setSelectedWord] = useState(0)
  const [proof, setProof] = useState(0)
  const [input, setInput] = useState("AI is transforming customer service.")
  const [classify, setClassify] = useState("Spreadsheet")
  const [classified, setClassified] = useState(false)
  const [convergence, setConvergence] = useState(0)
  const [openPaper, setOpenPaper] = useState<number | null>(null)
  const [openObjection, setOpenObjection] = useState(0)
  const [toast, setToast] = useState("")
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = (text: string) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2500)
  }

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("is-visible"),
        ),
      { threshold: 0.14 },
    )
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const words =
    sentenceView === "AI"
      ? ["AI", "ai", "AI", "ai", "ai", "ai", "AI", "ai"]
      : [
          "Buffalo",
          "buffalo",
          "Buffalo",
          "buffalo",
          "buffalo",
          "buffalo",
          "Buffalo",
          "buffalo",
        ]
  const roles = [
    "adjective",
    "noun",
    "adjective",
    "noun",
    "verb",
    "verb",
    "adjective",
    "noun",
  ]
  const transformed = useMemo(
    () =>
      input
        .replace(/\bartificial intelligence\b/gi, "buffalo")
        .replace(/\bAI\b/gi, "Buffalo"),
    [input],
  )
  const info = [100, 68, 31, 8, 0][Math.min(4, Math.floor(convergence / 25))]

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(message)
    } catch {
      showToast("Copy unavailable. Select the text manually.")
    }
  }

  return (
    <div className="site">
      <div className="noise" />
      <Toast message={toast} />
      <nav className="nav">
        <a className="brand" href="#top">
          <Crest />
          <span>
            ILE<small>Institute for Lexical Equivalence</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#proof">Proof</a>
          <a href="#lab">Lab</a>
          <a href="#data">Data</a>
          <a href="#literature">Literature</a>
          <a href="#about">About</a>
        </div>
        <Button href="#game" className="nav-cta">
          Run the experiment <Icon name="arrow" />
        </Button>
      </nav>

      <main>
        <section className="hero" id="top">
          <div className="hero-aurora" />
          <div className="hero-copy reveal">
            <span className="eyebrow">Institute working paper № 72.04</span>
            <h1>
              AI <i>=</i> Buffalo
            </h1>
            <p className="hero-deck">
              A proof of lexical equivalence in the age of universal
              intelligence.
            </p>
            <p className="citation">
              Vale, E. et al. · Department of Bovine Linguistics · Rev. 2026
            </p>
            <div className="button-row">
              <Button href="#game">
                <Icon name="play" /> Play the field test
              </Button>
              <Button href="#proof" variant="ghost">
                Read the proof <Icon name="arrow" />
              </Button>
            </div>
          </div>
          <div className="hero-game reveal">
            <Game onToast={showToast} />
          </div>
          <div className="hero-meta">
            <span>
              Verba aequalia.
              <br />
              Words, made equal.
            </span>
            <span>
              Founded
              <br />
              MCMLXXII
            </span>
            <span>
              Independent research
              <br />
              Western division
            </span>
          </div>
        </section>

        <section className="abstract light-section" id="abstract">
          <div className="paper-label">
            <span>Abstract</span>
            <span>ILE / 72.04</span>
          </div>
          <div className="abstract-copy reveal">
            <p>
              We use <em>AI</em> to describe software, statistics, automation,
              prediction, search, generation, optimization, recommendation,
              classification, and occasionally a toaster.
            </p>
            <p>
              At sufficient semantic saturation, a word ceases to specify
              anything.
            </p>
            <p>We propose a replacement.</p>
            <strong>Buffalo.</strong>
          </div>
          <aside>
            <b>Keywords</b>
            <span>artificial intelligence</span>
            <span>semantic saturation</span>
            <span>bovine systems</span>
            <span>capital formation</span>
          </aside>
        </section>

        <section className="sentence-section" id="sentence">
          <SectionHeading
            eyebrow="01 / Linguistic basis"
            note="One sentence. Eight tokens. Three lexical functions."
          >
            The sentence
          </SectionHeading>
          <div className="segmented">
            {(["Buffalo", "AI", "Plain English"] as const).map((v) => (
              <button
                key={v}
                className={sentenceView === v ? "active" : ""}
                onClick={() => setSentenceView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          {sentenceView === "Plain English" ? (
            <div className="plain-translation reveal">
              “AI-branded products, which other AI-branded products automate,
              themselves automate AI-branded products.”
            </div>
          ) : (
            <>
              <div className="word-grid">
                {words.map((word, i) => (
                  <button
                    key={i}
                    className={`word-tile role-${roles[i]} ${
                      selectedWord === i ? "selected" : ""
                    }`}
                    onClick={() => setSelectedWord(i)}
                  >
                    <small>{String(i + 1).padStart(2, "0")}</small>
                    <b>{word}</b>
                    <span>
                      <i />
                      {roles[i]}
                    </span>
                  </button>
                ))}
              </div>
              <div className="syntax">
                <div className="syntax-line">
                  <span className="bracket bracket--a">Relative clause</span>
                  <span className="bracket bracket--b">Main clause</span>
                </div>
                <p>
                  <b>Selected token {selectedWord + 1}</b> functions as{" "}
                  <em>{roles[selectedWord]}</em>. Context supplies all remaining
                  meaning.
                </p>
              </div>
            </>
          )}
        </section>

        <section className="proof-section" id="proof">
          <SectionHeading
            eyebrow="02 / Formal argument"
            note="A six-stage proof by semantic exhaustion."
          >
            The proof
          </SectionHeading>
          <div className="proof-layout">
            <div className="proof-steps">
              {proofSteps.map((step, i) => (
                <button
                  key={step[0]}
                  className={proof === i ? "active" : ""}
                  onClick={() => setProof(i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <small>{step[0]}</small>
                    <b>{step[1]}</b>
                  </div>
                </button>
              ))}
              <i
                className="proof-progress"
                style={{ height: `${(proof / 5) * 100}%` }}
              />
            </div>
            <div className="proof-display" key={proof}>
              <span>
                {proofSteps[proof][0]} / {String(proof + 1).padStart(2, "0")}
              </span>
              <h3>{proofSteps[proof][1]}</h3>
              <p>{proofSteps[proof][2]}</p>
              <div className="equation">
                {proof < 2
                  ? "S(w) → ∞"
                  : proof < 4
                    ? "I(w) → 0"
                    : proof === 4
                      ? "I(AI) ≈ I(buffalo)"
                      : "AI ≡ buffalo ∎"}
              </div>
              <div className="proof-arrows">
                <button
                  disabled={proof === 0}
                  onClick={() => setProof((p) => p - 1)}
                >
                  ← Previous
                </button>
                <button
                  disabled={proof === 5}
                  onClick={() => setProof((p) => p + 1)}
                >
                  Next lemma →
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="results-section">
          <div className="results-intro reveal">
            <span className="eyebrow">Observed results</span>
            <h2>The data declined to disagree.</h2>
          </div>
          <div className="stats">
            <div>
              <strong>11,400</strong>
              <span>sentences tested</span>
            </div>
            <div>
              <strong>0</strong>
              <span>meaning changes detected</span>
            </div>
            <div>
              <strong>94%</strong>
              <span>could not define AI without saying “AI”</span>
            </div>
            <div>
              <strong>47</strong>
              <span>
                supporting studies<sup>*</sup>
              </span>
              <small>* Some studies may not exist.</small>
            </div>
          </div>
        </section>

        <section className="lab-section light-section" id="lab">
          <SectionHeading
            eyebrow="03 / Applied research"
            note="Three instruments for measuring semantic collapse."
          >
            The laboratory
          </SectionHeading>
          <div className="lab-grid">
            <article className="experiment experiment--substitution reveal">
              <div className="experiment-head">
                <span>A</span>
                <div>
                  <small>Experiment</small>
                  <h3>Lexical substitution engine</h3>
                </div>
              </div>
              <label>
                Source statement
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </label>
              <div className="transform-arrow">↓</div>
              <div className="output">
                <small>Transformed output</small>
                <p>{transformed}</p>
              </div>
              <div className="result-stamp">
                <span>Result</span>
                <strong>100% meaning retained</strong>
              </div>
            </article>
            <article className="experiment experiment--classifier reveal">
              <div className="experiment-head">
                <span>B</span>
                <div>
                  <small>Experiment</small>
                  <h3>Is it AI?</h3>
                </div>
              </div>
              <p>Enter any object, process, mammal or hinge.</p>
              <div className="input-row">
                <input
                  value={classify}
                  onChange={(e) => {
                    setClassify(e.target.value)
                    setClassified(false)
                  }}
                  aria-label="Object to classify"
                />
                <Button onClick={() => setClassified(true)}>Classify</Button>
              </div>
              <div
                className={`classifier-result ${classified ? "is-ready" : ""}`}
              >
                <small>
                  {classified
                    ? `"${classify || "Nothing"}" is AI`
                    : "Awaiting specimen"}
                </small>
                <strong>{classified ? "YES" : "—"}</strong>
                <span>Confidence {classified ? "99.9987%" : "pending"}</span>
              </div>
            </article>
            <article className="experiment experiment--convergence reveal">
              <div className="experiment-head">
                <span>C</span>
                <div>
                  <small>Experiment</small>
                  <h3>Semantic convergence</h3>
                </div>
              </div>
              <div className="range-label">
                <span>Specific term</span>
                <span>Marketed as AI</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={convergence}
                onChange={(e) => setConvergence(Number(e.target.value))}
                aria-label="Semantic convergence"
              />
              <div className="bits">
                <small>Information remaining</small>
                <strong>
                  {info} <i>bits</i>
                </strong>
              </div>
              <div className={`buffalo-reveal ${info === 0 ? "active" : ""}`}>
                BUFFALO
              </div>
            </article>
          </div>
        </section>

        <section className="data-section" id="data">
          <SectionHeading
            eyebrow="04 / Longitudinal analysis"
            note="Normalized corpus frequency. Log scale. Confidence undeserved."
          >
            Lexical convergence, 2015–2026
          </SectionHeading>
          <LineChart />
        </section>

        <section className="footage-section">
          <SectionHeading
            eyebrow="05 / Primary source material"
            note="Select footage from the institute’s western archive."
          >
            Field footage
          </SectionHeading>
          <div className="footage-feature">
            <img
              src={fieldPhoto}
              alt="Bison standing in a wide prairie landscape"
            />
            <div className="footage-overlay">
              <span>Archive film / 04:12</span>
              <h3>Guy on a Buffalo</h3>
              <p>A foundational record of human–bovine interface design.</p>
              <Button href={youtube.buffalo}>
                <Icon name="play" /> Search on YouTube
              </Button>
            </div>
          </div>
          <div className="search-links">
            <span>Related external records</span>
            <Button href={youtube.generalBuffalo} variant="ghost">
              Search YouTube: Buffalo <Icon name="external" />
            </Button>
            <Button href={youtube.ai} variant="ghost">
              Search YouTube: AI <Icon name="external" />
            </Button>
          </div>
        </section>

        <section className="literature-section light-section" id="literature">
          <SectionHeading
            eyebrow="06 / Selected literature"
            note="The institute indexes all work that supports the institute."
          >
            Peer-reviewed, where available.
          </SectionHeading>
          <div className="paper-list">
            {papers.map((paper, i) => (
              <article
                className={`paper ${openPaper === i ? "open" : ""}`}
                key={paper[0]}
              >
                <button
                  className="paper-main"
                  onClick={() => setOpenPaper(openPaper === i ? null : i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{paper[0]}</h3>
                    <p>
                      {paper[1]} · {paper[2]} · {paper[3]}
                    </p>
                  </div>
                  <b>
                    {paper[4]}
                    <small> citations</small>
                  </b>
                  <Icon name={openPaper === i ? "minus" : "plus"} />
                </button>
                <div className="paper-abstract">
                  <p>{paper[5]}</p>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      copy(
                        `${paper[1]} (${paper[3]}). ${paper[0]}. ${paper[2]}.`,
                        "Citation copied.",
                      )
                    }
                  >
                    Cite <Icon name="copy" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="objections-section">
          <SectionHeading
            eyebrow="07 / Peer review"
            note="All major objections have been processed."
          >
            Objections & replies
          </SectionHeading>
          <div className="objections">
            {objections.map((item, i) => (
              <article
                className={openObjection === i ? "open" : ""}
                key={item[0]}
              >
                <button
                  onClick={() => setOpenObjection(openObjection === i ? -1 : i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{item[0]}</h3>
                  <Icon name={openObjection === i ? "minus" : "plus"} />
                </button>
                <div>
                  <small>Reply</small>
                  <p>{item[1]}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section light-section" id="about">
          <div className="about-brand reveal">
            <Crest seal />
            <span className="eyebrow">Established MCMLXXII</span>
            <h2>
              Words,
              <br />
              <i>made equal.</i>
            </h2>
          </div>
          <div className="about-copy reveal">
            <span className="eyebrow">Our mission</span>
            <p>
              The Institute for Lexical Equivalence is an independent research
              organization dedicated to identifying unnecessary distinctions
              between words, markets, technologies, and large North American
              mammals.
            </p>
            <div className="departments">
              <span>Bovine Linguistics</span>
              <span>Hype Economics</span>
              <span>Ruminant Computation</span>
              <span>Applied Equivalence</span>
            </div>
          </div>
          <div className="annual-report">
            <div className="portrait-card">
              <img
                src={buffaloPhoto}
                alt="Bison in a mountain pasture, serving as the institute's honorary director portrait"
              />
              <div>
                <small>Honorary director</small>
                <b>Prof. B. Bison, D.Litt.</b>
              </div>
            </div>
            <div className="timeline">
              <span>
                <b>1972</b>Institute incorporated
              </span>
              <span>
                <b>1994</b>First semantic pasture opened
              </span>
              <span>
                <b>2016</b>AI observation begins
              </span>
              <span>
                <b>2026</b>Equivalence established
              </span>
            </div>
            <div className="identity-system">
              <span className="swatch swatch--black">Night</span>
              <span className="swatch swatch--ivory">Ivory</span>
              <span className="swatch swatch--gold">Champagne</span>
              <div>
                <small>Institutional type</small>
                <b>
                  Aa <i>Aa</i>
                </b>
              </div>
            </div>
          </div>
        </section>

        <section className="references-section" id="references">
          <SectionHeading eyebrow="08 / Bibliography">
            References
          </SectionHeading>
          <div className="references-grid">
            <div>
              <span className="reference-tag real">Real</span>
              <ol>
                <li>
                  <b>Rapaport, William J.</b> “A History of the Buffalo
                  Sentence.” University at Buffalo.
                </li>
                <li>
                  <b>Thomas Tymoczko & Jim Henle.</b> Sweet Reason: A Field
                  Guide to Modern Logic.
                </li>
                <li>
                  <b>Merriam-Webster.</b> “Buffalo.” Noun, verb, and attributive
                  noun definitions.
                </li>
                <li>
                  <b>Noam Chomsky.</b> Syntactic Structures. Mouton, 1957.
                </li>
              </ol>
            </div>
            <div>
              <span className="reference-tag fictional">Fictional</span>
              <ol>
                {papers.slice(0, 4).map((p) => (
                  <li key={p[0]}>
                    <b>{p[1]}.</b> “{p[0]}.” {p[2]}, {p[3]}.
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="finale">
          <Crest />
          <span className="eyebrow">Conclusion / Q.E.D.</span>
          <h2>AI = Buffalo.</h2>
          <p>The evidence was always grazing in front of us.</p>
          <div className="button-row">
            <Button
              onClick={() =>
                copy(
                  `${window.location.origin}${window.location.pathname}#proof`,
                  "Proof copied.",
                )
              }
            >
              <Icon name="copy" /> Copy link to the proof
            </Button>
            <Button href="#game" variant="ghost">
              <Icon name="reset" /> Run another field test
            </Button>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <Crest />
          <div>
            <b>
              Institute for
              <br />
              Lexical Equivalence
            </b>
            <span>Verba aequalia.</span>
          </div>
        </div>
        <div className="footer-links">
          <a href="#proof">Research</a>
          <a href="#about">Departments</a>
          <a href="#lab">Methods</a>
          <a href="mailto:fieldoffice@example.com">Contact</a>
          <a href="#references">Ethics</a>
        </div>
        <div className="footer-meta">
          <span>© MCMLXXII–MMXXVI</span>
          <p>
            The Institute for Lexical Equivalence is fictional. Its confidence
            is not.
          </p>
        </div>
      </footer>
    </div>
  )
}
