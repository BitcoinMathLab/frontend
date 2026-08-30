---
name: website-design-review
description: Review and improve an entire website's visual design, responsive behavior, interaction clarity, accessibility, and cross-page consistency. Use for comprehensive design audits or implementation passes across multiple routes; do not trigger for isolated component styling or purely functional frontend changes.
---

# Website Design Review

Produce a cohesive site-level result, not a collection of disconnected cosmetic edits.

## Establish the brief

- Read every applicable `AGENTS.md`, the route table, shared layout, global styles, and existing design documentation.
- Preserve explicit product language, semantic color assignments, domain accuracy, and established user workflows.
- Treat the user's request as authorization to edit only when they ask to adjust, improve, redesign, or implement. For review-only requests, report findings without changing files.
- Inventory all public routes and meaningful states before judging individual screens. Include loading, empty, error, success, modal, keyboard-focus, and dense-data states where they exist.
- Read [references/review-rubric.md](references/review-rubric.md) before conducting the audit.

## Build an evidence-based baseline

- Run the site and inspect every public route at a representative desktop viewport and 390 pixels wide. Use real application states when locally available and deterministic mocks when external services are unavailable.
- Capture screenshots when they help compare routes or verify responsive changes. Inspect rendered output directly; do not infer visual quality from templates and styles alone.
- Check document-level overflow, content clipping, focus visibility, keyboard order, reduced motion, contrast, readable line length, target sizing, and zoom resilience.
- Identify shared causes before route-level symptoms: tokens, typography, content width, spacing rhythm, surface hierarchy, navigation, buttons, forms, status treatments, and reusable panels.

## Choose the design direction

- State a concise design thesis grounded in the product's audience and existing brand. Extend the current visual language unless the user explicitly requests a rebrand.
- Rank findings by user impact and recurrence. Fix systemic issues before isolated polish.
- Prefer a small, coherent token and component system over one-off values. Reuse existing components and selectors when they express the intended semantics.
- Preserve information architecture and functional behavior unless a design defect cannot be solved without changing them. Flag material scope changes instead of silently making them.
- Avoid generic redesign tropes: excessive gradients, gratuitous glass effects, decoration without hierarchy, tiny low-contrast labels, oversized hero areas, animation that delays comprehension, or card containers around every element.

## Implement in coherent passes

When implementation is authorized:

1. Improve shared foundations and shell elements.
2. Align route-level hierarchy, spacing, and responsive composition.
3. Refine interactive states and dense technical content.
4. Remove obsolete or duplicated styling made unnecessary by the new system.

Keep the site usable throughout. Preserve semantic HTML, Angular behavior, tests, and URL structure. Use CSS/HTML for native interface visuals; introduce bitmap assets only when imagery materially improves the product.

## Verify the result

- Revisit every route and audited state at desktop and 390-pixel widths. Compare against the baseline and correct regressions.
- Exercise keyboard navigation, visible focus, reduced motion, form validation, dialogs, and interactive walkthrough controls.
- Run affected unit tests, formatting checks, a production build, and the complete relevant Playwright suite.
- Add or strengthen assertions for cross-route consistency and responsive invariants when they protect the design improvement.
- Report the implemented design direction, high-impact changes, validation evidence, and any state that could not be exercised. Do not claim improvement based only on passing tests.
