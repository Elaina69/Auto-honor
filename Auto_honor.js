/**
 * @name Auto_Honor
 * @author Elaina Da Catto
 * @description Auto honor plugins for Pengu Loader
 * @link https://github.com/Elaina69
 * @Nyan Meow~~~
 */

import lang from "https://unpkg.com/elainav3-data@latest/data/configs/Language.js"

let eConsole = "%c Elaina Da Catto - Auto Honor "
let eCss = "color: #ffffff; background-color: #f77fbe"

const list = {
    "Honor-mode": ["Random","Friends","Special player"],
}

function setDefaultData(defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
        if (!DataStore.has(key)) {
            DataStore.set(key, value);
        }
    });
}

async function fetchData(lcu) {
    let data = (await fetch(lcu)).json()
    return data
}

async function autoHonor() {
    let honorList = await fetchData('/lol-honor-v2/v1/ballot')
    let lobby = await fetchData("/lol-lobby/v2/comms/members")
    let currentSummoner = await fetchData("/lol-summoner/v1/current-summoner")
    let specialPlayerID = await fetchData(`/lol-summoner/v1/summoners?name=${DataStore.get("Special-honor-player-name")}%23${DataStore.get("Special-honor-player-tag")}`)
    let lobbyArray = []
    let i,honorID,honorName

    DataStore.set("Special-honor-player", specialPlayerID["summonerId"])
    
    for (let [key, value] of Object.entries(lobby["players"])) {
        if (lobby["players"][`${key}`]["summonerId"] != currentSummoner["summonerId"]){
            lobbyArray.push(lobby["players"][`${key}`])
        }
    }

    async function random() {
        i = Math.floor(Math.random() * honorList["eligiblePlayers"].length)
        honorID = honorList["eligiblePlayers"][i]["summonerId"]

        let a = await (await fetchData(`/lol-summoner/v1/summoners/${honorID}`))
        honorName = a["gameName"]
        console.log("random")
    }
    function friends() {
        i = Math.floor(Math.random() * lobbyArray.length)
        honorID = lobbyArray[i]["summonerId"]
        honorName = lobbyArray[i]["displayName"]
    }
    function specialPlayer(Name) {
        honorID = DataStore.get("Special-honor-player")
        honorName = Name
    }

    if (lobbyArray.length!=0 && DataStore.get("Honor-mode") == "Friends") friends()
    else if (lobbyArray.length!=0 && DataStore.get("Honor-mode") == "Special player") {
        let a,Name
        for (let ii = 0; ii<lobbyArray.length; ii++) {
            if (lobbyArray[ii]["summonerId"]==DataStore.get("Special-honor-player")) {
                a = true
                Name = lobbyArray[ii]["displayName"]
            }
            else a = false
        }
        if (a) specialPlayer(Name)
        else friends()
    }
    else random()

    await fetch('/lol-honor-v2/v1/honor-player', {
        method: 'POST',
        body: JSON.stringify({
            "gameId": honorList["gameId"],
            "honorCategory": "HEART",
            "summonerId": honorID
        }),
        headers: {'Content-Type': 'application/json'}
    })
    window.setTimeout(()=>{
        Toast.success(`Honored player: ${honorName}`)
        console.log(eConsole+`%c PlayerID: %c${honorID}`,eCss,"","color: #0070ff")
        console.log(eConsole+`%c Honored player: %c${honorName}`,eCss,"","color: #0070ff")
    },1000)
}

setDefaultData({
    "Special-honor-player-name" : "Elaina Da Catto",
    "Special-honor-player-tag"  : "6969",
    "Auto-Honor"                : true,
    "Honor-mode"                : "Friends",
})

