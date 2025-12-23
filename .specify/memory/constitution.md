<!--
## Sync Impact Report

**Version Change**: 0.0.0 → 1.0.0 (MAJOR: Initial constitution creation)

**Added Principles**:
- I. Testing-First (NON-NEGOTIABLE)
- II. Accessibility-First (NON-NEGOTIABLE for user-facing)
- III. Modular Architecture
- IV. Design Doc Adherence
- V. Type Safety

**Added Sections**:
- Project Scope (cdk/, comprehend/)
- Definition of Done (quality gates)
- Governance (amendment process, versioning policy)

**Removed Sections**: None (initial creation)

**Templates Review**:
- ✅ plan-template.md - Constitution Check section aligns with principles
- ✅ spec-template.md - User scenarios section supports testing and accessibility requirements
- ✅ tasks-template.md - Test phases align with Testing-First principle

**Follow-up TODOs**: None
-->

# Comprehend App Constitution

This constitution governs all contributions to the Comprehend reading comprehension application, encompassing both the backend infrastructure (`cdk/`) and the mobile application (`comprehend/`).

## Project Scope

| Component | Location | Technology | Primary Concerns |
|-----------|----------|------------|------------------|
| Backend/Infrastructure | `cdk/` | AWS CDK, TypeScript, Lambda | Reliability, testability, observability |
| Mobile Application | `comprehend/` | React Native, Expo, TypeScript | Accessibility, testability, user experience |

## Core Principles

### I. Testing-First (NON-NEGOTIABLE)

**Tests are written in parallel with features, not as a separate phase.**

Every unit of work MUST include its tests before merge. This is not optional—untested code is incomplete code.

**Requirements:**

- Unit tests MUST accompany all new functionality
- Test coverage MUST meet minimum threshold (>80% for critical paths)
- Integration tests MUST cover cross-component interactions
- Tests MUST be independent and repeatable
- Mock strategies MUST follow project patterns:
  - `cdk/`: Factory pattern for I/O, AWS SDK mocking with LocalStack support
  - `comprehend/`: Mock providers for contexts, mock factories for services

**Testing Documentation:**

- Backend: Follow patterns in `cdk/docs/testing/`
- Frontend: Follow patterns in `comprehend/docs/testing/`

**Rationale:** Testing ensures reliability, enables confident refactoring, and documents expected behavior. Code without tests creates technical debt that compounds over time.

### II. Accessibility-First (NON-NEGOTIABLE for User-Facing Features)

**Accessibility MUST be incorporated from the start of every design and development phase—not as an afterthought.**

All user-facing components in `comprehend/` MUST meet WCAG 2.1 Level AA compliance.

**Requirements:**

- Color contrast: 4.5:1 minimum for normal text, 3:1 for large text and UI components
- Touch targets: 44x44 points minimum for all interactive elements
- Screen reader support: VoiceOver (iOS) and TalkBack (Android) compatibility
- Keyboard navigation: Full functionality without touch
- Focus management: Clear visual indicators and logical focus order
- Alternative text: Proper descriptions for images and icons
- Motion: Respect reduced motion preferences

**Mandatory Reading:** `comprehend/docs/accessibility.md` before any UI work.

**Rationale:** Accessibility is a legal requirement in many jurisdictions, expands user reach, and improves overall UX for all users. Retrofitting accessibility is significantly more expensive than building it in from the start.

### III. Modular Architecture

**Code MUST be organized into self-contained, independently testable modules with clear boundaries.**

**Requirements:**

- Single Responsibility: Each module, class, or function has one clear purpose
- Dependency Injection: Dependencies are injected, not instantiated internally
- Clear Interfaces: Public APIs are well-defined with TypeScript types
- Loose Coupling: Modules communicate through defined contracts, not implementation details
- High Cohesion: Related functionality is grouped together

**Backend (`cdk/`):**

- Follow Agent Pattern: Handler → Agent → Provider separation
- Providers wrap external services (AWS SDK, database)
- Agents orchestrate business logic
- Handlers manage Lambda entry/exit concerns

