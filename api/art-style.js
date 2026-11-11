// Shared art style template (Stage 3). Every image sent to the image API must use this.
// Used by api/fight.js: build each prompt with buildImagePrompt(), never inline style text.

const ART_STYLE_TEMPLATE = `Psychedelic ancient Chinese art fusion: a traditional ink-brush style figure with flowing silk robes and long ribbons, rendered in vivid neon psychedelic colors of electric magenta, acid green, cobalt blue and molten gold, with iridescent gradients and swirling kaleidoscopic patterns woven into the robes and ribbons, dreamlike glowing outlines, dynamic battle pose. Keep it centered, filling most of the frame, isolated on a plain solid light grey background with no scenery. The psychedelic patterns stay on the figure and ribbons only; the background stays flat and empty. Absolutely no text, words, letters, numbers, logos, watermarks, UI elements, borders, or frames of any kind. No mandalas, no halos, no decorative pattern borders, no clouds. Illustration only, nothing else on canvas.`;

// Group inputs (e.g. "10 cows") must still yield exactly one image per side.
function buildImagePrompt(fighter) {
  return `A single image depicting this fighter: ${JSON.stringify(fighter)}. If it names a group or multiple things, show them together as one single composed illustration, not separate panels. ${ART_STYLE_TEMPLATE}`;
}

module.exports = { ART_STYLE_TEMPLATE, buildImagePrompt };
