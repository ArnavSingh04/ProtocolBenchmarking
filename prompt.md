# Communication Protocol Benchmarking Tool — Production-Quality Polish

## Role

Act as a senior full-stack engineer, QA engineer, and product designer responsible for turning this existing communication protocol benchmarking project into a polished, reliable, resume-worthy application.

Do not treat this as a greenfield rebuild. First understand the existing repository, architecture, user flows, benchmarking logic, and intended functionality. Then improve the application while preserving its core purpose and avoiding unnecessary scope expansion.

The final product should feel credible enough to demonstrate during interviews with large engineering organisations and include on a software engineering resume.

---

## Primary Objective

Evolve the project from a functional academic/general project into a polished application by:

1. Finding and fixing existing bugs.
2. Testing all important workflows end to end.
3. Improving usability, responsiveness, accessibility, visual consistency, and overall product quality.
4. Making benchmarking progress and results clear, trustworthy, and easy to interpret.
5. Improving developer quality, documentation, error handling, and maintainability where reasonably necessary.
6. Preserving the existing benchmarking scope rather than adding numerous new protocols, scenarios, or complex technical capabilities.

You have autonomy to identify additional improvements after inspecting the codebase and running the application.

Do not ask me to manually explain every feature. Infer intended behaviour from the repository, UI, documentation, data models, routes, APIs, and existing tests.

---

# Important Constraints

## Do not introduce major scope expansion

Do not add:

- Large numbers of new protocols.
- Large numbers of new test scenarios.
- Entirely new benchmarking engines.
- Distributed infrastructure.
- Authentication unless the current application genuinely requires it.
- AI-generated recommendations.
- Unnecessary microservices.
- A complete framework rewrite.
- Large architectural changes that provide little visible or functional benefit.
- Complex features unrelated to the existing product.

Minor supporting changes are acceptable when they improve reliability, usability, testing, or presentation.

## Preserve the existing product

The application currently appears to contain functionality such as:

- Configuring a benchmark test.
- Naming tests.
- Prioritising and weighting quality attributes.
- Selecting protocols such as MQTT, HTTP, WebSocket, and CoAP.
- Selecting network or load scenarios.
- Configuring protocol endpoints.
- Starting benchmark executions.
- Viewing live progress and execution logs.
- Viewing test history.
- Viewing calculated metrics and protocol rankings.
- Displaying recommendations and charts.
- Downloading reports.

Verify the actual functionality from the codebase rather than assuming this list is exhaustive.

## Avoid overengineering

- Reuse the existing stack and conventions.
- Prefer focused refactoring over rewriting.
- Do not add dependencies unless they provide clear value.
- Use the existing test framework where practical.
- Keep abstractions appropriate to the application's current size.
- Do not replace functioning code solely to use a newer library.

---

# Required Working Process

## Phase 1: Repository and Application Audit

Before implementing changes:

1. Read the README, package files, environment examples, source structure, tests, API routes, database models, configuration files, and deployment configuration.
2. Determine the current frontend and backend stack.
3. Identify all routes and major user workflows.
4. Identify how protocol tests are executed and how metrics are calculated.
5. Determine whether results are real, simulated, partially mocked, or dependent on external endpoints.
6. Run the application locally.
7. Run all existing tests, linters, type checks, and build commands.
8. Inspect browser console errors, server errors, failed network requests, warnings, layout issues, and broken interactions.
9. Test the application at desktop, tablet, and mobile widths.
10. Review the supplied screenshots as an initial visual reference, but treat the running application and repository as the source of truth.

Create an internal prioritised audit containing:

- Functional bugs.
- Data or calculation bugs.
- Broken or misleading visualisations.
- UI and UX problems.
- Responsive layout problems.
- Accessibility problems.
- Missing validation.
- Missing loading, empty, success, and error states.
- Testing gaps.
- Documentation problems.
- Maintainability issues.
- Security or configuration concerns that can be fixed without expanding scope.

