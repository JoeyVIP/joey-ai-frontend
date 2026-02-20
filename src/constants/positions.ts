/**
 * Position constants for office elements.
 *
 * All positions are in pixels relative to the canvas origin (top-left).
 * Canvas: 900 x 620, 3 desks, boss area below desks.
 *
 * Wall layout (left to right):
 *   Elevator | Whiteboard | City Window | Clock | Safety Sign | Water Cooler
 */

// ============================================================================
// WALL DECORATIONS
// ============================================================================

/** Whiteboard position (right of elevator door, top-left corner of 330x205 board) */
export const WHITEBOARD_POSITION = { x: 155, y: 15 };

/** City window position (after whiteboard) */
export const CITY_WINDOW_POSITION = { x: 500, y: 30 };

/** Wall clock position (after city window) */
export const WALL_CLOCK_POSITION = { x: 710, y: 80 };

/** Wall outlet position (below clock) */
export const WALL_OUTLET_POSITION = { x: 710, y: 209 };

/** Safety sign position */
export const SAFETY_SIGN_POSITION = { x: 830, y: 40 };

/** Water cooler position */
export const WATER_COOLER_POSITION = { x: 830, y: 200 };

/** Coffee machine position (to the right of water cooler) */
export const COFFEE_MACHINE_POSITION = { x: 875, y: 191 };

// ============================================================================
// FLOOR ELEMENTS
// ============================================================================

/** Printer station position (below boss area) */
export const PRINTER_STATION_POSITION = { x: 50, y: 575 };

/** Plant position (to the right of printer) */
export const PLANT_POSITION = { x: 118, y: 600 };

// ============================================================================
// BOSS AREA (moved up closer to desks)
// ============================================================================

/** Boss area rug position (centered under boss desk) */
export const BOSS_RUG_POSITION = { x: 500, y: 570 };

/** Trash can offset from boss desk position */
export const TRASH_CAN_OFFSET = { x: 110, y: 55 };