export function init(context) {
    //Auto honor
    if (DataStore.get("Auto-Honor")) {
        context.socket.observe('/lol-gameflow/v1/gameflow-phase',async (data) => {
            console.log(data)
            if (data["data"]=="PreEndOfGame") autoHonor()
            else if (data["data"]=="None") {}
        })
    }

    //Create settings tab
    const AHTab = {
        "statements":[
            ["open-element","lol-uikit-scrollable",[]],
            ["static-attr","class","auto_honor_settings"],
            ["flush-element"],
                ["close-element"]
        ],
        "locals":[],
        "named":[],
        "yields":[],
        "blocks":[],
        "hasPartials":false
    }

    context.rcp.postInit('rcp-fe-lol-settings', async (api) => {
        window.__RCP_SETTINGS_API = api

        let ember_api = window.__RCP_EMBER_API
        let ember = await ember_api.getEmber()

        let newGroup = {
            name: 'Auto_honor',
            titleKey: 'el_ah',
            capitalTitleKey: 'el_ah_capital',
            categories:[]
        }

        newGroup.categories.push({
            name: 'el-ah-settings',
            titleKey: 'el_ah-settings',
            routeName: 'el-ah-settings',
            group: newGroup,
            loginStatus: true,
            requireLogin: false,
            forceDisabled: false,
            computeds: ember.Object.create({
                disabled: false
            }),
            isEnabled: () => true,
        })

        api._modalManager._registeredCategoryGroups.splice(1, 0, newGroup)
        api._modalManager._refreshCategoryGroups()
    })

    context.rcp.postInit('rcp-fe-ember-libs', async (api) => {
        window.__RCP_EMBER_API = api

        let ember = await api.getEmber()

        let originalExtend = ember.Router.extend
        ember.Router.extend = function() {
            let result = originalExtend.apply(this, arguments)

            result.map(function() {
                this.route('el-ah-settings')
            })

            return result
        }
    },

    context.rcp.postInit('rcp-fe-lol-l10n', async (api) => {
        let tra = api.tra()

        let originalGet = tra.__proto__.get
        tra.__proto__.get = function(key) {
            if (key.startsWith('el_')) {
                switch (key) {
                    case 'el_ah': return 'Auto honor'
                    case 'el_ah_capital': return 'AUTO HONOR'
                    case 'el_ah-settings': return 'SETTINGS'
                    default: break;
                }
            }

            return originalGet.apply(this, [key]);
        }
    }),

    context.rcp.postInit('rcp-fe-ember-libs', async (api) => {
        window.__RCP_EMBER_API = api

        let ember = await api.getEmber()

        let originalExtend = ember.Router.extend
        ember.Router.extend = function() {
            let result = originalExtend.apply(this, arguments)
            result.map(function() {
                this.route('el-ah-settings')
            })

            return result
        }

        let factory = await api.getEmberApplicationFactory()

        let originalBuilder = factory.factoryDefinitionBuilder
        factory.factoryDefinitionBuilder = function() {
            let builder = originalBuilder.apply(this, arguments)
            let originalBuild = builder.build
            builder.build = function() {
                let name = this.getName()
                if (name == 'rcp-fe-lol-settings') {
                    window.__SETTINGS_OBJECT = this
                    this.addTemplate('el-ah-settings', ember.HTMLBars.template({
                        id: "ElainaAutoHonorSettings",
                        block: JSON.stringify(AHTab),
                        meta: {}
                    }))
                }
                
                return originalBuild.apply(this, arguments)
            }
            return builder
        }
    }))

    //Add settings tab's contents
    const UI = {
        Row: (id, childs, css) => {
            const row = document.createElement('div')
            row.classList.add('lol-settings-general-row')
            row.id = id
            row.style.cssText = css
            if (Array.isArray(childs)) childs.forEach((el) => row.appendChild(el))
            return row
        },
        Label: (text, id) => {
            const label = document.createElement('p')
            label.classList.add('lol-settings-window-size-text')
            label.innerText = text
            label.id = id
            return label
        },
        Link: (text, href, onClick) => {
            const link = document.createElement('p')
            link.classList.add('lol-settings-code-of-conduct-link')
            link.classList.add('lol-settings-window-size-text')

            const a = document.createElement('a')
            a.innerText = text
            a.target = '_blank'
            a.href = href
            a.onclick = onClick || null

            link.append(a)
            return link
        },
        Button: (text, cls, onClk, styles) => {
            const btn = document.createElement('lol-uikit-flat-button-secondary')
            btn.innerText = text
            btn.onclick = onClk
            btn.style.cssText = styles
            btn.setAttribute('class', cls)
            return btn
        },
        Input: (target,styles) => {
            const origIn = document.createElement('lol-uikit-flat-input')
            const searchbox = document.createElement('input')

            origIn.classList.add(target)
            origIn.style.marginBottom = '12px'

            searchbox.type = 'url'
            searchbox.placeholder = DataStore.get(target)
            searchbox.style.cssText = styles
            searchbox.name = 'name'
            searchbox.oninput = ()=>{
                let input = {
                    get value() {
                    return searchbox.value
                    },
                }
                DataStore.set(target, input.value)
            }
            origIn.appendChild(searchbox)
            return origIn
        },
        CheckBox: (text, ID, boxID, check) => {
            const origin = document.createElement("lol-uikit-flat-checkbox")
            const checkbox = document.createElement("input")
            const label = document.createElement("label")

            origin.setAttribute("class",'')
            origin.id = ID

            checkbox.type = "checkbox"
            checkbox.id = boxID
            checkbox.onclick = check
            checkbox.setAttribute("slot", "input")

            label.innerHTML = text
            label.setAttribute("slot", "label")

            origin.appendChild(checkbox)
            origin.appendChild(label)

            return origin
        },
        Dropdown: (list,target,text) => {
            const origin = document.createElement("div")
            const title  = document.createElement("div")
            const dropdown = document.createElement("lol-uikit-framed-dropdown")

            origin.classList.add("Dropdown-div")
            title.classList.add("lol-settings-window-size-text")
            title.innerHTML = text
            dropdown.classList.add("lol-settings-general-dropdown")
            origin.append(title,dropdown)
            for (let i = 0; i < list[target].length; i++) {
                    const opt = list[target][i]
                    const el = document.createElement("lol-uikit-dropdown-option")
                    el.setAttribute("slot", "lol-uikit-dropdown-option")
                    el.innerText = opt
                    el.id = opt
                    el.onclick = () => {
                        DataStore.set(target, opt)
                    }
                    if (DataStore.get(target) == opt) {
                        el.setAttribute("selected", "true")
                    }
                    dropdown.appendChild(el)
                }
            return origin
        },
    }

    const injectSettings = (panel) => {
        const langCode = document.querySelector("html").lang;
        const langMap = lang.langlist
        const selectedLang = lang[langMap[langCode] || "EN"];

        let interval = window.setInterval(()=> {
            try {
                let a = document.getElementById("Special-honor-div")
                let b = document.getElementById("valid-name-checked")
                if (DataStore.get("Honor-mode") != "Special player") {
                    a.style.visibility = "hidden"
                    b.hidden = true
                }
                else {
                    a.style.visibility = "visible"
                    b.hidden = false
                }
                document.querySelector(".lol-settings-footer.ember-view > lol-uikit-flat-button-group > lol-uikit-flat-button").addEventListener("click", ()=>{
                    window.clearInterval(interval)
                })
            }
            catch{}
        },500)

        panel.prepend(
            UI.Row("",[
                UI.Row("Info",[
                    UI.Row("Info-div",[
                        UI.Link(
                            `Auto Honor - Elaina Da Catto`,
                            'https://github.com/Elaina69/Auto-honor'
                        ),
                    ]),
                ]),
                UI.CheckBox(
                    `${selectedLang["Auto-Honor"]}`,'autoHonor','autoHonorbox',
                    ()=>{
                        let autoHonorel = document.getElementById("autoHonor")
                        let autoHonorbox = document.getElementById("autoHonorbox")
                    
                        if (DataStore.get("Auto-Honor")) {
                            autoHonorel.removeAttribute("class")
                            autoHonorbox.checked = false
                            DataStore.set("Auto-Honor", false)
                        }
                        else {
                            autoHonorel.setAttribute("class", "checked")
                            autoHonorbox.checked = true
                            DataStore.set("Auto-Honor", true)
                        }
                    },true
                ),
                document.createElement('br'),
                UI.Dropdown(list, "Honor-mode", `${selectedLang["Honor-mode"]}`),
                document.createElement('br'),
                UI.Row("Special-honor-div",[
                    UI.Row("Special-honor-name-div",[
                        UI.Label(`${selectedLang["Username"]}`),
                        UI.Input("Special-honor-player-name","width: 190px; margin-right: 15px;")
                    ]),
                    UI.Row("Special-honor-tagline-div",[
                        UI.Label(`${selectedLang["Tagline"]}`),
                        UI.Input("Special-honor-player-tag","width: 80px; margin-right: 15px")
                    ]),
                    UI.Button(`${selectedLang["Check"]}`,"check-valid-name",
                    async ()=> {
                        await fetchData (`/lol-summoner/v1/summoners?name=${DataStore.get("Special-honor-player-name")}%23${DataStore.get("Special-honor-player-tag")}`)
                        await fetchData("/lol-summoner/v1/current-summoner")
                        
                        let info = document.getElementById("valid-name-checked")

                        function getValidName(text,colors) {
                            info.textContent = text
                            console.log(eConsole+`%c ${text}`,eCss,colors)
                            info.style.cssText = colors
                        }

                        if (id["summonerId"]!=curent["summonerId"]) {
                            getValidName(selectedLang["Valid-username"],"color: green;")
                        }
                        else if (id["summonerId"]==curent["summonerId"]) {
                            let i = Math.floor(Math.random() * 2 + 1)
                            getValidName(selectedLang[`Honor-self-${i}`],"color: red;")
                        }
                        else {
                            getValidName(selectedLang["Invalid-username"],"color: red;")
                        }
                    },"display: flex; width: 75px; height: 30px; margin-top: 34px;")
                ],"display: flex"),
                UI.Label("","valid-name-checked")
            ])
        )
    }

    window.addEventListener('load', async () => {
        function tickcheck (Data, el, checkbox) {
            let element = document.getElementById(el)
            let box = document.getElementById(checkbox)
            if (Data && element.getAttribute("class") == "") {
                box.checked = true
            }
        }
        const interval = setInterval(() => {
            const manager = document.getElementById('lol-uikit-layer-manager-wrapper')
            if (manager) {
                clearInterval(interval)
                new MutationObserver((mutations) => {
                    const panel = document.querySelector('div.lol-settings-options > lol-uikit-scrollable.auto_honor_settings')
                    if (panel && mutations.some((record) => Array.from(record.addedNodes).includes(panel))) {
                        injectSettings(panel)
                        const check = setInterval (()=>{
                            if (document.getElementById("Info")) {
                                clearInterval(check)
                                tickcheck(DataStore.get("Auto-Honor"), "autoHonor", "autoHonorbox")
                            }
                        },100)
                    }
                }).observe(manager, {
                    childList: true,
                    subtree: true
                })
            }
        },500)
    })
}