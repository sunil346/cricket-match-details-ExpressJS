const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const ConvertPlayerDetailsDBObjectIntoResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const ConvertMatchDetailsDBObjectIntoREsponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id;`;
  const players = await db.all(getPlayersQuery);
  response.send(
    players.map((each) => ConvertPlayerDetailsDBObjectIntoResponseObject(each))
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayer);
  response.send(ConvertPlayerDetailsDBObjectIntoResponseObject(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putPlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id=${playerId};`;
  await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const match = await db.get(getMatch);
  response.send(ConvertMatchDetailsDBObjectIntoREsponseObject(match));
});

//API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerList = `SELECT * FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const getAll = await db.all(getMatchPlayerList);
  response.send(
    getAll.map((each) => ConvertMatchDetailsDBObjectIntoREsponseObject(each))
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `SELECT * FROM 
    player_details NATURAL JOIN player_match_score
    WHERE match_ID = ${matchId};`;
  const players = await db.all(getQuery);
  response.send(
    players.map((each) => ConvertPlayerDetailsDBObjectIntoResponseObject(each))
  );
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playerScoreQuery = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const getIt = await db.get(playerScoreQuery);
  response.send(getIt);
});

module.exports = app;
