const regions = {
  "atl": "Atlanta",
  "lax": "Los Angeles",
  "fra": "Frankfurt",
  "osa": "Osaka",
  "syd": "Sydney"
}
const gameModes = {
  "ffa": "FFA",
  "teams": "2TDM",
  "4teams": "4TDM",
  "event": "Event",
  "maze": "Maze"
}

let rooms = {}
for (let [regionCode, regionName] of Object.entries(regions)) {
  for (let [gameModeCode, gameModeName] of Object.entries(gameModes)) {
    rooms[regionCode+"-"+gameModeCode] = {name: regionName+" " +gameModeName}
  }
}

