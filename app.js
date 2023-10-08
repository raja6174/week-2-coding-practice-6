const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

let db = null;
let filePath = path.join(__dirname, "covid19India.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Covert Snake Case to Camel case
const snakeToCamelCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT *
        FROM 
        state
        ORDER BY state_id;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((eachItem) => snakeToCamelCase(eachItem)));
});

//API 2
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getBookQuery = `
        SELECT * 
        FROM state 
        WHERE
        state_id = ${stateId};
    `;
  const state = await db.get(getBookQuery);
  response.send(snakeToCamelCase(state));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    INSERT INTO 
    district(district_name, state_id, cases, cured, active, deaths)
    VALUES 
    (
        '${districtName}',${stateId}, ${cases}, ${cured}, ${active}, ${deaths}
    );
  `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT * 
        FROM 
        district
        WHERE district_id = ${districtId};
    `;
  const district = await db.get(getDistrictQuery);
  response.send(snakeToCamelCase(district));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId};
    `;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
        SELECT SUM(cases) AS totalCases, 
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
        FROM district
        WHERE state_id = ${stateId}
        GROUP BY 
            state_id = ${stateId};
    `;

  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const detailsQuery = `
    SELECT state_name AS stateName
    FROM 
     district
     INNER JOIN state ON district.state_id = state.state_id
     WHERE 
        district_id = ${districtId};
    `;

  const details = await db.get(detailsQuery);
  response.send(details);
});

module.exports = app;