Do not stop after producing the audit. Continue and implement the improvements.

---

# Functional Reliability

Systematically verify and repair all major flows.

## Test configuration

Check that:

- Test names behave correctly when provided or omitted.
- Attribute weights are initialised correctly.
- Reordering attributes works reliably.
- Weight sliders and numeric inputs remain synchronised.
- Values cannot become invalid, negative, `NaN`, or exceed their intended bounds.
- Floating-point rounding does not incorrectly prevent a valid total.
- The total weight clearly indicates valid and invalid states.
- Tests cannot start when the configuration is invalid.
- Keyboard users can operate the controls.
- Selected protocols and scenarios are visually and programmatically clear.
- At least the required number of protocols and scenarios is enforced.
- Endpoint fields are validated appropriately.
- Optional endpoint fields and default behaviour are explained clearly.
- Saved settings are loaded predictably.
- Invalid saved settings do not break the page.
- Environment variable names are not exposed unnecessarily.
- Sensitive values are never written to client logs or downloaded reports.

## Benchmark execution

Check that:

- Starting a test creates exactly one execution.
- Repeated clicks do not create duplicate runs.
- Loading and disabled states are shown immediately.
- The correct protocols and scenarios are passed to the backend.
- Progress accurately reflects the execution state.
- Individual protocol failures do not silently produce misleading results.
- Network errors, malformed responses, timeouts, and unavailable endpoints produce useful messages.
- Errors do not leave the application permanently stuck in a running state.
- Completion state is only shown when the intended work has completed.
- Timestamps and durations are correct.
- Refreshing or navigating during a test behaves predictably.
- Execution logs appear in the correct order.
- Auto-scroll works without making manual log inspection frustrating.
- Log entries use consistent severity and status labels.
- Console and server logs do not contain avoidable errors.

Do not fake successful benchmark results to hide failures.

## History

Check that:

- Completed and failed tests appear correctly.
- History entries show useful identifying information.
- Entries link to the correct progress or results page.
- Refreshing the history page does not lose valid data unexpectedly.
- Empty history has a useful empty state.
- Long names, dates, and lists do not break the layout.
- Deleting or rerunning tests should only be added if it already exists or can be supported with very small scope. Do not introduce it as a major new feature.

## Results and reporting

Check that:

- Results match the execution that was selected.
- Protocol metrics are mapped to the correct protocol.
- Rankings are deterministic and logically correct.
- Fitness scores use the configured attribute weights.
- Metrics where lower is better, such as latency or jitter, are handled correctly.
- Metrics where higher is better, such as reliability or throughput, are handled correctly.
- Missing metrics do not silently become zero unless zero is genuinely correct.
- The recommendation text corresponds to the actual score and result.
- A failed protocol is not ranked as a valid winner.
- Units are consistent throughout the application.
- Decimal precision is sensible and consistent.
- Single-protocol results are not presented as a meaningful comparison without explanation.
- A one-point latency trend does not display as a misleading trend line.
- Downloaded reports contain the correct test configuration, metrics, units, dates, rankings, and recommendations.
- Report download works across supported browsers.
- Generated reports have a professional filename and layout.

Inspect the scoring and normalisation implementation carefully. Do not change formulas simply for visual polish, but fix demonstrable correctness problems.

---

# Data Visualisation Improvements

The current charts should be reviewed for correctness as well as appearance.

In particular:

- Avoid placing latency, throughput, reliability, and jitter on one raw shared numerical axis when their units and scales are incompatible.
- Use grouped metric cards, separate charts, normalised values, or clearly separated axes where appropriate.
- Always display units.
- Add readable tooltips.
- Use consistent protocol colours across all charts.
- Ensure chart colours work in light and dark themes.
- Ensure legends are readable and do not overlap content.
- Make charts responsive.
- Handle one protocol, two protocols, and several protocols gracefully.
- Handle no data, partial data, failed tests, and identical values.
- Do not show a fake line when only one data point exists.
- Ensure radar chart values represent meaningful, correctly normalised metrics rather than placeholder or arbitrary values.
- Explain normalised scores where necessary.
- Avoid charts when a compact table or metric comparison is more understandable.
- Add accessible textual summaries so the results are not dependent entirely on colour or graphics.

