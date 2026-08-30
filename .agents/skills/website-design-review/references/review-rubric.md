# Website Design Review Rubric

Use this rubric to inspect the whole experience. Record concrete evidence and affected routes; do not assign scores merely to fill a matrix.

## Product expression

- The visual language fits the audience, subject, and trust level.
- Brand colors and semantic colors have stable meanings.
- The interface feels deliberate rather than template-derived.
- Educational or technical content remains accurate and legible.

## Information architecture and hierarchy

- Each route has one clear purpose and primary action.
- Headings form a meaningful hierarchy; page titles, introductions, controls, and results appear in a natural reading order.
- Navigation labels and active states are unambiguous.
- Related information is grouped, while separate concepts are visually distinct.
- Long pages expose progress and maintain orientation without excessive repetition.

## Layout and responsive behavior

- Content width, alignment, gutters, and vertical rhythm are consistent across routes.
- Layouts adapt intentionally rather than merely shrinking.
- At 390 pixels, controls remain reachable, labels remain readable, and no page-level horizontal overflow occurs.
- Dense data wraps safely without destroying scanability; intentional local scrolling is clearly bounded.
- Touch targets and spacing prevent accidental activation.

## Typography and content

- Type scale, weights, and line heights create clear hierarchy.
- Body copy has comfortable line length and spacing.
- Monospace is reserved for data, code, identifiers, or values that benefit from it.
- Labels use readable size and contrast; uppercase and letter spacing are restrained.
- Copy is concise, specific, and consistent in terminology.

## Color, surfaces, and depth

- Text and controls meet WCAG 2.2 AA contrast expectations in normal, hover, focus, disabled, error, and selected states.
- Surface levels are distinguishable without relying on borders everywhere.
- Accent colors communicate meaning rather than decoration.
- Shadows, gradients, radii, and borders follow a consistent system.

## Interaction and feedback

- Buttons, links, tabs, inputs, selectors, and clickable data look interactive before hover.
- Primary, secondary, destructive, informational, and disabled actions are visually distinct.
- Hover, active, focus, loading, empty, error, success, and completion states are designed coherently.
- Motion clarifies change, respects `prefers-reduced-motion`, and never blocks use.
- Interactive state remains understandable without color alone.

## Accessibility and resilience

- Landmarks, headings, labels, tab semantics, dialogs, status messages, and live regions match the visual interface.
- Keyboard order follows visual order; focus is never lost or hidden.
- The interface remains usable at browser zoom and with longer text.
- Images and icons have appropriate alternatives; decorative visuals stay out of the accessibility tree.
- Error messages explain what happened and how to recover.

## Consistency and maintainability

- Shared patterns use shared components or tokens.
- Similar elements behave and look alike across routes.
- CSS avoids unexplained one-off values, excessive specificity, and duplicate responsive rules.
- Improvements do not weaken tests, performance, semantic markup, or product behavior.

## Prioritization

Classify findings by impact:

- **Critical:** blocks access, comprehension, navigation, or task completion.
- **High:** recurring hierarchy, contrast, responsive, or interaction problem affecting major routes.
- **Medium:** localized inconsistency or friction with a clear user cost.
- **Low:** polish that strengthens coherence after higher-impact work is complete.

Address widespread root causes before isolated symptoms. A smaller set of well-verified systemic improvements is better than broad visual churn.
