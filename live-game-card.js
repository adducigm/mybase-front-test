(function () {
  let selectedEventInning = null;

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

  function render(game) {
    const awayTeam = game.awayTeam ?? {};
    const homeTeam = game.homeTeam ?? {};
    const liveGame = applyLiveStatusToGame(game);
    const state = game.liveStatus?.gameState ?? {};
    const count = state.count ?? {};
    const pitcher = game.liveStatus?.currentPitcher ?? null;
    const batter = game.liveStatus?.currentBatter ?? null;
    const status = getGameStatus(game);

    return `
      <article
        class="game-card scheduled-card live-game-card is-openable"
        data-game-id="${escapeAttribute(game.kboGameId)}"
        data-can-open="true"
        role="button"
        tabindex="0"
        style="${getLiveCardStyle(awayTeam, homeTeam)}"
      >
        <div class="game-meta live-game-meta">
          <div class="meta-left">
            <span class="status-text ${status.className}">${escapeHtml(status.label)}</span>
            <span class="game-place-time">${escapeHtml(formatStadium(game.stadium))} · ${escapeHtml(game.gameTime ?? "-")}</span>
          </div>
        </div>
        <div class="matchup live-matchup-card">
          ${renderLiveTeamPanel(awayTeam, liveGame.awayScore, liveGame.homeScore, "away")}
          ${renderLiveScoreCenter(liveGame, state)}
          ${renderLiveTeamPanel(homeTeam, liveGame.homeScore, liveGame.awayScore, "home")}
        </div>
        <div class="live-situation">
          ${renderLivePlayerPair(pitcher, batter)}
          ${renderRunnerState(state.runners)}
          ${renderLiveCount(count)}
        </div>
      </article>
    `;
  }

  function renderDetail(game, detail = null) {
    const awayTeam = game.awayTeam ?? {};
    const homeTeam = game.homeTeam ?? {};
    const liveGame = applyLiveStatusToGame(game);
    const state = game.liveStatus?.gameState ?? {};
    const count = state.count ?? {};
    const pitcher = game.liveStatus?.currentPitcher ?? null;
    const batter = game.liveStatus?.currentBatter ?? null;

    return `
      <article class="detail-page live-detail-page">
        <button class="live-detail-back" type="button" data-action="back" aria-label="경기 목록으로 돌아가기">
          ${renderBackIcon()}
        </button>
        <section class="game-card scheduled-card live-game-card live-detail-card" style="${getLiveCardStyle(awayTeam, homeTeam)}">
          ${renderBroadcastHeader(game, liveGame, state, awayTeam, homeTeam)}
          ${renderInningScoreboard(detail?.scoreboard, awayTeam, homeTeam)}
          <div class="live-ballpark">
            <div class="field-wall"></div>
            <div class="outfield"></div>
            <div class="infield"></div>
            <div class="base-path"></div>
            ${renderLiveFieldBase("second", "2루", state.runners?.second)}
            ${renderLiveFieldBase("third", "3루", state.runners?.third)}
            ${renderLiveFieldBase("first", "1루", state.runners?.first)}
            ${renderLiveFieldPlayer("pitcher", "", pitcher)}
            ${renderLiveFieldPlayer("batter", "", batter)}
            <div class="live-count-board">
              ${renderCountLights("B", count.balls, 3)}
              ${renderCountLights("S", count.strikes, 2)}
              ${renderCountLights("O", count.outs, 2)}
            </div>
          </div>
          ${renderLiveEvents(detail?.liveText)}
        </section>
      </article>
    `;
  }

  function renderInningScoreboard(scoreboard, awayTeam, homeTeam) {
    const lines = normalizeScoreboardLines(scoreboard, awayTeam, homeTeam);
    if (lines.length < 2) {
      return "";
    }

    const innings = getScoreboardInnings(lines);

    return `
      <div class="inning-scoreboard" aria-label="이닝별 점수판">
        <div class="inning-scoreboard-grid">
          <div class="scoreboard-teams">
            <div class="scoreboard-cell team-head"></div>
            ${lines.map((line) => `<div class="scoreboard-cell team-name">${escapeHtml(line.team ?? "-")}</div>`).join("")}
          </div>
          <div class="inning-scroll">
            <div class="inning-scroll-grid" style="--inning-count: ${innings.length}">
              ${innings.map((inning) => `<div class="scoreboard-cell inning-head">${escapeHtml(inning)}</div>`).join("")}
              ${lines
                .map((line) =>
                  innings
                    .map((inning) => `<div class="scoreboard-cell inning-score">${escapeHtml(formatScoreboardValue(line.inningScores?.[inning]))}</div>`)
                    .join(""),
                )
                .join("")}
            </div>
          </div>
          <div class="scoreboard-totals">
            ${["R", "H", "E", "B"].map((label) => `<div class="scoreboard-cell total-head">${escapeHtml(label)}</div>`).join("")}
            ${lines.map(renderScoreboardTotals).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderBackIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10a6 6 0 0 1 0 12h-2" />
      </svg>
    `;
  }

  function renderScoreboardTotals(line) {
    const totals = line.totals ?? {};

    return ["R", "H", "E", "B"]
      .map((key) => `<div class="scoreboard-cell total-score total-${key.toLowerCase()}">${escapeHtml(formatScoreboardValue(totals[key]))}</div>`)
      .join("");
  }

  function normalizeScoreboardLines(scoreboard, awayTeam, homeTeam) {
    const lines = Array.isArray(scoreboard?.lines) ? scoreboard.lines : [];
    const awayName = awayTeam.name;
    const homeName = homeTeam.name;
    const awayLine = lines.find((line) => line.team === awayName) ?? lines[0];
    const homeLine = lines.find((line) => line.team === homeName) ?? lines.find((line) => line !== awayLine) ?? lines[1];

    return [awayLine, homeLine].filter(Boolean);
  }

  function getScoreboardInnings(lines) {
    const maxInning = Math.max(
      9,
      ...lines.flatMap((line) =>
        Object.keys(line.inningScores ?? {})
          .map(Number)
          .filter((inning) => Number.isInteger(inning) && inning > 0),
      ),
    );

    return Array.from({ length: maxInning }, (_, index) => String(index + 1));
  }

  function formatScoreboardValue(value) {
    return value == null || value === "" ? "-" : value;
  }

  function renderLiveEvents(liveText) {
    const innings = Array.isArray(liveText) ? [...liveText].sort((a, b) => Number(a?.inning ?? 0) - Number(b?.inning ?? 0)) : [];
    if (!innings.length) {
      return "";
    }
    const selectedInning = resolveSelectedEventInning(innings);
    const selected = innings.find((inning) => String(inning?.inning) === selectedInning) ?? innings.at(-1);

    return `
      <section class="live-events" aria-label="회별 이벤트">
        <div class="live-event-tabs" role="tablist" aria-label="회 선택">
          ${innings.map((inning) => renderLiveEventTab(inning, selectedInning)).join("")}
        </div>
        ${renderLiveEventInning(selected)}
      </section>
    `;
  }

  function resolveSelectedEventInning(innings) {
    const inningKeys = innings.map((inning) => String(inning?.inning));
    if (!inningKeys.includes(String(selectedEventInning))) {
      selectedEventInning = inningKeys.at(-1);
    }
    return String(selectedEventInning);
  }

  function renderLiveEventTab(inning, selectedInning) {
    const inningKey = String(inning?.inning);
    const selected = inningKey === selectedInning;

    return `
      <button
        type="button"
        class="live-event-tab ${selected ? "is-selected" : ""}"
        data-live-event-inning="${escapeAttribute(inningKey)}"
        role="tab"
        aria-selected="${selected ? "true" : "false"}"
      >
        ${escapeHtml(inningKey)}회
      </button>
    `;
  }

  function renderLiveEventInning(inning) {
    const halves = Array.isArray(inning?.halves) ? inning.halves : [];

    return `
      <article class="live-event-inning">
        <h2>${escapeHtml(inning?.inning ?? "-")}회</h2>
        ${halves.map(renderLiveEventHalf).join("")}
      </article>
    `;
  }

  function renderLiveEventHalf(half) {
    const batters = Array.isArray(half?.batters) ? half.batters : [];

    return `
      <div class="live-event-half">
        <div class="live-event-half-head">
          <strong>${escapeHtml(`${half?.inning ?? "-"}회${half?.inningHalfName ?? ""}`)}</strong>
          <span>${escapeHtml(half?.teamName ?? "")}</span>
        </div>
        <div class="live-event-list">
          ${batters.map(renderLiveEventBatter).join("")}
        </div>
      </div>
    `;
  }

  function renderLiveEventBatter(batter) {
    const events = Array.isArray(batter?.events) ? batter.events : [];

    return `
      <div class="live-event-batter">
        <div class="live-event-player">
          <strong>${escapeHtml(formatBatterLabel(batter))}</strong>
        </div>
        <ul>
          ${events.map(renderLiveEventItem).join("")}
        </ul>
      </div>
    `;
  }

  function renderLiveEventItem(event) {
    return `<li class="${getEventStyleClass(event?.styleCode)}">${escapeHtml(event?.text ?? "-")}</li>`;
  }

  function formatBatterLabel(batter) {
    const order = batter?.battingOrder == null ? "" : `${batter.battingOrder}번타자 `;
    return `${order}${batter?.name ?? "-"}`;
  }

  function getEventStyleClass(styleCode) {
    const code = String(styleCode ?? "").toUpperCase();
    if (code.includes("H") || code.includes("R")) {
      return "is-highlight";
    }
    if (code.includes("O")) {
      return "is-out";
    }
    return "";
  }

  function renderBroadcastHeader(game, liveGame, state, awayTeam, homeTeam) {
    return `
      <div class="broadcast-header">
        <div class="broadcast-meta">
          <span>LIVE</span>
          <small>${escapeHtml(formatStadium(game.stadium))} · ${escapeHtml(game.gameTime ?? "-")}</small>
        </div>
        <div class="broadcast-scoreboard">
          ${renderBroadcastTeam(awayTeam, liveGame.awayScore, liveGame.homeScore, "away")}
          <span class="broadcast-vs">${escapeHtml(formatLiveInning(state))}</span>
          ${renderBroadcastTeam(homeTeam, liveGame.homeScore, liveGame.awayScore, "home")}
        </div>
      </div>
    `;
  }

  function renderBroadcastTeam(team, score, opponentScore, side) {
    return `
      <div class="broadcast-team ${side}">
        ${renderLogo(team)}
        <strong>${escapeHtml(team.name ?? "-")}</strong>
        <b class="${getScoreResultClass(score, opponentScore)}">${escapeHtml(score ?? "-")}</b>
      </div>
    `;
  }

  function renderLiveTeamPanel(team, score, opponentScore, side) {
    const resultClass = getScoreResultClass(score, opponentScore);

    return `
      <div class="team live-team ${side} ${resultClass}">
        ${renderLogo(team)}
        <div>
          <strong>${escapeHtml(team.name ?? "-")}</strong>
          <span>${escapeHtml(formatRecord(team))}</span>
        </div>
      </div>
    `;
  }

  function renderLiveScoreCenter(game, state) {
    return `
      <div class="live-score-card" aria-label="실시간 스코어">
        <strong>${escapeHtml(formatLiveInning(state))}</strong>
        <div class="live-score-numbers">
          <b class="${getScoreResultClass(game.awayScore, game.homeScore)}">${escapeHtml(game.awayScore ?? "-")}</b>
          <span>:</span>
          <b class="${getScoreResultClass(game.homeScore, game.awayScore)}">${escapeHtml(game.homeScore ?? "-")}</b>
        </div>
      </div>
    `;
  }

  function renderLiveInningCenter(state) {
    return `
      <div class="live-score-card live-inning-card" aria-label="현재 이닝">
        <strong>${escapeHtml(formatLiveInning(state))}</strong>
      </div>
    `;
  }

  function renderLiveCount(count) {
    return `
      <div class="compact-count" aria-label="볼카운트">
        ${renderCountLights("B", count.balls, 3)}
        ${renderCountLights("S", count.strikes, 2)}
        ${renderCountLights("O", count.outs, 2)}
      </div>
    `;
  }

  function renderCountLights(label, value, max) {
    const count = Number.isFinite(Number(value)) ? Number(value) : 0;

    return `
      <div class="count-light-row">
        <span>${escapeHtml(label)}</span>
        <div>
          ${Array.from({ length: max }, (_, index) => `<i class="${index < count ? "on" : ""}"></i>`).join("")}
        </div>
      </div>
    `;
  }

  function renderRunnerState(runners) {
    return `
      <div class="compact-bases" aria-label="주자 상황">
        ${renderBase("second", runners?.second)}
        ${renderBase("third", runners?.third)}
        ${renderBase("first", runners?.first)}
        <span class="compact-home"></span>
      </div>
    `;
  }

  function renderBase(base, runner) {
    const occupiedClass = runner?.occupied ? " occupied" : "";
    const name = runner?.playerName ?? "";

    return `<span class="compact-base ${base}${occupiedClass}" title="${escapeAttribute(name)}"></span>`;
  }

  function renderLivePlayerPair(pitcher, batter) {
    return `
      <div class="live-player-pair">
        ${renderLivePlayer("투수", pitcher)}
        ${renderLivePlayer("타자", batter)}
      </div>
    `;
  }

  function renderLivePlayer(label, player) {
    return `
      <div class="compact-live-player">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(player?.playerName ?? "-")}</strong>
      </div>
    `;
  }

  function renderLiveFieldPlayer(role, label, player) {
    const imageUrl = getLivePlayerImageUrl(player);
    const name = player?.playerName ?? "-";

    return `
      <div class="field-player field-${role}">
        ${imageUrl ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(name)}" />` : '<span class="field-player-empty"></span>'}
        ${label ? `<small>${escapeHtml(label)}</small>` : ""}
        <strong>${escapeHtml(name)}</strong>
      </div>
    `;
  }

  function renderLiveFieldBase(base, label, runner) {
    const imageUrl = getLivePlayerImageUrl(runner);
    const occupiedClass = runner?.occupied ? " occupied" : "";
    const name = runner?.playerName ?? label;

    return `
      <div class="field-base ${base}${occupiedClass}" title="${escapeAttribute(name)}">
        ${runner?.occupied && imageUrl ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(name)}" />` : ""}
      </div>
    `;
  }

  function applyLiveStatusToGame(game) {
    const state = game.liveStatus?.gameState ?? {};

    return {
      ...game,
      awayScore: state.awayScore ?? game.awayScore,
      homeScore: state.homeScore ?? game.homeScore,
    };
  }

  function getGameStatus(game) {
    if (game.gameState === "LIVE") {
      return { label: "LIVE", className: "live" };
    }

    return { label: "상태확인불가", className: "unknown" };
  }

  function getScoreResultClass(score, opponentScore) {
    if (score == null || opponentScore == null || score === opponentScore) {
      return "";
    }

    return score > opponentScore ? "score-winner" : "score-loser";
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

  function getLiveCardStyle(awayTeam, homeTeam) {
    const awayColors = teamColors[awayTeam.key] ?? ["#4f5965", "#151a20"];
    const homeColors = teamColors[homeTeam.key] ?? ["#4f5965", "#151a20"];

    return [
      `--away-primary: ${awayColors[0]}`,
      `--away-secondary: ${awayColors[1]}`,
      `--home-primary: ${homeColors[0]}`,
      `--home-secondary: ${homeColors[1]}`,
    ].join("; ");
  }

  function formatRecord(team) {
    return `${team.rank ?? "-"}위 · ${team.wins ?? "-"}승 ${team.draws ?? "-"}무 ${team.losses ?? "-"}패`;
  }

  function formatLiveInning(state) {
    if (!state?.inning) {
      return "경기중";
    }

    return `${state.inning}회${state.inningHalfName ?? ""}`;
  }

  function formatStadium(stadium) {
    if (!stadium) {
      return "-";
    }

    return stadium.endsWith("야구장") || stadium.endsWith("돔") ? stadium : `${stadium}`;
  }

  function getLivePlayerImageUrl(player) {
    if (player?.profileImageUrl) {
      return player.profileImageUrl;
    }

    return "";
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

  window.MyBaseLiveGameCard = {
    render,
    renderDetail,
    selectEventInning(inning) {
      selectedEventInning = String(inning);
    },
  };
})();