Visual polish must not make the results less technically honest.

---

# UI and UX Redesign

Improve the existing visual design without making the application look like a generic template.

## Design direction

Aim for:

- Professional engineering-tool aesthetics.
- Clear hierarchy.
- Strong readability.
- Restrained use of colour.
- Consistent spacing and component styling.
- Useful information density.
- Modern but not overly decorative visuals.
- A design suitable for a technical portfolio demonstration.

Create or consolidate design tokens for:

- Backgrounds.
- Surfaces.
- Borders.
- Text colours.
- Muted text.
- Primary actions.
- Success, warning, and error states.
- Border radius.
- Shadows.
- Spacing.
- Typography.
- Chart colours.

Avoid scattered hardcoded styling.

## Light and dark mode

Add a polished theme system containing:

- Light mode.
- Dark mode.
- System preference mode where practical.
- A clear theme toggle.
- Persisted user preference.
- No theme flash during initial loading where the stack permits it.
- Accessible contrast in both themes.
- Dark-mode support for forms, tables, cards, logs, charts, tooltips, dropdowns, dialogs, and reports where applicable.

Do not implement dark mode as simple colour inversion.

## Navigation

Improve the main navigation by:

- Making the active page clear.
- Ensuring all navigation links work.
- Making the navigation responsive.
- Providing a suitable mobile menu.
- Keeping naming consistent between links, headings, and buttons.
- Avoiding confusing transitions between configuration, progress, history, and results.
- Ensuring completed tests provide clear actions to view results or run another test.

## Configuration page

The configuration screen currently contains substantial vertical content. Improve it through:

- Better section grouping.
- Clearer summaries of current selections.
- More compact but readable attribute controls.
- Better drag handles and reorder affordances.
- Clear validation messages.
- Sticky or repeated test-summary/action areas where useful.
- Better protocol and scenario cards.
- Clear selected, hover, focus, disabled, and error states.
- Improved endpoint configuration guidance.
- Responsive layouts that do not require awkward horizontal scrolling.
- A visible explanation of how weights affect final scoring.
- Preventing the main action from being overlooked at the bottom of a long page.

A lightweight stepper or progressive disclosure may be introduced only if it simplifies the existing process without making the workflow slower or substantially more complex.

## Live progress page

Improve:

- Overall progress presentation.
- Protocol-specific status.
- Running, completed, failed, and pending states.
- Live metric readability.
- Execution log filtering or visual grouping where it can be added simply.
- Scroll behaviour.
- Status timestamps.
- Responsiveness.
- The transition from completed execution to results.

Avoid showing empty chart containers before meaningful data exists.

## Results page

Improve:

- Test configuration summary.
- Winner or ranking presentation.
- Fitness score explanation.
- Recommendation language.
- Comparison tables.
- Chart hierarchy.
- Spacing and excessive empty areas.
- Actions such as download report, view history, and run another test.
- Layout for single-protocol results.
- Layout for long test names and multiple protocols.
- Clear differentiation between raw metrics and normalised scores.

The page should help a viewer answer:

1. Which protocol performed best?
2. Why did it perform best?
3. Under which scenario and configuration?
4. What trade-offs were observed?
5. How confident should the viewer be in the result?

## General interface states

Provide polished states for:

- Initial loading.
- Section loading.
- No tests.
- No results.
- Partial results.
- Network failure.
- Validation failure.
- Protocol failure.
- Successful completion.
- Report generation.
- Unexpected errors.

Use inline messages for recoverable problems and larger error states only when the page cannot continue.

---

# Responsive Design

