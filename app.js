const gameList = document.querySelector("#gameList");
const isLocalServer = location.protocol.startsWith("http") && location.port === "5173";
const apiBase = isLocalServer ? "" : "http://3.36.54.178:8000";
let todayGames = [];
const detailCache = new Map();
const compareView = {
  team: "table",
  pitcher: "table",
};

const teamFallbackClass = {
  HT: "kia",
  LT: "lotte",
  KT: "kt",
  WO: "kiwoom",
  LG: "lg",
  HH: "hanwha",
  SK: "ssg",
  OB: "doosan",
  SS: "samsung",
  NC: "nc",
};

init();
window.addEventListener("hashchange", route);
gameList.addEventListener("click", handleGameListClick);
gameList.addEventListener("keydown", handleGameListKeydown);

async function init() {
  try {
    const response = await fetch(`${apiBase}/api/v1/kbo/games/today`);
    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    todayGames = data.games ?? [];
    route();
  } catch (error) {
    renderError(error);
  }
}

function route() {
  const gameId = getSelectedGameId();
  const game = todayGames.find((item) => item.kboGameId === gameId);

  if (game) {
    renderGameDetail(game);
    return;
  }

  renderGames(todayGames);
}

function getSelectedGameId() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  return hash.get("game");
}

function handleGameListClick(event) {
  const toggleButton = event.target.closest("[data-toggle-view]");
  if (toggleButton) {
    event.preventDefault();
    event.stopPropagation();
    compareView[toggleButton.dataset.toggleView] =
      compareView[toggleButton.dataset.toggleView] === "table" ? "chart" : "table";
    renderCachedDetail();
    return;
  }

  const backButton = event.target.closest("[data-action='back']");
  if (backButton) {
    history.pushState("", document.title, location.pathname + location.search);
    route();
    return;
  }

  const card = event.target.closest("[data-game-id]");
  if (card && card.dataset.canOpen === "true") {
    location.hash = `game=${encodeURIComponent(card.dataset.gameId)}`;
  }
}

function handleGameListKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const card = event.target.closest("[data-game-id]");
  if (card && card.dataset.canOpen === "true") {
    event.preventDefault();
    location.hash = `game=${encodeURIComponent(card.dataset.gameId)}`;
  }
}

function renderGames(games) {
  if (!games.length) {
    gameList.innerHTML = `<article class="state-card">오늘 예정된 KBO 경기가 없습니다.</article>`;
    return;
  }

  gameList.innerHTML = games.map(renderGameCard).join("");
}

function renderGameCard(game) {
  const awayTeam = game.awayTeam ?? {};
  const homeTeam = game.homeTeam ?? {};
  const awayPitcher = game.awayStartingPitcher ?? {};
  const homePitcher = game.homeStartingPitcher ?? {};
  const status = getGameStatus(game);
  const isFinal = game.gameState === "FINAL";
  const canOpenDetail = game.gameState === "SCHEDULED";

  return `
    <article
      class="game-card ${isFinal ? "final-card" : ""} ${canOpenDetail ? "is-openable" : "is-static"}"
      data-game-id="${escapeAttribute(game.kboGameId)}"
      data-can-open="${canOpenDetail ? "true" : "false"}"
      ${canOpenDetail ? 'role="button" tabindex="0"' : ""}
    >
      <div class="game-meta">
        <div class="meta-left">
          <span class="status-text ${status.className}">${escapeHtml(status.label)}</span>
          <span class="game-place-time">${escapeHtml(formatStadium(game.stadium))} · ${escapeHtml(game.gameTime ?? "-")}</span>
        </div>
      </div>
      ${
        isFinal
          ? renderFinalResult(game, awayTeam, homeTeam)
          : `
            <div class="matchup">
              ${renderTeam(awayTeam)}
              ${renderMatchCenter(game, false)}
              ${renderTeam(homeTeam)}
            </div>
            ${renderStartingPitchers(awayPitcher, homePitcher, awayTeam, homeTeam)}
          `
      }
    </article>
  `;
}

