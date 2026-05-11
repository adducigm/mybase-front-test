const gameList = document.querySelector("#gameList");
const isLocalServer = location.protocol.startsWith("http") && location.port === "5173";
const apiBase = isLocalServer ? "" : "http://3.36.54.178:8000";
const useMockLiveGames = true;
let todayGames = [];
let requestedGameDate = null;
let loadedGameDate = null;
const detailCache = new Map();
const liveDetailCache = new Map();
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

const teamColors = {
  HT: ["#f46b72", "#8f1118"],
  LT: ["#4f6f9f", "#03193d"],
  KT: ["#858c96", "#171a1f"],
  WO: ["#b84a72", "#4f0d25"],
  LG: ["#e47796", "#8d1237"],
  HH: ["#ffb06a", "#c94908"],
  SK: ["#f36c71", "#981117"],
  OB: ["#6577bd", "#111c4a"],
  SS: ["#6aa4ee", "#073f95"],
  NC: ["#5da0d2", "#123c66"],
};

const mockLiveGameData = {
  requestedGameDate: "2026-05-11",
  gameDate: "2026-05-11",
  games: [
    {
      kboGameId: "mock-live-ssg-lg",
      gameState: "LIVE",
      stadium: "잠실",
      gameTime: "18:30",
      awayScore: 3,
      homeScore: 4,
      awayTeam: {
        key: "SK",
        name: "SSG",
        rank: 4,
        wins: 20,
        draws: 1,
        losses: 17,
      },
      homeTeam: {
        key: "LG",
        name: "LG",
        rank: 2,
        wins: 23,
        draws: 0,
        losses: 15,
      },
      liveStatus: {
        gameState: {
          inning: 7,
          inningHalfName: "초",
          awayScore: 5
          ,
          homeScore: 4,
          count: {
            balls: 2,
            strikes: 1,
            outs: 1,
          },
          runners: {
            first: {
              occupied: true,
              playerName: "최지훈",
              profileImageUrl:"https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/person/middle/2026/56719.jpg"
            },
            second: {
              occupied: false,
            },
            third: {
              occupied: true,
              playerName: "에레디아",
            },
          },
        },
        currentPitcher: {
          playerName: "유영찬",
        },
        currentBatter: {
          playerName: "최정",
        },
      },
      liveDetail: {
        scoreboard: {
          lines: [
            { team: "SSG", inningScores: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 2, 6: 0, 7: 0, 8: 0, 9: 1, 10: 0, 11: 0, 12: "" }, totals: { R: 4, H: 9, E: 0, B: 3 } },
            { team: "LG", inningScores: { 1: 2, 2: 0, 3: 1, 4: 0, 5: 0, 6: 1, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: "" }, totals: { R: 4, H: 10, E: 1, B: 4 } },
          ],
        },
        liveText: [
          {
            inning: 7,
            halves: [
              {
                inning: 7,
                inningHalf: "T",
                inningHalfName: "초",
                teamName: "SSG",
                batters: [
                  { battingOrder: 3, name: "최정", events: [{ text: "좌익수 앞 안타", styleCode: "H" }] },
                  { battingOrder: 4, name: "에레디아", events: [{ text: "3루 주자 홈인", styleCode: "R" }, { text: "중견수 희생플라이", styleCode: "O" }] },
                ],
              },
            ],
          },
          {
            inning: 6,
            halves: [
              {
                inning: 6,
                inningHalf: "B",
                inningHalfName: "말",
                teamName: "LG",
                batters: [
                  { battingOrder: 2, name: "문성주", events: [{ text: "우중간 2루타", styleCode: "H" }] },
                  { battingOrder: 3, name: "오스틴", events: [{ text: "좌익수 앞 적시타", styleCode: "R" }] },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      kboGameId: "mock-live-nc-kt",
      gameState: "LIVE",
      stadium: "수원",
      gameTime: "18:30",
      awayScore: 1,
      homeScore: 1,
      awayTeam: {
        key: "NC",
        name: "NC",
        rank: 7,
        wins: 17,
        draws: 1,
        losses: 20,
      },
      homeTeam: {
        key: "KT",
        name: "KT",
        rank: 6,
        wins: 18,
        draws: 2,
        losses: 19,
      },
      liveStatus: {
        gameState: {
          inning: 4,
          inningHalfName: "말",
          awayScore: 1,
          homeScore: 1,
          count: {
            balls: 1,
            strikes: 2,
            outs: 2,
          },
          runners: {
            first: {
              occupied: false,
            },
            second: {
              occupied: true,
              playerName: "강백호",
            },
            third: {
              occupied: false,
            },
          },
        },
        currentPitcher: {
          playerName: "하트",
        },
        currentBatter: {
          playerName: "문상철",
        },
      },
      liveDetail: {
        scoreboard: {
          lines: [
            { team: "NC", inningScores: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: "" }, totals: { R: 1, H: 6, E: 0, B: 2 } },
            { team: "KT", inningScores: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: "" }, totals: { R: 1, H: 5, E: 0, B: 3 } },
          ],
        },
        liveText: [
          {
            inning: 4,
            halves: [
              {
                inning: 4,
                inningHalf: "B",
                inningHalfName: "말",
                teamName: "KT",
                batters: [
                  { battingOrder: 5, name: "문상철", events: [{ text: "헛스윙 삼진", styleCode: "O" }] },
                  { battingOrder: 6, name: "황재균", events: [{ text: "볼넷", styleCode: "B" }] },
                ],
              },
            ],
          },
        ],
      },
    },
  ],
};

init();
window.addEventListener("hashchange", route);
gameList.addEventListener("click", handleGameListClick);
gameList.addEventListener("keydown", handleGameListKeydown);

async function init() {
  try {
    const data = useMockLiveGames ? mockLiveGameData : await fetchMostRecentGames();
    requestedGameDate = data.requestedGameDate;
    loadedGameDate = data.gameDate;
    todayGames = useMockLiveGames ? data.games ?? [] : await hydrateLiveStatuses(data.games ?? []);
    route();
  } catch (error) {
    renderError(error);
  }
}

function route() {
  const gameId = getSelectedGameId();
  const game = todayGames.find((item) => item.kboGameId === gameId);
  const isLiveDetail = game?.gameState === "LIVE";

  document.body.classList.toggle("live-detail-mode", isLiveDetail);

  if (game) {
    if (isLiveDetail) {
      renderLiveGameDetail(game);
      return;
    }

    renderGameDetail(game);
    return;
  }

  renderGames(todayGames);
}

async function renderLiveGameDetail(game) {
  gameList.innerHTML = MyBaseLiveGameCard.renderDetail(game, liveDetailCache.get(game.kboGameId) ?? game.liveDetail);
  focusLatestInningScore();

  if (!game.kboGameId) {
    return;
  }

  try {
    const detail = await fetchLiveDetail(game.kboGameId);
    liveDetailCache.set(game.kboGameId, detail);
    if (getSelectedGameId() === game.kboGameId) {
      gameList.innerHTML = MyBaseLiveGameCard.renderDetail(game, detail);
      focusLatestInningScore();
    }
  } catch {
    // Keep the current live detail view; scoreboard falls back to cached/mock data when available.
  }
}

function focusLatestInningScore() {
  requestAnimationFrame(() => {
    const inningScroll = gameList.querySelector(".inning-scroll");
    if (inningScroll) {
      inningScroll.scrollLeft = inningScroll.scrollWidth;
    }
  });
}

async function fetchLiveDetail(gameId) {
  const response = await fetch(`${apiBase}/api/v1/kbo/games/${encodeURIComponent(gameId)}/live/detail`);
  if (!response.ok) {
    throw new Error(`라이브 상세 조회 실패: ${response.status}`);
  }

  return response.json();
}

function getSelectedGameId() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  return hash.get("game");
}

function handleGameListClick(event) {
  const eventTab = event.target.closest("[data-live-event-inning]");
  if (eventTab) {
    event.preventDefault();
    MyBaseLiveGameCard.selectEventInning(eventTab.dataset.liveEventInning);
    renderCachedLiveDetail();
    return;
  }

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

function renderCachedLiveDetail() {
  const gameId = getSelectedGameId();
  const game = todayGames.find((item) => item.kboGameId === gameId);
  if (!game || game.gameState !== "LIVE") {
    route();
    return;
  }

  gameList.innerHTML = MyBaseLiveGameCard.renderDetail(game, liveDetailCache.get(game.kboGameId) ?? game.liveDetail);
  focusLatestInningScore();
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
    gameList.innerHTML = `<article class="state-card">최근 경기 목록을 찾지 못했습니다.</article>`;
    return;
  }

  gameList.innerHTML = `${renderLoadedDateNotice()}${games.map(renderGameCard).join("")}`;
}

async function fetchMostRecentGames() {
  const todayData = await fetchGamesByDate();
  const requestedDate = todayData.gameDate;
  const games = todayData.games ?? [];

  if (games.length) {
    return {
      gameDate: todayData.gameDate,
      requestedGameDate: requestedDate,
      games,
    };
  }

  let cursor = shiftDate(todayData.gameDate, 1);
  for (let daysAhead = 1; daysAhead <= 370; daysAhead += 1) {
    const data = await fetchGamesByDate(cursor);
    const recentGames = data.games ?? [];

    if (recentGames.length) {
      return {
        gameDate: data.gameDate,
        requestedGameDate: requestedDate,
        games: recentGames,
      };
    }

    cursor = shiftDate(cursor, 1);
  }

  return {
    gameDate: todayData.gameDate,
    requestedGameDate: requestedDate,
    games: [],
  };
}

async function fetchGamesByDate(gameDate) {
  const params = gameDate ? `?gameDate=${encodeURIComponent(gameDate)}` : "";
  const response = await fetch(`${apiBase}/api/v1/kbo/games/today${params}`);
  if (!response.ok) {
    throw new Error(`API 응답 오류: ${response.status}`);
  }

  return response.json();
}

function renderLoadedDateNotice() {
  if (!requestedGameDate || !loadedGameDate || requestedGameDate === loadedGameDate) {
    return "";
  }

  return `
    <h2 class="game-date-heading">
      ${escapeHtml(formatKoreanDate(loadedGameDate))}
    </h2>
  `;
}

function renderGameCard(game) {
  const awayTeam = game.awayTeam ?? {};
  const homeTeam = game.homeTeam ?? {};
  const awayPitcher = game.awayStartingPitcher ?? {};
  const homePitcher = game.homeStartingPitcher ?? {};
  const status = getGameStatus(game);
  const isFinal = game.gameState === "FINAL";
  const isLive = game.gameState === "LIVE";
  const canOpenDetail = game.gameState === "SCHEDULED";
  const cardStyle = canOpenDetail ? ` style="${getScheduledCardStyle(awayTeam, homeTeam)}"` : "";

  if (isLive) {
    return MyBaseLiveGameCard.render(game);
  }

  return `
    <article
      class="game-card ${isFinal ? "final-card" : ""} ${canOpenDetail ? "scheduled-card is-openable" : "is-static"}"
      data-game-id="${escapeAttribute(game.kboGameId)}"
      data-can-open="${canOpenDetail ? "true" : "false"}"
      ${canOpenDetail ? 'role="button" tabindex="0"' : ""}
      ${cardStyle}
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
              ${renderTeam(awayTeam, "away")}
              ${renderMatchCenter(game, false)}
              ${renderTeam(homeTeam, "home")}
            </div>
            ${renderStartingPitchers(awayPitcher, homePitcher, awayTeam, homeTeam)}
          `
      }
    </article>
  `;
}

async function hydrateLiveStatuses(games) {
  const liveGames = games.filter((game) => game.gameState === "LIVE" && game.kboGameId);

  if (!liveGames.length) {
    return games;
  }

  const statuses = await Promise.all(
    liveGames.map(async (game) => [game.kboGameId, await fetchLiveStatus(game.kboGameId)]),
  );
  const statusByGameId = new Map(statuses);

  return games.map((game) => ({
    ...game,
    liveStatus: statusByGameId.get(game.kboGameId) ?? game.liveStatus ?? null,
  }));
}

async function fetchLiveStatus(gameId) {
  try {
    const response = await fetch(`${apiBase}/api/v1/kbo/games/${encodeURIComponent(gameId)}/live/status`);
    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

function getScheduledCardStyle(awayTeam, homeTeam) {
  const awayColors = teamColors[awayTeam.key] ?? ["#4f5965", "#151a20"];
  const homeColors = teamColors[homeTeam.key] ?? ["#4f5965", "#151a20"];

  return [
    `--away-primary: ${awayColors[0]}`,
    `--away-secondary: ${awayColors[1]}`,
    `--home-primary: ${homeColors[0]}`,
    `--home-secondary: ${homeColors[1]}`,
  ].join("; ");
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
      ${renderLineupSection(lineup, game)}
    </article>
  `;
}

function renderLineupSection(lineup, game) {
  if (!lineup?.away?.players?.length && !lineup?.home?.players?.length) {
    return `
      <section class="compare-board lineup-board">
        <div class="section-head">
          <div class="section-title">라인업</div>
        </div>
        <div class="lineup-empty">라인업 등록 전입니다</div>
      </section>
    `;
  }

  const awayPlayers = lineup?.away?.players ?? [];
  const homePlayers = lineup?.home?.players ?? [];
  const maxRows = Math.max(awayPlayers.length, homePlayers.length);

  return `
    <section class="compare-board lineup-board">
      <div class="section-head">
        <div class="section-title">라인업</div>
      </div>
      <div class="lineup-rows">
        ${Array.from({ length: maxRows }, (_, index) =>
          renderLineupRow(awayPlayers[index], homePlayers[index], index + 1),
        ).join("")}
      </div>
    </section>
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

function renderMatchCenter(game, isFinal, liveStatus = null) {
  if (!isFinal) {
    return `<span class="versus">vs</span>`;
  }

  const awayScoreClass = getScoreResultClass(game.awayScore, game.homeScore);
  const homeScoreClass = getScoreResultClass(game.homeScore, game.awayScore);

  if (liveStatus) {
    return `
      <div class="live-score-center" aria-label="실시간 스코어">
        <span class="live-score-inning">${escapeHtml(formatLiveInning(liveStatus.gameState ?? {}))}</span>
        <div class="score-center">
          <strong class="${awayScoreClass}">${escapeHtml(game.awayScore ?? "-")}</strong>
          <span>:</span>
          <strong class="${homeScoreClass}">${escapeHtml(game.homeScore ?? "-")}</strong>
        </div>
        ${renderBaseDiamond(liveStatus.gameState?.runners)}
      </div>
    `;
  }

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

function renderLiveStatus(liveStatus) {
  const state = liveStatus?.gameState ?? {};
  const count = state.count ?? {};

  return `
    <div class="live-status-panel">
      <div class="live-count">
        <span>B ${escapeHtml(count.balls ?? "-")}</span>
        <span>S ${escapeHtml(count.strikes ?? "-")}</span>
        <span>O ${escapeHtml(count.outs ?? "-")}</span>
      </div>
      <div class="live-matchup">
        ${renderLivePlayer("투수", liveStatus?.currentPitcher)}
        ${renderLivePlayer("타자", liveStatus?.currentBatter)}
      </div>
    </div>
  `;
}

function renderLivePlayer(label, player) {
  const name = player?.playerName ?? "-";

  return `
    <div class="live-player">
      ${renderLivePlayerPhoto(player)}
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(name)}</strong>
    </div>
  `;
}

function renderLivePlayerPhoto(player) {
  const imageUrl = getLivePlayerImageUrl(player);
  const name = player?.playerName ?? "";

  if (!imageUrl) {
    return `
      <div class="live-player-photo empty-photo" aria-hidden="true">
        <span></span>
      </div>
    `;
  }

  return `
    <div class="live-player-photo image-photo" aria-hidden="true">
      <img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(name)}" />
    </div>
  `;
}

function formatLiveInning(state) {
  if (!state?.inning) {
    return "경기중";
  }

  return `${state.inning}회${state.inningHalfName ?? ""}`;
}

function renderBaseDiamond(runners) {
  const renderBase = (base, label) => {
    const runner = runners?.[base];
    const imageUrl = getLivePlayerImageUrl(runner);
    const occupiedClass = runner?.occupied ? " occupied" : "";

    return `
      <span class="base ${base} ${occupiedClass}" title="${escapeAttribute(label)}">
        ${runner?.occupied && imageUrl ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(runner.playerName ?? "")}" />` : ""}
      </span>
    `;
  };

  return `
    <div class="base-diamond" aria-label="주자 상황">
      ${renderBase("second", "2루")}
      ${renderBase("third", "3루")}
      ${renderBase("first", "1루")}
      <span class="home-plate"></span>
    </div>
  `;
}

function getLivePlayerImageUrl(player) {
  if (player?.profileImageUrl) {
    return player.profileImageUrl;
  }

  return "";
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

function renderTeam(team, side = "") {
  const teamClass = teamFallbackClass[team.key] ?? "";
  const sideClass = side ? ` ${side}` : "";

  return `
    <div class="team ${teamClass}${sideClass}">
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

function shiftDate(dateText, days) {
  const date = parseDateText(dateText);
  date.setDate(date.getDate() + days);
  return formatDateParam(date);
}

function parseDateText(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateParam(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatKoreanDate(dateText) {
  const date = parseDateText(dateText);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
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
