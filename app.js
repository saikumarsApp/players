const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever is running at http://localost:3000/");
    });
  } catch (e) {
    console.log(`DB Error is ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const getPlayerCamelCase = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

const getMatchCamelCase = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

const getPlayerMatchScoreCamelCase = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
    playerMatchId: obj.player_match_id,
    playerId: obj.playerId,
    score: obj.score,
    fours: obj.fours,
    sixes: obj.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT *
    FROM player_details;
    `;
  const playerDetails = await db.all(getPlayerQuery);
  response.send(playerDetails.map((item) => getPlayerCamelCase(item)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};
    `;
  const playerIdDetails = await db.get(getPlayerIdQuery);
  response.send(getPlayerCamelCase(playerIdDetails));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const putPlayerNameQuery = `
    UPDATE player_details
    SET player_name = '${playerName}';
    `;
  await db.run(putPlayerNameQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};
    `;
  const matchDetails = await db.get(getMatchDetails);
  response.send(getMatchCamelCase(matchDetails));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const matchesQuery = `
    SELECT 
       *
    FROM player_match_score 
        NATURAL JOIN match_details
    WHERE player_id = ${playerId};
    `;
  const matches = await db.all(matchesQuery);
  response.send(matches.map((value) => getMatchCamelCase(value)));
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const matchPlayer = await db.all(getMatchPlayersQuery);
  response.send(matchPlayer);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const stats = await db.get(getPlayerScored);
  response.send(stats);
});

module.exports = app;