Test and improve at least:

- Small mobile width.
- Larger mobile width.
- Tablet width.
- Standard laptop width.
- Wide desktop width.

Verify:

- Navigation.
- Form fields.
- Sliders.
- Reorder controls.
- Cards.
- Logs.
- Tables.
- Charts.
- Buttons.
- Dialogs.
- Long labels.
- Test names.
- Protocol and scenario grids.

There should be no clipped content, accidental horizontal scrolling, unreadable charts, overlapping labels, or excessively narrow interaction targets.

---

# Accessibility

Target practical WCAG 2.1 AA quality.

Improve:

- Semantic headings.
- Labels and descriptions for form controls.
- Keyboard navigation.
- Visible focus indicators.
- Contrast.
- Button and link semantics.
- Error association with relevant inputs.
- Screen-reader announcements for progress and status changes.
- Alternatives to colour-only status communication.
- Accessible names for icon buttons.
- Reduced-motion support.
- Touch target sizes.
- Chart summaries and table-based metric alternatives.

Do not remove native semantics merely to obtain a certain visual style.

---

# Testing Strategy

Build a useful test suite that protects the important behaviour without creating excessive test maintenance.

## Existing tests

- Run all current tests.
- Repair tests that fail because of genuine application bugs.
- Remove or rewrite tests only when they are invalid or test obsolete behaviour.
- Do not weaken assertions just to make the suite pass.

## Unit tests

Add or strengthen tests for high-risk logic such as:

- Weight totals and normalisation.
- Attribute ordering.
- Fitness score calculation.
- Higher-is-better and lower-is-better metrics.
- Missing or invalid metrics.
- Protocol ranking.
- Recommendation thresholds.
- Duration and timestamp formatting.
- Result transformation.
- Validation rules.
- Report data generation.

Use representative edge cases.

## Integration tests

Test:

- Frontend requests to benchmark APIs.
- Benchmark execution state transitions.
- Successful protocol results.
- Partial protocol failure.
- Complete execution failure.
- Invalid endpoint responses.
- Results retrieval.
- History persistence.
- Report generation.

Mock external protocol services at the integration boundary where needed so the test suite is repeatable.

## End-to-end tests

Use the existing browser-testing framework. If none exists, introduce one lightweight, well-supported framework compatible with the project, preferably Playwright unless another framework is already clearly more appropriate.

Cover at minimum:

### Flow 1: Successful benchmark

1. Open configuration.
2. Enter a test name.
3. Configure valid weights.
4. Select protocols.
5. Select a scenario.
6. Start the benchmark.
7. Observe progress.
8. Reach completion.
9. Open results.
10. Verify metrics, rankings, charts, and report action.

### Flow 2: Validation

1. Attempt to start with an invalid total.
2. Attempt to start without required selections.
3. Enter invalid endpoint values.
4. Verify understandable errors and disabled states.

### Flow 3: Failure handling

1. Simulate an unavailable or failing protocol endpoint.
2. Confirm the test does not remain stuck.
3. Confirm failure is communicated.
4. Confirm valid completed data remains available where applicable.
5. Confirm results do not rank failed data misleadingly.

### Flow 4: History

1. Complete a test.
2. Navigate to history.
3. Open the corresponding execution.
4. Confirm the correct configuration and results are displayed.

### Flow 5: Theme and responsive UI

1. Switch between light and dark modes.
2. Reload and verify persistence.
3. Test key pages at mobile and desktop viewport sizes.
4. Check that major interactions remain usable.

Use deterministic mocks or local test services for E2E tests instead of depending entirely on public third-party endpoints.

---

# Technical Quality

Improve technical quality where it supports reliability and maintainability:

