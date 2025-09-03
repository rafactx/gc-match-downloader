// content.js

console.log("🟢 GamersClub Downloader: content script carregado!");

function getMatchId() {
  const match = window.location.pathname.match(/\/lobby\/match\/(\d+)/);
  return match ? match[1] : null;
}

function addButton() {
  if (document.getElementById("gc-download-button")) return;

  const button = document.createElement("button");
  button.id = "gc-download-button";
  button.innerText = "📥 Baixar Dados (recarrega)";
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    background: #2c7be5;
    color: white;
    border: none;
    padding: 12px 18px;
    font-size: 14px;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    transition: background 0.2s;
  `;

  button.onmouseover = () => button.style.background = "#2668c4";
  button.onmouseout = () => button.style.background = "#2c7be5";

  button.addEventListener("click", () => {
    const matchId = getMatchId();
    if (!matchId) {
      console.warn("❌ Não foi possível extrair o ID da partida.");
      return;
    }

    console.log(`📥 Solicitando download para a partida: ${matchId}`);
    chrome.runtime.sendMessage({
      action: "requestDownloadOnReload",
      matchId: matchId
    });
  });

  document.body.appendChild(button);
  console.log("🟢 Botão adicionado na página.");
}

const matchId = getMatchId();
if (matchId) {
  chrome.runtime.sendMessage({ action: "setMatchId", matchId: matchId });
} else {
  console.warn("❌ URL inválida: não é uma página de partida.");
}

chrome.storage.local.get(["shouldDownload"], (result) => {
  if (chrome.runtime.lastError) {
    console.error("❌ Erro ao acessar storage.local:", chrome.runtime.lastError);
    addButton();
    return;
  }

  if (result && result.shouldDownload === true) {
    console.log("🔄 Modo automático ativado. Aguardando dados do background...");
  } else {
    console.log("ℹ️ Modo manual. Exibindo botão.");
    addButton();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadFormattedData") {
    console.log("📥 Recebido: dados da partida para download.");

    const rawData = request.rawData;
    if (!rawData || !rawData.success) {
      console.error("❌ Dados inválidos recebidos:", rawData);
      return;
    }

    try {
      const formattedData = {
        match: {
          match_id: rawData.id,
          link: rawData.link,
          date: rawData.data,
          map: rawData.jogos.map_name,
          duration: rawData.jogos.duration,
          status: rawData.status,
          teams: {
            team_a: rawData.time_a,
            team_b: rawData.time_b
          },
          score: {
            team_a: parseInt(rawData.jogos.score_a) || 0,
            team_b: parseInt(rawData.jogos.score_b) || 0
          }
        },
        players: []
      };

      const winnerScore = Math.max(formattedData.match.score.team_a, formattedData.match.score.team_b);

      const mapPlayer = (playerData, teamSide) => {
        const isTeamA = teamSide === 'a';
        const teamName = isTeamA ? rawData.time_a : rawData.time_b;
        const teamScore = isTeamA ? formattedData.match.score.team_a : formattedData.match.score.team_b;
        const oppScore = isTeamA ? formattedData.match.score.team_b : formattedData.match.score.team_a;
        const result = teamScore === winnerScore ? "WIN" : "LOSS";

        return {
          team_name: teamName,
          team_score: teamScore,
          opp_score: oppScore,
          result: result,
          player_id: playerData.idplayer,
          nick: playerData.player?.nick || "Sem nick",
          K: parseInt(playerData.nb_kill) || 0,
          A: parseInt(playerData.assist) || 0,
          D: parseInt(playerData.death) || 0,
          DIFF: parseInt(playerData.diff) || 0,
          ADR: parseFloat(playerData.adr) || 0,
          KDR: parseFloat(playerData.kdr) || 0,
          KAST: parseInt(playerData.pkast) || 0,
          FA: parseInt(playerData.flash_assist) || 0,
          MK: parseInt(playerData.multikills) || 0,
          FK: parseInt(playerData.firstkill) || 0,
          "1K": parseInt(playerData.nb1kill) || 0,
          "2K": parseInt(playerData.nb2kill) || 0,
          "3K": parseInt(playerData.nb3kill) || 0,
          "4K": parseInt(playerData.nb4kill) || 0,
          "5K": parseInt(playerData.nb5kill) || 0,
          HS: parseInt(playerData.hs) || 0,
          "HS%": parseInt(playerData.phs) || 0,
          BD: parseInt(playerData.defuse) || 0,
          BP: parseInt(playerData.bombe) || 0,
          RJ: parseInt(playerData.rounds_played) || 0
        };
      };

      if (rawData.jogos?.players?.team_b) {
        rawData.jogos.players.team_b.forEach(p => formattedData.players.push(mapPlayer(p, 'b')));
      }
      if (rawData.jogos?.players?.team_a) {
        rawData.jogos.players.team_a.forEach(p => formattedData.players.push(mapPlayer(p, 'a')));
      }

      const jsonStr = JSON.stringify(formattedData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamersclub_match_${rawData.id}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("✅ Download concluído com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao formatar ou baixar JSON:", error);
    }
  }
});