**Frontend (`comprehend/`):**

- Follow Context Pattern: Context → Provider → Hook separation
- UI components are presentational where possible
- Business logic lives in contexts and services
- Components are reusable and composable

**Rationale:** Modular architecture enables parallel development, simplifies testing, reduces merge conflicts, and makes the codebase navigable for new contributors.

### IV. Design Doc Adherence

**All contributions MUST follow the patterns and guidelines in the respective project's design documentation.**

**Backend (`cdk/docs/`):**

- `agent-pattern.md` - Lambda function structure
- `types-and-configuration.md` - Type definitions and clientConfig pattern
- `testing/` - All testing patterns including LocalStack, mocking, and integration tests

**Frontend (`comprehend/docs/`):**

- `accessibility.md` - Accessibility requirements (NON-NEGOTIABLE)
- `context-pattern.md` - State management patterns
- `component-architecture.md` - Component organization
- `navigation-pattern.md` - Expo Router file-based routing
- `api-integration.md` - Backend API calls
- `styling-pattern.md` - StyleSheet and theming
- `testing/` - All testing patterns including mocking and best practices

**Requirements:**

- Read relevant design docs BEFORE implementing features
- Follow established patterns; do not invent new patterns without justification
- Update design docs when patterns evolve (with team review)

**Rationale:** Consistent patterns reduce cognitive load, accelerate onboarding, and prevent fragmentation of approaches across the codebase.

### V. Type Safety

**All code MUST use TypeScript with strict typing. No `any` types without explicit justification.**

**Requirements:**

- Enable `strict` mode in TypeScript configuration
- Define explicit types for function parameters and return values
- Use interfaces for data structures and contracts
- Use type guards for runtime type checking when necessary
- Document complex types with JSDoc comments

**Prohibited:**

- Implicit `any` (enable `noImplicitAny`)
- Type assertions without safety checks (`as unknown as T`)
- Suppressing TypeScript errors without documented reason

**Rationale:** Strong typing catches errors at compile time, improves IDE support, and serves as living documentation for data structures and function contracts.

## Definition of Done

A unit of work is complete when ALL of the following are satisfied:

| Gate | Backend (`cdk/`) | Frontend (`comprehend/`) |
|------|------------------|--------------------------|
| Implementation | ✅ Feature complete | ✅ Feature complete |
| Unit Tests | ✅ Tests pass (>80% coverage) | ✅ Tests pass (>80% coverage) |
| Integration Tests | ✅ Where applicable | ✅ Where applicable |
| Linting | ✅ ESLint passes | ✅ ESLint passes |
| Type Check | ✅ TypeScript compiles | ✅ TypeScript compiles |
| Documentation | ✅ Updated if patterns change | ✅ Updated if patterns change |
| Accessibility | N/A | ✅ WCAG 2.1 AA compliance |
| Screen Reader | N/A | ✅ VoiceOver/TalkBack tested |

## Governance

### Constitution Authority

This constitution supersedes all other development practices. When conflicts arise between this constitution and other documentation, this constitution takes precedence.

### Amendment Process

1. **Proposal**: Document proposed changes with rationale
2. **Review**: Changes require explicit approval before adoption
3. **Migration**: Breaking changes require a migration plan for existing code
4. **Version**: Update constitution version following semantic versioning

### Versioning Policy

- **MAJOR**: Backward-incompatible changes (principle removals, fundamental redefinitions)
- **MINOR**: New principles or sections added, material expansions
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

- All code reviews MUST verify compliance with these principles
- Complexity or pattern deviations MUST be justified in PR description
- Non-compliance MUST be resolved before merge

### Development Guidance

For day-to-day development guidance:

- Reference `DEVELOPMENT_PLAN.md` for project phases and dependencies
- Reference respective `docs/` directories for implementation patterns
- Use this constitution as the authority for "why" decisions

**Version**: 1.0.0 | **Ratified**: 2025-12-23 | **Last Amended**: 2025-12-23