- Fix TypeScript errors where TypeScript is used.
- Remove obvious dead code and unused imports.
- Resolve avoidable console warnings.
- Standardise error handling.
- Introduce reusable components for genuinely repeated patterns.
- Centralise metric labels, directions, units, and formatting.
- Centralise protocol and scenario metadata where appropriate.
- Avoid duplicated scoring logic between frontend and backend.
- Validate API inputs at the server boundary.
- Ensure unexpected backend errors return safe, structured responses.
- Avoid exposing stack traces to normal users.
- Ensure timers, listeners, sockets, and subscriptions are cleaned up.
- Prevent race conditions in progress updates.
- Ensure identifiers and route parameters are validated.
- Use environment configuration safely.
- Add an `.env.example` containing placeholders only.
- Keep development, test, and production behaviour clearly separated.
- Replace stale hardcoded footer years with a dynamic year where appropriate.

Do not perform large refactors unless the existing implementation prevents reliable fixes.

---

# Documentation and Portfolio Readiness

Improve the README so another engineer or recruiter can understand the project quickly.

Include:

- A concise project overview.
- The problem being solved.
- Supported protocols and scenarios.
- How the benchmarking process works at a high level.
- How quality attribute weights affect rankings.
- Architecture overview.
- Technology stack.
- Local setup instructions.
- Environment variable documentation.
- How to run tests.
- How to run E2E tests.
- How to build and deploy.
- Known limitations.
- Explanation of whether each protocol test is real, simulated, or dependent on external services.
- Screenshots or a concise demo section if existing assets are available.
- A brief section explaining important engineering decisions.

Do not make claims the implementation cannot support.

Add a small “Demo walkthrough” that lets someone evaluate the project quickly.

---

# Product Quality Decisions

You are encouraged to identify improvements not listed here, provided they:

- Improve the existing product.
- Do not substantially expand its core benchmarking scope.
- Are backed by an observed problem.
- Do not add unnecessary complexity.
- Make the application more reliable, understandable, or presentable.

Examples of acceptable autonomous improvements include:

- Better test summaries.
- Improved metric explanations.
- Better loading skeletons.
- Helpful tooltips.
- Consistent status badges.
- More readable tables.
- Improved report styling.
- Better empty states.
- A concise first-use explanation.
- A lightweight demo configuration.
- Better mobile behaviour.
- Clearer terminology.
- Improved animation and transition quality.
- Reduced visual clutter.
- More useful error recovery.

Do not add features merely because they are common in SaaS applications.

---

# Definition of Done

The work is complete only when:

- The application builds successfully.
- Linting and type checking pass.
- Existing valid tests pass.
- New tests cover important calculations and workflows.
- Core E2E flows pass consistently.
- There are no obvious console errors during standard usage.
- Configuration validation works.
- Progress accurately represents test execution.
- Failure states do not leave tests stuck.
- Results correspond to the executed configuration.
- Rankings and recommendations are logically correct.
- Reports download successfully and contain correct data.
- Charts are responsive, readable, and not misleading.
- Light and dark modes are complete.
- Major pages work on mobile and desktop.
- Keyboard navigation and focus states are usable.
- Loading, empty, success, and error states are polished.
- The README accurately explains setup, architecture, testing, and limitations.
- The application appears consistent and professional across configuration, history, live progress, and results.
- The project remains recognisably the same communication protocol benchmarking product rather than becoming an unrelated rebuild.

---

# Final Output

After implementation, provide:

1. A concise summary of the audit findings.
2. A list of bugs fixed.
3. A list of UI and UX improvements.
4. A list of calculation or visualisation corrections.
5. A list of tests added or updated.
6. Commands used to verify the application.
7. Final build, lint, type-check, unit-test, integration-test, and E2E-test results.
8. Any remaining limitations or externally dependent tests.
9. A list of important files changed.
10. A brief suggested demonstration flow for showing the project to recruiters.

Do not report something as completed unless it was implemented and verified.

Begin by inspecting the complete repository and running the existing application. Then create a prioritised plan and proceed with implementation without waiting for approval unless a change would destroy data, require paid infrastructure, or fundamentally alter the product.