async function renderGameDetail(game) {
  const cached = detailCache.get(game.kboGameId);
  if (cached) {
    gameList.innerHTML = renderDetailView(
      cached.game,
      cached.awayTeam,
      cached.homeTeam,
      cached.awayPitcher,
      cached.homePitcher,
      cached.lineup,
    );
    return;
  }

  gameList.innerHTML = `<article class="state-card">경기 상세 정보를 불러오는 중입니다.</article>`;

  try {
    const [awayTeam, homeTeam] = await Promise.all([
      fetchTeam(game.awayTeam?.key),
      fetchTeam(game.homeTeam?.key),
    ]);
    const [awayPitcher, homePitcher] = await Promise.all([
      fetchPitcherDetail(game.awayStartingPitcher),
      fetchPitcherDetail(game.homeStartingPitcher),
    ]);
    const lineup = await fetchLineup(game.kboGameId);

    detailCache.set(game.kboGameId, {
      game,
      awayTeam,
      homeTeam,
      awayPitcher,
      homePitcher,
      lineup,
    });
    gameList.innerHTML = renderDetailView(game, awayTeam, homeTeam, awayPitcher, homePitcher, lineup);
  } catch (error) {
    gameList.innerHTML = `
      <article class="detail-page">
        <article class="state-card error">
          팀 정보를 불러오지 못했습니다.
          <small>${escapeHtml(error.message)}</small>
        </article>
      </article>
    `;
  }
}

function renderCachedDetail() {
  const gameId = getSelectedGameId();
  const cached = detailCache.get(gameId);
  if (!cached) {
    route();
    return;
  }

  gameList.innerHTML = renderDetailView(
    cached.game,
    cached.awayTeam,
    cached.homeTeam,
    cached.awayPitcher,
    cached.homePitcher,
    cached.lineup,
  );
}

async function fetchTeam(teamKey) {
  if (!teamKey) {
    throw new Error("팀 key가 없습니다.");
  }

  const response = await fetch(`${apiBase}/api/v1/kbo/teams/${encodeURIComponent(teamKey)}`);
  if (!response.ok) {
    throw new Error(`${teamKey} 팀 조회 실패: ${response.status}`);
  }

  return response.json();
}

async function fetchPitcherDetail(summary) {
  if (!summary?.key || !summary.name) {
    return summary ?? null;
  }

  try {
    const response = await fetch(`${apiBase}/api/v1/kbo/pitchers/${encodeURIComponent(summary.key)}`);
    if (!response.ok) {
      return summary;
    }

    return response.json();
  } catch {
    return summary;
  }
}

