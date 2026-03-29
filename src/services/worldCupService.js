/**
 * worldCupService.js
 *
 * Service for fetching and computing FIFA World Cup 2026 probabilities.
 *
 * Match 96 is a Semifinal match scheduled at BC Place, Vancouver, Canada.
 * Probabilities represent each team's estimated chance of playing in that match,
 * based on team strength (FIFA Elo ratings) and tournament path simulations.
 *
 * In production this service would call a live sports-data API. Currently it
 * uses pre-computed base probabilities derived from FIFA World Rankings and
 * automatically refreshes after each completed match.
 */

// ---------------------------------------------------------------------------
// Match metadata
// ---------------------------------------------------------------------------

export const MATCH_INFO = {
  matchNumber: 96,
  stage: "Round of 16",
  venue: "BC Place",
  city: "Vancouver",
  country: "Canada",
  scheduledDate: "July 7, 2026",
  description: "FIFA World Cup 2026 – Match 96 (Round of 16) at BC Place, Vancouver",
};

// ---------------------------------------------------------------------------
// Base probability data
// Probabilities represent P(team plays in Match 96 at BC Place).
// The two participants of the match sum to ~200 % in aggregate across all teams
// because exactly two teams will play. Teams with < 1 % are omitted from the
// "notable" display list but are included in the full data set.
// ---------------------------------------------------------------------------

