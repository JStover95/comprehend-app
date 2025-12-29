/**
 * Test ID constants for all components
 *
 * Following the Test ID Pattern from design-docs/testing/unit-testing.md
 * All test IDs are defined here to ensure consistency and prevent typos.
 */

/**
 * Test IDs for Button component
 */
export const BUTTON_IDS = {
  CONTAINER: "button-container",
  TEXT: "button-text",
  LOADING: "button-loading",
} as const;

/**
 * Test IDs for Input component
 */
export const INPUT_IDS = {
  CONTAINER: "input-container",
  FIELD: "input-field",
  LABEL: "input-label",
  ERROR: "input-error",
  HELPER_TEXT: "input-helper-text",
} as const;

/**
 * Test IDs for Text component
 */
export const TEXT_IDS = {
  CONTAINER: "text-container",
  CONTENT: "text-content",
} as const;

// Freeze all objects to prevent modification
Object.freeze(BUTTON_IDS);
Object.freeze(INPUT_IDS);
Object.freeze(TEXT_IDS);