async function fetchLineup(gameId) {
  if (!gameId) {
    return null;
  }

  try {
    const response = await fetch(`${apiBase}/api/v1/kbo/games/${encodeURIComponent(gameId)}/lineup`);
    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

function renderDetailView(game, awayTeam, homeTeam, awayPitcher, homePitcher, lineup) {
  return `
    <article class="detail-page">
      <section class="compare-board team-board">
        ${renderSectionHeader("팀 비교", "team")}
        <div class="compare-teams">
          ${renderCompareTeamHeader(awayTeam)}
          <span>vs</span>
          ${renderCompareTeamHeader(homeTeam)}
        </div>
        ${renderTeamCompareBody(awayTeam, homeTeam)}
      </section>
      <section class="compare-board pitcher-board">
        ${renderSectionHeader("선발 투수", "pitcher")}
        <div class="compare-pitchers">
          ${renderComparePitcherHeader(awayPitcher, awayTeam)}
          <span>vs</span>
          ${renderComparePitcherHeader(homePitcher, homeTeam)}
        </div>
        ${renderPitcherCompareBody(awayPitcher, homePitcher)}
      </section>
      ${renderLineupSection(lineup)}
    </article>
  `;
}

function renderLineupSection(lineup) {
  if (!lineup?.away?.players?.length && !lineup?.home?.players?.length) {
    return "";
  }

  const awayPlayers = lineup?.away?.players ?? [];
  const homePlayers = lineup?.home?.players ?? [];
  const maxRows = Math.max(awayPlayers.length, homePlayers.length);

  return `
    <section class="compare-board lineup-board">
      <div class="section-head">
        <div class="section-title">라인업</div>
      </div>
      <div class="lineup-teams">
        ${renderLineupTeamHeader(lineup.away?.team)}
        <span>vs</span>
        ${renderLineupTeamHeader(lineup.home?.team)}
      </div>
      <div class="lineup-rows">
        ${Array.from({ length: maxRows }, (_, index) =>
          renderLineupRow(awayPlayers[index], homePlayers[index], index + 1),
        ).join("")}
      </div>
    </section>
  `;
}

function renderLineupTeamHeader(team) {
  return `
    <div class="lineup-team">
      ${renderLogo(team ?? {})}
      <strong>${escapeHtml(team?.name ?? "-")}</strong>
    </div>
  `;
}

function renderLineupRow(awayPlayer, homePlayer, order) {
  return `
    <div class="lineup-row">
      ${renderLineupPlayer(awayPlayer)}
      <span class="lineup-order">${escapeHtml(order)}</span>
      ${renderLineupPlayer(homePlayer)}
    </div>
  `;
}

function renderLineupPlayer(player) {
  if (!player) {
    return `<div class="lineup-player empty-lineup">-</div>`;
  }

  return `
    <div class="lineup-player">
      <strong>${escapeHtml(player.playerName ?? "-")}</strong>
      <span>${escapeHtml(player.positionName ?? "-")}${renderLineupAverage(player.battingAverage)}</span>
    </div>
  `;
}

function renderLineupAverage(battingAverage) {
  if (battingAverage == null) {
    return "";
  }

  return ` · 타율 ${escapeHtml(formatNumber(battingAverage, 3))}`;
}

function renderSectionHeader(title, viewKey) {
  const isChart = compareView[viewKey] === "chart";
  const iconBars = isChart
    ? "<span></span><span></span><span></span><span></span>"
    : "<span></span><span></span><span></span>";

  return `
    <div class="section-head">
      <div class="section-title">${escapeHtml(title)}</div>
      <button
        type="button"
        class="view-toggle ${isChart ? "show-table" : "show-chart"}"
        data-toggle-view="${escapeAttribute(viewKey)}"
        aria-label="${escapeAttribute(isChart ? "표로 보기" : "그래프로 보기")}"
      >
        ${iconBars}
      </button>
    </div>
  `;
}

function renderTeamCompareBody(awayTeam, homeTeam) {
  const rows = getTeamCompareRows(awayTeam, homeTeam);

  if (compareView.team === "chart") {
    return renderCompareChart(rows.filter((row) => row.chartable));
  }

  return `<div class="compare-rows">${rows.map((row) => renderCompareRow(row.left, row.label, row.right, row.featured, row.betterSide)).join("")}</div>`;
}

function getTeamCompareRows(awayTeam, homeTeam) {
  return [
    buildCompareRow(formatNullable(awayTeam.rank, "위"), "순위", formatNullable(homeTeam.rank, "위"), "lower", true, true),
    { left: `${awayTeam.wins ?? "-"}승 ${awayTeam.draws ?? "-"}무 ${awayTeam.losses ?? "-"}패`, label: "전적", right: `${homeTeam.wins ?? "-"}승 ${homeTeam.draws ?? "-"}무 ${homeTeam.losses ?? "-"}패` },
    buildCompareRow(awayTeam.winningPercentage ?? "-", "승률", homeTeam.winningPercentage ?? "-", "higher", false, true),
    buildCompareRow(formatNumber(awayTeam.battingAverage, 3), "팀 타율", formatNumber(homeTeam.battingAverage, 3), "higher", false, true),
    buildCompareRow(formatNumber(awayTeam.era, 2), "팀 ERA", formatNumber(homeTeam.era, 2), "lower", false, true),
    buildCompareRow(formatNumber(awayTeam.whip, 2), "팀 WHIP", formatNumber(homeTeam.whip, 2), "lower", false, true),
    buildCompareRow(formatNumber(awayTeam.runsPerGame, 2), "평균 득점", formatNumber(homeTeam.runsPerGame, 2), "higher", false, true),
    buildCompareRow(formatNumber(awayTeam.runsAllowedPerGame, 2), "평균 실점", formatNumber(homeTeam.runsAllowedPerGame, 2), "lower", false, true),
    { left: awayTeam.last10Record ?? "-", label: "최근 10경기", right: homeTeam.last10Record ?? "-" },
    { left: awayTeam.streak ?? "-", label: "연속", right: homeTeam.streak ?? "-" },
  ];
}

function buildCompareRow(left, label, right, betterRule, featured = false, chartable = false) {
  return {
    left,
    label,
    right,
    featured,
    chartable,
    betterSide: getBetterSide(left, right, betterRule),
  };
}

function renderCompareTeamHeader(team) {
  return `
    <div class="compare-team">
      ${renderLogo(team)}
      <strong>${escapeHtml(team.name ?? "-")}</strong>
    </div>
  `;
}

function renderCompareRow(left, label, right, featured = false, betterSide = null) {
  return `
    <div class="compare-row ${featured ? "featured-row" : ""}">
      <strong class="${betterSide === "left" ? "better-value" : ""}">${escapeHtml(left)}</strong>
      <span>${escapeHtml(label)}</span>
      <strong class="${betterSide === "right" ? "better-value" : ""}">${escapeHtml(right)}</strong>
    </div>
  `;
}

function renderCompareChart(rows) {
  if (!rows.length) {
    return `<div class="state-card">그래프로 비교할 수 있는 항목이 없습니다.</div>`;
  }

  return `
    <div class="compare-chart">
      ${rows.map(renderChartRow).join("")}
    </div>
  `;
}

function renderChartRow(row) {
  const leftNumber = parseComparableNumber(row.left);
  const rightNumber = parseComparableNumber(row.right);
  const max = Math.max(leftNumber ?? 0, rightNumber ?? 0, 1);
  const leftWidth = leftNumber == null ? 0 : Math.max((leftNumber / max) * 100, 4);
  const rightWidth = rightNumber == null ? 0 : Math.max((rightNumber / max) * 100, 4);

  return `
    <div class="chart-row">
      <div class="chart-label">${escapeHtml(row.label)}</div>
      ${renderChartSide(row.left, leftWidth, row.betterSide === "left")}
      ${renderChartSide(row.right, rightWidth, row.betterSide === "right")}
    </div>
  `;
}

function renderChartSide(value, width, isBetter) {
  return `
    <div class="chart-side ${isBetter ? "better-chart" : ""}">
      <strong>${escapeHtml(value)}</strong>
      <span><i style="width: ${width}%"></i></span>
    </div>
  `;
}

function formatNullable(value, suffix) {
  return value == null ? "-" : `${value}${suffix}`;
}

function formatNumber(value, digits) {
  if (value == null || value === "") {
    return "-";
  }

  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : value;
}

function getBetterSide(left, right, rule) {
  if (!rule) {
    return null;
  }

  const leftNumber = parseComparableNumber(left);
  const rightNumber = parseComparableNumber(right);
  if (leftNumber == null || rightNumber == null || leftNumber === rightNumber) {
    return null;
  }

  if (rule === "lower") {
    return leftNumber < rightNumber ? "left" : "right";
  }

  return leftNumber > rightNumber ? "left" : "right";
}

function parseComparableNumber(value) {
  if (value == null || value === "-") {
    return null;
  }

  const match = String(value).match(/-?\d+(\.\d+)?/);
  if (!match) {
    return null;
  }

  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
}

function renderComparePitcherHeader(pitcher, team) {
  const name = pitcher?.name ?? "미정";

  return `
    <div class="compare-pitcher">
      ${renderPlayerPhoto(pitcher ?? {}, name, "")}
      <strong>${escapeHtml(name)}</strong>
    </div>
  `;
}

function renderPitcherCompareRows(awayPitcher, homePitcher) {
  return getPitcherCompareRows(awayPitcher, homePitcher)
    .map((row) => renderCompareRow(row.left, row.label, row.right, row.featured, row.betterSide))
    .join("");
}

function renderPitcherCompareBody(awayPitcher, homePitcher) {
  const rows = getPitcherCompareRows(awayPitcher, homePitcher);

  if (compareView.pitcher === "chart") {
    return renderCompareChart(rows.filter((row) => row.chartable));
  }

  return `<div class="compare-rows">${rows.map((row) => renderCompareRow(row.left, row.label, row.right, row.featured, row.betterSide)).join("")}</div>`;
}

function getPitcherCompareRows(awayPitcher, homePitcher) {
  return [
    buildCompareRow(getPitcherValue(awayPitcher, "era"), "ERA", getPitcherValue(homePitcher, "era"), "lower", true, true),
    { left: getPitcherRecord(awayPitcher), label: "승패", right: getPitcherRecord(homePitcher) },
    buildCompareRow(getPitcherStatValue(awayPitcher, "WHIP"), "WHIP", getPitcherStatValue(homePitcher, "WHIP"), "lower", false, true),
    buildCompareRow(getPitcherStatValue(awayPitcher, "IP"), "이닝", getPitcherStatValue(homePitcher, "IP"), "higher", false, true),
    buildCompareRow(getPitcherStatValue(awayPitcher, "SO"), "탈삼진", getPitcherStatValue(homePitcher, "SO"), "higher", false, true),
    buildCompareRow(getPitcherStatValue(awayPitcher, "AVG"), "피안타율", getPitcherStatValue(homePitcher, "AVG"), "lower", false, true),
    buildCompareRow(getPitcherStatValue(awayPitcher, "QS"), "QS", getPitcherStatValue(homePitcher, "QS"), "higher", false, true),
  ];
}

function getPitcherValue(pitcher, key) {
  const season = pitcher?.stats?.[0] ?? {};
  return season[key] ?? pitcher?.[key] ?? "-";
}

function getPitcherStatValue(pitcher, key) {
  return pitcher?.stats?.[0]?.stats?.[key] ?? "-";
}

function getPitcherRecord(pitcher) {
  const season = pitcher?.stats?.[0] ?? {};
  return `${season.wins ?? pitcher?.wins ?? "-"}승 ${season.losses ?? pitcher?.losses ?? "-"}패`;
}

function renderMatchCenter(game, isFinal) {
  if (!isFinal) {
    return `<span class="versus">vs</span>`;
  }

  const awayScoreClass = getScoreResultClass(game.awayScore, game.homeScore);
  const homeScoreClass = getScoreResultClass(game.homeScore, game.awayScore);

  return `
    <div class="score-center" aria-label="최종 스코어">
      <strong class="${awayScoreClass}">${escapeHtml(game.awayScore ?? "-")}</strong>
      <span>:</span>
      <strong class="${homeScoreClass}">${escapeHtml(game.homeScore ?? "-")}</strong>
    </div>
  `;
}

function renderFinalResult(game, awayTeam, homeTeam) {
  return `
    <div class="final-result">
      ${renderScoreRow(awayTeam, game.awayScore, game.homeScore)}
      ${renderScoreRow(homeTeam, game.homeScore, game.awayScore)}
    </div>
    ${renderResultPitchers(game)}
  `;
}

function renderScoreRow(team, score, opponentScore) {
  const scoreClass = getScoreResultClass(score, opponentScore);

  return `
    <div class="score-row ${scoreClass}">
      <div class="score-team">
        ${renderLogo(team)}
        <div>
          <strong>${escapeHtml(team.name ?? "-")}</strong>
          <span>${escapeHtml(formatRecord(team))}</span>
        </div>
      </div>
      <strong class="score-number">${escapeHtml(score ?? "-")}</strong>
    </div>
  `;
}

function getScoreResultClass(score, opponentScore) {
  if (score == null || opponentScore == null || score === opponentScore) {
    return "";
  }

  return score > opponentScore ? "score-winner" : "score-loser";
}

function renderStartingPitchers(awayPitcher, homePitcher, awayTeam, homeTeam) {
  return `
    <div class="pitchers">
      ${renderPitcher(awayPitcher, awayTeam, "left")}
      <span class="starter-label">선발</span>
      ${renderPitcher(homePitcher, homeTeam, "right")}
    </div>
  `;
}

function renderResultPitchers(game) {
  const items = getResultPitcherItems(game);

  if (!items.length) {
    return `
      <div class="result-pitchers empty">
        <span>투수 기록 집계중</span>
      </div>
    `;
  }

  return `
    <div class="result-pitchers">
      ${items.map(renderResultPitcher).join("")}
    </div>
  `;
}

function getResultPitcherItems(game) {
  const holdPitchers = normalizePitcherList(game.holdPitchers ?? game.holdPitcher);

  return [
    { label: "승리", pitcher: game.winningPitcher },
    { label: "패배", pitcher: game.losingPitcher },
    ...holdPitchers.map((pitcher) => ({ label: "홀드", pitcher })),
    { label: "세이브", pitcher: game.savePitcher },
  ].filter((item) => item.pitcher && item.pitcher.name);
}

function normalizePitcherList(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function renderResultPitcher(item) {
  return `
    <div class="result-pitcher">
      ${renderPlayerPhoto(item.pitcher, item.pitcher.name, "")}
      <div>
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.pitcher.name)}</strong>
      </div>
    </div>
  `;
}

function getGameStatus(game) {
  const cancelStatus = game.cancelStatus;
  const gameState = game.gameState;

  if (gameState === "CANCELED") {
    return { label: getCancelReason(cancelStatus), className: "canceled" };
  }

  if (gameState === "FINAL") {
    return { label: "종료", className: "finished" };
  }

  if (gameState === "LIVE") {
    return { label: "경기중", className: "live" };
  }

  if (gameState === "UNKNOWN") {
    return { label: "상태확인불가", className: "unknown" };
  }

  return { label: "예정", className: "scheduled" };
}

function getCancelReason(cancelStatus) {
  const reasons = {
    CANCELED: "경기취소",
    RAIN_CANCELED: "우천취소",
    AIR_QUALITY_CANCELED: "미세먼지취소",
    HEAT_CANCELED: "폭염취소",
    WIND_CANCELED: "강풍취소",
    GROUND_CANCELED: "그라운드취소",
    SUSPENDED: "서스펜디드",
    NO_GAME: "노게임",
    UNKNOWN: "취소사유확인불가",
  };

  return reasons[cancelStatus] ?? "경기취소";
}

function renderTeam(team) {
  return `
    <div class="team">
      ${renderLogo(team)}
      <div>
        <strong>${escapeHtml(team.name ?? "-")}</strong>
        <span>${escapeHtml(formatRecord(team))}</span>
      </div>
    </div>
  `;
}

function formatRecord(team) {
  return `${team.rank ?? "-"}위 · ${team.wins ?? "-"}승 ${team.draws ?? "-"}무 ${team.losses ?? "-"}패`;
}

function renderLogo(team) {
  const fallbackClass = teamFallbackClass[team.key] ?? "";
  const label = (team.name ?? team.key ?? "?").trim().slice(0, 2);

  if (team.logoUrl) {
    return `
      <div class="logo image-logo ${fallbackClass}" aria-hidden="true">
        <img src="${escapeAttribute(team.logoUrl)}" alt="" />
      </div>
    `;
  }

  return `<div class="logo ${fallbackClass}" aria-hidden="true">${escapeHtml(label)}</div>`;
}

function renderPitcher(pitcher, team, side) {
  const name = pitcher.name ?? "미정";
  const fallbackClass = `${teamFallbackClass[team.key] ?? ""}-photo`;
  const stat = formatPitcherStat(pitcher);

  return `
    <div class="pitcher ${side}">
      ${renderPlayerPhoto(pitcher, name, fallbackClass)}
      <div>
        <strong>${escapeHtml(name)}</strong>
        <small>${escapeHtml(stat)}</small>
      </div>
    </div>
  `;
}

function renderPlayerPhoto(pitcher, name, fallbackClass) {
  if (pitcher.profileImageUrl) {
    return `
      <div class="player-photo image-photo ${fallbackClass}" aria-hidden="true">
        <img src="${escapeAttribute(pitcher.profileImageUrl)}" alt="" />
      </div>
    `;
  }

  return `
    <div class="player-photo empty-photo" aria-hidden="true">
      <span></span>
    </div>
  `;
}

function formatPitcherStat(pitcher) {
  const wins = pitcher.wins ?? "-";
  const losses = pitcher.losses ?? "-";
  const era = pitcher.era ?? "-";
  return `${wins}승 ${losses}패 · ERA ${era}`;
}

function formatStadium(stadium) {
  if (!stadium) {
    return "-";
  }
  return stadium.endsWith("야구장") || stadium.endsWith("돔") ? stadium : `${stadium}`;
}

function renderError(error) {
  const helpText =
    location.protocol === "file:"
      ? "파일을 직접 열면 브라우저 보안 정책 때문에 API 호출이 막힐 수 있습니다. http://127.0.0.1:5173 으로 접속해 주세요."
      : error.message;

  gameList.innerHTML = `
    <article class="state-card error">
      경기 정보를 불러오지 못했습니다.
      <small>${escapeHtml(helpText)}</small>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