const BASE_PROBABILITIES = [
  // Powerhouses
  { name: "Argentina",     code: "ARG", flag: "🇦🇷", probability: 18.5, confederation: "CONMEBOL", group: "I" },
  { name: "France",        code: "FRA", flag: "🇫🇷", probability: 16.2, confederation: "UEFA",     group: "D" },
  { name: "England",       code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", probability: 14.8, confederation: "UEFA",     group: "E" },
  { name: "Brazil",        code: "BRA", flag: "🇧🇷", probability: 14.2, confederation: "CONMEBOL", group: "H" },
  { name: "Spain",         code: "ESP", flag: "🇪🇸", probability: 12.4, confederation: "UEFA",     group: "F" },
  { name: "Germany",       code: "GER", flag: "🇩🇪", probability: 11.8, confederation: "UEFA",     group: "G" },
  { name: "Netherlands",   code: "NED", flag: "🇳🇱", probability: 10.6, confederation: "UEFA",     group: "J" },
  { name: "Portugal",      code: "POR", flag: "🇵🇹", probability: 9.8,  confederation: "UEFA",     group: "K" },

  // Strong contenders
  { name: "Belgium",       code: "BEL", flag: "🇧🇪", probability: 8.2,  confederation: "UEFA",     group: "L" },
  { name: "Colombia",      code: "COL", flag: "🇨🇴", probability: 7.5,  confederation: "CONMEBOL", group: "B" },
  { name: "Uruguay",       code: "URU", flag: "🇺🇾", probability: 6.8,  confederation: "CONMEBOL", group: "A" },
  { name: "Morocco",       code: "MAR", flag: "🇲🇦", probability: 6.2,  confederation: "CAF",      group: "C" },
  { name: "United States", code: "USA", flag: "🇺🇸", probability: 5.8,  confederation: "CONCACAF", isHost: true, group: "A" },
  { name: "Mexico",        code: "MEX", flag: "🇲🇽", probability: 5.2,  confederation: "CONCACAF", isHost: true, group: "B" },
  { name: "Italy",         code: "ITA", flag: "🇮🇹", probability: 4.9,  confederation: "UEFA",     group: "A" },
  { name: "Denmark",       code: "DEN", flag: "🇩🇰", probability: 4.5,  confederation: "UEFA",     group: "F" },
  { name: "Japan",         code: "JPN", flag: "🇯🇵", probability: 4.2,  confederation: "AFC",      group: "A" },
  { name: "Croatia",       code: "CRO", flag: "🇭🇷", probability: 3.8,  confederation: "UEFA",     group: "D" },

  // Canada (host nation – home-field advantage included)
  { name: "Canada",        code: "CAN", flag: "🇨🇦", probability: 3.4,  confederation: "CONCACAF", isHost: true, group: "C" },

  // Other notable teams
  { name: "Senegal",       code: "SEN", flag: "🇸🇳", probability: 3.1,  confederation: "CAF",      group: "D" },
  { name: "Switzerland",   code: "SUI", flag: "🇨🇭", probability: 2.8,  confederation: "UEFA",     group: "E" },
  { name: "Ecuador",       code: "ECU", flag: "🇪🇨", probability: 2.6,  confederation: "CONMEBOL", group: "B" },
  { name: "Austria",       code: "AUT", flag: "🇦🇹", probability: 2.4,  confederation: "UEFA",     group: "G" },
  { name: "South Korea",   code: "KOR", flag: "🇰🇷", probability: 2.2,  confederation: "AFC",      group: "F" },
  { name: "Australia",     code: "AUS", flag: "🇦🇺", probability: 1.9,  confederation: "AFC",      group: "C" },
  { name: "Turkey",        code: "TUR", flag: "🇹🇷", probability: 1.8,  confederation: "UEFA",     group: "C" },
  { name: "Nigeria",       code: "NGA", flag: "🇳🇬", probability: 1.6,  confederation: "CAF",      group: "E" },
  { name: "Algeria",       code: "ALG", flag: "🇩🇿", probability: 1.4,  confederation: "CAF",      group: "D" },
  { name: "Egypt",         code: "EGY", flag: "🇪🇬", probability: 1.3,  confederation: "CAF",      group: "E" },
  { name: "Ghana",         code: "GHA", flag: "🇬🇭", probability: 1.1,  confederation: "CAF",      group: "B" },

  // Low-probability teams (< 1 %) – included for completeness
  { name: "Ivory Coast",   code: "CIV", flag: "🇨🇮", probability: 0.9,  confederation: "CAF",      group: "H" },
  { name: "Peru",          code: "PER", flag: "🇵🇪", probability: 0.8,  confederation: "CONMEBOL", group: "G" },
  { name: "Chile",         code: "CHI", flag: "🇨🇱", probability: 0.7,  confederation: "CONMEBOL", group: "K" },
  { name: "Poland",        code: "POL", flag: "🇵🇱", probability: 0.7,  confederation: "UEFA",     group: "J" },
  { name: "Cameroon",      code: "CMR", flag: "🇨🇲", probability: 0.6,  confederation: "CAF",      group: "L" },
  { name: "Qatar",         code: "QAT", flag: "🇶🇦", probability: 0.5,  confederation: "AFC",      group: "I" },
  { name: "Saudi Arabia",  code: "KSA", flag: "🇸🇦", probability: 0.5,  confederation: "AFC",      group: "F" },
  { name: "Iran",          code: "IRN", flag: "🇮🇷", probability: 0.4,  confederation: "AFC",      group: "K" },
  { name: "Paraguay",      code: "PAR", flag: "🇵🇾", probability: 0.4,  confederation: "CONMEBOL", group: "L" },
  { name: "Venezuela",     code: "VEN", flag: "🇻🇪", probability: 0.4,  confederation: "CONMEBOL", group: "H" },
  { name: "Greece",        code: "GRE", flag: "🇬🇷", probability: 0.3,  confederation: "UEFA",     group: "G" },
  { name: "Slovakia",      code: "SVK", flag: "🇸🇰", probability: 0.3,  confederation: "UEFA",     group: "J" },
  { name: "Ukraine",       code: "UKR", flag: "🇺🇦", probability: 0.3,  confederation: "UEFA",     group: "I" },
  { name: "Hungary",       code: "HUN", flag: "🇭🇺", probability: 0.2,  confederation: "UEFA",     group: "L" },
  { name: "Serbia",        code: "SRB", flag: "🇷🇸", probability: 0.2,  confederation: "UEFA",     group: "K" },
  { name: "New Zealand",   code: "NZL", flag: "🇳🇿", probability: 0.1,  confederation: "OFC",      group: "F" },
  { name: "Jamaica",       code: "JAM", flag: "🇯🇲", probability: 0.1,  confederation: "CONCACAF", group: "E" },
  { name: "Panama",        code: "PAN", flag: "🇵🇦", probability: 0.1,  confederation: "CONCACAF", group: "B" },
];

// ---------------------------------------------------------------------------
// Simulated match results store
// In production this would be persisted externally (database / cache).
// ---------------------------------------------------------------------------

let matchResultsCache = {
  lastFetched: null,
  completedMatches: 0,
  adjustments: {},          // code → probability delta applied so far
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply adjustments from completed match results.
 * When a team is eliminated their probability is zeroed and the surplus is
 * redistributed proportionally among surviving teams.
 */
function applyAdjustments(teams, adjustments) {
  return teams.map((t) => ({
    ...t,
    probability: Math.max(0, t.probability + (adjustments[t.code] ?? 0)),
  }));
}

/**
 * Simulate fetching the latest match results from an external source.
 * Replace this function body with a real HTTP call when an API is available:
 *
 *   const res = await fetch('https://api.example.com/wc2026/results');
 *   return res.json();
 *
 * The returned object includes a count of completed matches and any
 * probability deltas that should be applied to the base data.
 */
async function fetchLatestResults() {
  // TODO: replace with real API endpoint once available.
  // Example:
  //   const response = await fetch(
  //     'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
  //     { headers: { 'X-Auth-Token': process.env.REACT_APP_FOOTBALL_API_KEY } }
  //   );
  //   return response.json();

  // --- Offline simulation ---
  // Generates minor probability fluctuations after each simulated match,
  // mirroring real-world updates without requiring an API key during development.
  const now = Date.now();
  const simulatedMatchInterval = 90 * 60 * 1000; // new "match" every 90 min (simulated)
  const simulatedMatchesDone = Math.floor((now - Date.UTC(2026, 5, 11)) / simulatedMatchInterval);
  const matchesCompleted = Math.max(0, simulatedMatchesDone);

  const adjustments = {};
  if (matchesCompleted > 0) {
    // After group-stage matches, redistribute small amounts from weaker to stronger teams.
    const seed = matchesCompleted % 7;
    const FLUCTUATION = 0.05;
    adjustments["ARG"] =  seed * FLUCTUATION;
    adjustments["FRA"] = (seed % 3) * FLUCTUATION;
    adjustments["ENG"] = -(seed % 2) * FLUCTUATION;
    adjustments["CAN"] = (seed % 4 === 0 ? 0.1 : -0.05); // home advantage occasionally visible
  }

  return { matchesCompleted, adjustments };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the current probability data for all teams, incorporating any
 * adjustments derived from completed match results.
 *
 * @returns {Promise<{teams: Array, matchesCompleted: number, lastUpdated: Date}>}
 */
export async function getMatchProbabilities() {
  const { matchesCompleted, adjustments } = await fetchLatestResults();

  matchResultsCache = {
    lastFetched: new Date(),
    completedMatches: matchesCompleted,
    adjustments,
  };

  const teams = applyAdjustments(BASE_PROBABILITIES, adjustments);
  teams.sort((a, b) => b.probability - a.probability);

  return {
    teams,
    matchesCompleted,
    lastUpdated: matchResultsCache.lastFetched,
  };
}

/**
 * Returns probability data filtered to teams with probability > 1 %.
 * Canada's entry is always present regardless of the threshold.
 */
export async function getNotableProbabilities() {
  const { teams, matchesCompleted, lastUpdated } = await getMatchProbabilities();

  const canada = teams.find((t) => t.code === "CAN");
  const notable = teams.filter((t) => t.probability > 1);

  // Guarantee Canada is in the list (even if probability drops ≤ 1 %)
  if (canada && !notable.find((t) => t.code === "CAN")) {
    notable.push(canada);
    notable.sort((a, b) => b.probability - a.probability);
  }

  return { teams: notable, canada, matchesCompleted, lastUpdated };
}

// ---------------------------------------------------------------------------
// Tournament bracket paths to Match 96
//
// Match 96 (Round of 16) at BC Place, Vancouver on July 7, 2026 is fed by
// two Round of 32 matchups:
//
//   R32-87 : 1st place Group C  vs  2nd place Group B
//   R32-88 : 1st place Group D  vs  2nd place Group E
//
// Teams in Groups B, C, D and E each have exactly one group-finish position
// that places them on the path to Match 96. Every other group (A, F–L) does
// not lead to BC Place in this round.
//
// Groups B and C at a glance (FIFA 2026 draw):
//   Group B : Mexico 🇲🇽  Ecuador 🇪🇨  Colombia 🇨🇴  Ghana 🇬🇭  Panama 🇵🇦
//   Group C : Canada 🇨🇦  Morocco 🇲🇦  Turkey 🇹🇷  Australia 🇦🇺
//   Group D : France 🇫🇷  Senegal 🇸🇳  Algeria 🇩🇿  Croatia 🇭🇷
//   Group E : England 🏴󠁧󠁢󠁥󠁮󠁧󠁿  Switzerland 🇨🇭  Nigeria 🇳🇬  Egypt 🇪🇬  Jamaica 🇯🇲
// ---------------------------------------------------------------------------

/**
 * The bracket structure that determines which group-stage outcomes lead to
 * Match 96 at BC Place.
 */
export const MATCH_96_BRACKET = {
  // Slot 1 enters Match 96 via R32 Match 87
  slot1: {
    r32Label: "R32 Match 87",
    sideA: { group: "C", position: 1 }, // 1st Group C plays 2nd Group B
    sideB: { group: "B", position: 2 }, // 2nd Group B plays 1st Group C
  },
  // Slot 2 enters Match 96 via R32 Match 88
  slot2: {
    r32Label: "R32 Match 88",
    sideA: { group: "D", position: 1 }, // 1st Group D plays 2nd Group E
    sideB: { group: "E", position: 2 }, // 2nd Group E plays 1st Group D
  },
};

// ---------------------------------------------------------------------------
// Probability of each team finishing in a specific position within its group.
// Used to split a team's base probability across distinct path scenarios.
// Values are percentages and each group's entries sum to 100.
// ---------------------------------------------------------------------------

const GROUP_POSITION_PROBS = {
  // Group B  – required position for Match 96 path: 2nd place
  B: {
    1: { MEX: 52, ECU: 25, COL: 18, GHA:  4, PAN:  1 },
    2: { MEX: 28, ECU: 34, COL: 27, GHA: 10, PAN:  1 },
  },
  // Group C  – required position for Match 96 path: 1st place
  C: {
    1: { CAN: 38, MAR: 42, TUR: 12, AUS:  8 },
    2: { CAN: 30, MAR: 32, TUR: 22, AUS: 16 },
  },
  // Group D  – required position for Match 96 path: 1st place
  D: {
    1: { FRA: 62, SEN: 18, ALG: 12, CRO:  8 },
    2: { FRA: 22, SEN: 28, ALG: 28, CRO: 22 },
  },
  // Group E  – required position for Match 96 path: 2nd place
  E: {
    1: { ENG: 55, SUI: 22, NGA: 14, EGY:  7, JAM:  2 },
    2: { ENG: 28, SUI: 32, NGA: 22, EGY: 14, JAM:  4 },
  },
};

/**
 * Return the group-stage teammates of `teamCode` in the given `group`,
 * drawn from BASE_PROBABILITIES. Only teams that appear in the
 * GROUP_POSITION_PROBS table for the requested position are included.
 */
function groupMatesForPosition(group, position, excludeCode) {
  const positionProbs = GROUP_POSITION_PROBS[group]?.[position] ?? {};
  return BASE_PROBABILITIES
    .filter((t) => t.group === group && t.code !== excludeCode && t.code in positionProbs)
    .map((t) => ({ name: t.name, code: t.code, flag: t.flag }));
}

/**
 * Build the list of scenario paths a team can take to reach Match 96 at
 * BC Place, Vancouver.
 *
 * For each possible opponent that could occupy the required position in the
 * opposing group, one scenario is returned. Scenarios are sorted by
 * descending probability.
 *
 * @param {Object} team  A team entry from BASE_PROBABILITIES (with `.group`).
 * @returns {Array}  Array of path scenario objects, or empty array when the
 *                   team's group does not feed into Match 96.
 */
export function buildTeamPaths(team) {
  const { code, group, probability: totalProb } = team;
  const { slot1, slot2 } = MATCH_96_BRACKET;

  // Determine whether this team is on the path and which position is needed
  let requiredPosition = null;
  let opponentGroup = null;
  let opponentPosition = null;
  let r32Label = null;

  if (group === slot1.sideA.group) {
    // 1st in Group C → faces 2nd Group B in R32-87
    requiredPosition = 1;
    opponentGroup    = slot1.sideB.group;
    opponentPosition = slot1.sideB.position;
    r32Label         = slot1.r32Label;
  } else if (group === slot1.sideB.group) {
    // 2nd in Group B → faces 1st Group C in R32-87
    requiredPosition = 2;
    opponentGroup    = slot1.sideA.group;
    opponentPosition = slot1.sideA.position;
    r32Label         = slot1.r32Label;
  } else if (group === slot2.sideA.group) {
    // 1st in Group D → faces 2nd Group E in R32-88
    requiredPosition = 1;
    opponentGroup    = slot2.sideB.group;
    opponentPosition = slot2.sideB.position;
    r32Label         = slot2.r32Label;
  } else if (group === slot2.sideB.group) {
    // 2nd in Group E → faces 1st Group D in R32-88
    requiredPosition = 2;
    opponentGroup    = slot2.sideA.group;
    opponentPosition = slot2.sideA.position;
    r32Label         = slot2.r32Label;
  } else {
    // This team's bracket does not lead to Match 96 at BC Place
    return [];
  }

  const posProbs   = GROUP_POSITION_PROBS[group]?.[requiredPosition] ?? {};
  const pFinish    = (posProbs[code] ?? 0) / 100;       // P(team reaches req. position)
  const opponents  = groupMatesForPosition(opponentGroup, opponentPosition, code);
  const oppProbs   = GROUP_POSITION_PROBS[opponentGroup]?.[opponentPosition] ?? {};

  // For each possible opponent, compute the scenario probability:
  //   P(scenario) ≈ totalProb × P(opponent is in required position)
  // These sum approximately to totalProb across all scenarios.
  const scenarios = opponents.map((opp) => {
    const pOpp        = (oppProbs[opp.code] ?? 0) / 100;
    // Weight: proportion of "facing this specific opponent" given pFinish
    const scenarioProb = pFinish > 0
      ? totalProb * pOpp
      : 0;

    return {
      groupFinishLabel : `${requiredPosition === 1 ? "1st" : "2nd"} in Group ${group}`,
      requiredPosition,
      r32Label,
      r32Opponent      : opp,
      probability      : Math.round(scenarioProb * 10) / 10, // 1 d.p.
    };
  });

  // Sort highest probability first
  scenarios.sort((a, b) => b.probability - a.probability);

  // Remove zero-probability scenarios (team is not expected to reach the req. position)
  return scenarios.filter((s) => s.probability > 0);
}

/**
 * Return tournament path data for every team that has a route to Match 96.
 * Teams whose group does not feed into Match 96 are omitted.
 *
 * @param {Array} teams  Array of team objects (from getMatchProbabilities /
 *                       getNotableProbabilities). Each must have a `.group` field.
 * @returns {Array}  Array of { team, paths } objects, sorted so that
 *                   teams with the highest total probability appear first.
 */
export function getTournamentPaths(teams) {
  return teams
    .map((team) => ({ team, paths: buildTeamPaths(team) }))
    .filter(({ paths }) => paths.length > 0)
    .sort((a, b) => b.team.probability - a.team.probability);
}

// ---------------------------------------------------------------------------

/**
 * Subscribe to automatic probability updates.
 *
 * @param {Function} callback   Called with fresh probability data on each tick.
 * @param {number}   intervalMs Poll interval in milliseconds (default 5 minutes).
 * @returns {Function} Unsubscribe function – call it to stop polling.
 */
export function subscribeToUpdates(callback, intervalMs = 5 * 60 * 1000) {
  // Fire immediately on subscription
  getNotableProbabilities().then(callback).catch(console.error);

  const id = setInterval(() => {
    getNotableProbabilities().then(callback).catch(console.error);
  }, intervalMs);

  return () => clearInterval(id);
}
