/**
 * Per-person chart colors, keyed by position in the people list.
 * ember-600 / moss-400 pass the CVD-safe separation check (protan ΔE 9.6, deutan wider);
 * ink-500 is a spare third slot since the app only ever seeds two people today.
 */
export const PERSON_COLORS = ['#953619', '#54844C', '#524B3D'];

/** Research-informed weekly set range for muscle growth (see MEV/MAV volume-landmark literature). */
export const VOLUME_TARGET_MIN = 8;
export const VOLUME_TARGET_MAX = 20;
