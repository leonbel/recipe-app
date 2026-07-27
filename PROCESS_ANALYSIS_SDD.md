# Recipe App Delivery Process vs. Spec-Driven Development

## Executive Assessment

The project has followed a **strongly iterative, user-reviewed delivery process** with several Spec-Driven Development (SDD) characteristics, but it has not been fully SDD end to end. The most accurate description is **incremental, test-aware, AI-assisted product delivery with partial specifications**.

> **Spec-Driven Development** treats an agreed, executable specification as the primary source of truth. Code, tests, interfaces, and delivery checks are derived from that specification rather than allowing implementation details or ad hoc fixes to become the de facto contract.

The staged request sequence—foundation, authentication, capture, generation, and deployment repair—has created useful decision points. The main difference from strict SDD is that the project’s specifications have generally lived in conversation, task plans, component code, and tests rather than in durable, feature-level specification files that precede implementation.

| Dimension | Observed approach | Alignment with SDD | Assessment |
|---|---|---:|---|
| Product direction | A detailed original feature brief and explicit staged sequence | High | The intended user experience was defined early and refined deliberately. |
| Feature slicing | Work proceeded in reviewable steps: foundation, auth, capture, AI integration | High | This is an effective incremental delivery pattern and is compatible with SDD. |
| Acceptance criteria | Many requirements were expressed as capabilities rather than testable outcomes | Medium | Requirements were clear, but explicit pass/fail conditions were often added during implementation. |
| Data/API contract | Recipe JSON schema, Zod validation, and prompt structure were formalized before the endpoint | High | This is the closest part of the project to strict SDD. |
| UI behavior contract | Screens were designed and visually reviewed, but interaction/state specifications were informal | Medium | The UI is well-directed, although behavior matrices were not maintained as a formal artifact. |
| Testing | Unit, contract, build, and responsive visual checks were added throughout | High | Testing was treated as implementation work rather than a final polish stage. |
| Deployment assumptions | Vercel/serverless constraints emerged after deployment | Low to Medium | A hosting specification should have preceded backend implementation. |
| Failure behavior | Gemini quota failure was addressed reactively through a fallback | Medium | The final fallback is specified and tested, but degradation behavior should have been defined up front. |

## What Was Done Well

The project benefited from an explicit **vertical-slice order**. Each step produced a demonstrable capability and paused for review, which kept design decisions close to user feedback. That is especially useful in a product such as this one, where interaction quality matters as much as backend correctness.

The strongest SDD practice appeared in recipe generation. The response model was made explicit through a strict JSON schema, runtime validation, a fixed model contract, prompt rules, and tests for valid and invalid payloads. This prevented the generated output from becoming an untyped, fragile dependency for later recipe results, detail, and cooking experiences.

The process also showed healthy **contract hardening**. Authentication routes, session redirects, capture options, Vercel endpoints, fallback payloads, and client parsing were progressively covered by tests. The deployment fallback is particularly important: the mock response matches the same recipe contract as live Gemini output, so UI work can proceed without creating a second data shape.

## Where It Diverged from Strict SDD

The principal divergence was that the original brief did not become a maintained source-of-truth specification set. Instead, the working contract was distributed across the conversation, `todo.md`, implementation code, prompt strings, schemas, and test files. That remains workable, but it makes it easier for requirements to drift—for example, the initial health-goal labels and time filters differed from the later exact brief.

Hosting was another reactive point. The backend was initially implemented around the existing Express/tRPC runtime, then converted once Vercel revealed that the deployed static client could not run that server. In a strict SDD process, the deployment target, endpoint surface, runtime limitations, build command, output directory, and error-response contract would be part of the architecture specification before the generation endpoint was built.

Finally, the mock fallback was introduced after the Gemini quota blocked testing. It is a pragmatic and correct delivery decision, but strict SDD would define the degraded-service behavior in advance: what triggers it, whether it is visible to users, what data contract it obeys, how it is tested, and how it is removed or monitored once live generation is stable.

## Recommended Operating Model for the Remaining Steps

Before beginning each remaining feature, create a short feature specification in `specs/<feature>.md`. The specification should be reviewed before code changes and should remain the authoritative reference after implementation.

| Section | Required content | Example for recipe results |
|---|---|---|
| Objective and scope | User outcome, inclusions, and explicit exclusions | Show 4–6 generated recipes; defer detailed cooking controls. |
| Inputs and state | Data contract, loading, empty, error, guest, and signed-in states | `RecipeGenerationResponse`; fallback and live source behave identically. |
| UI contract | Layout, responsive behavior, accessibility, visual treatment | Frosted cards, image loading state, keyboard-accessible detail link. |
| API contract | Request, response, errors, status codes, and ownership | `POST /api/recipes` always returns the shared recipe schema for generation attempts. |
| Acceptance criteria | Testable Given/When/Then statements | Given a valid response, when results load, then cards are score-sorted and actionable. |
| Test matrix | Unit, contract, integration, and visual checks | Schema test, API test, browser flow, desktop/mobile screenshot. |
| Deployment notes | Environment variables, runtime constraints, observability | Vercel function timeout, Gemini quota behavior, fallback policy. |

For each feature, use this sequence:

1. **Write and approve the specification.** Include acceptance criteria and a decision on guest versus signed-in access.
2. **Derive the data and API contracts.** Prefer shared Zod schemas and version them when changes are breaking.
3. **Build against tests derived from the acceptance criteria.** Keep network-dependent tests separately labeled so a temporary DNS or provider issue does not obscure local regression results.
4. **Verify the deployment behavior before considering the feature complete.** Test the actual Vercel route, serverless environment, and graceful-degradation path.
5. **Record decisions that affect later work.** Small architecture decision records are enough for hosting, AI fallback, authentication, and persistence choices.

## Immediate Next Specification: Recipe Results

The next feature should start with a **Recipe Results Specification** rather than immediately adding cards. It should define how live and fallback recipe payloads are rendered, the exact Pollinations.ai image URL policy, card sort order, image loading/failure state, navigation to recipe detail, accessible labels, and what guest users can do. It should also state whether the UI may disclose that the data is a fallback fixture; the current server contract intentionally keeps that transparent, so the product decision should be explicit before results UI expands.

## Conclusion

The project is **closer to SDD than a typical ad hoc build**, particularly in its staged reviews, shared schemas, validation, and growing contract-test coverage. It is not yet fully SDD because specifications have not consistently preceded implementation or served as durable artifacts, and deployment/fallback requirements were discovered after the fact.

The highest-leverage improvement is simple: turn every remaining step into a brief, accepted feature spec with explicit state tables and acceptance tests before coding. That preserves the project’s successful iterative rhythm while making future behavior, deployment constraints, and AI degradation rules predictable rather than reactive.
