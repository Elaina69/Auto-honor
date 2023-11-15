let HonorFriend = true

export function init(context) {
    context.socket.observe('/lol-gameflow/v1/gameflow-phase',async (data) => {
        console.log(data)
        if(data["data"]=="PreEndOfGame") {
            let LCUfetch = await fetch('/lol-honor-v2/v1/ballot')
            let honorList = await LCUfetch.json()
            let getLobbyList = await fetch("/lol-lobby/v2/comms/members")
            let lobby = await getLobbyList.json()
            let currentSummoner = await fetch("/lol-summoner/v1/current-summoner")
            let curent = await currentSummoner.json()
            let lobbyArray = []
            let i,honorID,honorName
            
            for (let [key, value] of Object.entries(lobby["players"])) {
                if (lobby["players"][`${key}`]["summonerId"] != curent["summonerId"]){
                    lobbyArray.push(lobby["players"][`${key}`])
                }
            }
            if (lobbyArray.length!=0 && HonorFriend) {
                i = Math.floor(Math.random() * lobbyArray.length)
                honorID = lobbyArray[i]["summonerId"]
                honorName = lobbyArray[i]["displayName"]
            }
            else {
                i = Math.floor(Math.random() * honorList["eligiblePlayers"].length)
                honorID = honorList["eligiblePlayers"][i]["summonerId"]
                honorName = honorList["eligiblePlayers"][i]["summonerName"]
            }

            await fetch('/lol-honor-v2/v1/honor-player', {
                method: 'POST',
                body: JSON.stringify({
                    "gameId": honorList["gameId"],
                    "honorCategory": "HEART",
                    "summonerId": honorID
                }),
                headers: {'Content-Type': 'application/json'}
            })
            Toast.success(`Honored player: ${honorName}`)
        }
    })
}