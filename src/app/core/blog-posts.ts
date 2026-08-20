export interface BlogSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export interface BlogPostEntry {
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  readonly summary: string;
  readonly publishedDate: string;
  readonly publishedLabel: string;
  readonly readingTime: string;
  readonly sections: readonly BlogSection[];
}

const publication = {
  publishedDate: '2026-08-20',
  publishedLabel: 'August 20, 2026',
} as const;

export const BLOG_POSTS: readonly BlogPostEntry[] = Object.freeze([
  {
    ...publication,
    slug: 'why-bitcoin-math-lab',
    category: 'Project',
    title: 'Why Bitcoin Math Lab?',
    summary:
      'Bitcoin becomes more approachable when its bytes, stacks, and validation decisions can be inspected instead of merely described.',
    readingTime: '5 min read',
    sections: [
      {
        heading: 'The gap between a diagram and an execution',
        paragraphs: [
          'Bitcoin education often jumps from a friendly conceptual diagram to source code, serialized bytes, or a block explorer. Each view is useful, but the decisions between them remain difficult to follow. A learner may know that a signature is checked without seeing which stack values reached that check or why the result was accepted.',
          'Bitcoin Math Lab is an inspection layer for that missing middle. It presents the actual data and execution state in a form that can be paused, stepped backward, and compared. The goal is not to remove technical detail. It is to introduce detail at the moment it becomes meaningful.',
        ],
      },
      {
        heading: 'A narrow first lesson',
        paragraphs: [
          'The first public lab follows one historical pay-to-public-key-hash spend. P2PKH is small enough to understand in one sitting, yet it still connects serialized pushes, public-key hashing, equality verification, and signature validation.',
          'The lesson includes both the valid transaction and a copy with one signature byte changed. Comparing those executions makes failure concrete: the script structure is unchanged, but the authorization result is not.',
        ],
      },
      {
        heading: 'Educational software, explicit boundaries',
        paragraphs: [
          'The lab does not hold keys, broadcast transactions, or provide financial advice. Curated data lets the first experience remain deterministic and safe while the engine, API, and browser contract mature.',
          'Later releases can add real transaction lookup and broader script coverage. They should earn that breadth by keeping the first experience correct, accessible, and useful.',
        ],
      },
    ],
  },
  {
    ...publication,
    slug: 'why-build-bitclone',
    category: 'Engineering',
    title: 'Why build Bitclone?',
    summary:
      'A reusable Bitcoin engine gives educational products inspectable execution without confusing a learning tool with a production node.',
    readingTime: '6 min read',
    sections: [
      {
        heading: 'The product should not own consensus logic',
        paragraphs: [
          'A browser lesson needs carefully shaped explanations and controls, but Bitcoin serialization and Script execution do not belong in an Angular component or an HTTP handler. Keeping those rules in a reusable engine prevents the presentation layer from becoming a second, untested implementation.',
          'Bitclone owns the mechanisms: transaction structures, Script operations, execution context, stack behavior, and immutable trace records. The backend translates a versioned product request into an engine call. The frontend only renders the returned contract.',
        ],
      },
      {
        heading: 'Tracing without changing normal execution',
        paragraphs: [
          'The trace path is opt-in. When tracing is enabled, Bitclone records each executed opcode, its serialized byte range, and the main and alternate stacks before and after the operation. Normal execution remains available without paying the tracing cost.',
          'Immutable snapshots matter because a visualizer must be able to move backward. Retaining references to mutable stack objects would make every recorded step appear to contain the final state.',
        ],
      },
      {
        heading: 'Not a replacement for Bitcoin Core',
        paragraphs: [
          'Bitclone is a focused, testable engine for education and analysis. Bitcoin Core remains the production source of truth for validation and network behavior.',
          'That distinction is part of the architecture, not a disclaimer added later. Future support for real transactions should compare selected behavior with Bitcoin Core and surface the limits of the educational implementation clearly.',
        ],
      },
    ],
  },
  {
    ...publication,
    slug: 'inside-script-visualizer',
    category: 'Product',
    title: 'Inside the Script Visualizer',
    summary:
      'The visualizer connects each opcode to its bytes, its stack transition, and a learner-focused explanation without hiding failure states.',
    readingTime: '6 min read',
    sections: [
      {
        heading: 'One selected step, several synchronized views',
        paragraphs: [
          'An execution step is more than an opcode name. The visualizer highlights the exact bytes that encode the operation, shows the before and after state of both stacks, and places the step on a complete timeline.',
          'These views share one selected index. Previous, next, reset, direct timeline selection, autoplay, and keyboard commands all update the same state, which keeps the interface predictable.',
        ],
      },
      {
        heading: 'Lessons before arbitrary input',
        paragraphs: [
          'The first release uses curated examples because a blank script editor asks a beginner to supply context before the product has taught it. The P2PK introduction explains the direct public-key pattern; the successful P2PKH lesson adds the identity check; the failing lesson changes a single signature byte.',
          'Every live lesson is executed by the API. The invalid example is not a prewritten animation: it returns a normal failed trace with a safe diagnostic from the same engine path.',
        ],
      },
      {
        heading: 'Reliability is part of the interface',
        paragraphs: [
          'Loading, API failure, retry, and superseded lesson requests are explicit states. Keyboard controls and supported mobile layouts are covered in a real browser, not inferred from component markup alone.',
          'CI also checks out the frontend, backend, and Bitclone repositories together and drives valid and invalid lessons through the live local stack. That contract test makes cross-repository drift visible before deployment.',
        ],
      },
    ],
  },
  {
    ...publication,
    slug: 'from-one-trace-to-a-platform',
    category: 'Direction',
    title: 'From one trace to a Bitcoin learning platform',
    summary:
      'The roadmap grows from a reliable P2PKH lesson toward real transactions, broader scripts, professional tools, and only then commercial features.',
    readingTime: '5 min read',
    sections: [
      {
        heading: 'Depth creates the foundation for breadth',
        paragraphs: [
          'The first milestone deliberately avoids a long feature checklist. A complete P2PKH experience exercises the engine trace, versioned API, visual state, explanations, accessibility, deployment, and monitoring boundaries that later labs will reuse.',
          'Once that path is reliable in production, real transaction retrieval can supply execution context. Standard P2SH, SegWit, and Taproot templates can then expand the library without requiring a different product architecture.',
        ],
      },
      {
        heading: 'Learning tools and professional tools can share an engine',
        paragraphs: [
          'Guided lessons and a professional Script workspace need different interfaces, but both benefit from the same deterministic execution records. A future studio can add editable scripts, witnesses, stack history, diagnostics, exports, and shareable links on top of the trace contract.',
          'Keeping that engine independent also leaves room for developer utilities, transaction analysis, and research workflows that do not need the public learning interface.',
        ],
      },
      {
        heading: 'Commercial features come after demonstrated value',
        paragraphs: [
          'Accounts, billing, and paid plans are later milestones. The immediate measure of progress is whether someone can use the lab to understand a Bitcoin mechanism more clearly than before.',
          'Building in public makes that standard observable. Releases, tests, documentation, and honest scope boundaries provide stronger evidence than a list of future promises.',
        ],
      },
    ],
  },
]);

export function findBlogPost(slug: string | null): BlogPostEntry | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
