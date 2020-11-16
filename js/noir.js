/*
    Noir - interactive fiction game engine
    !WARNING: Undocumented!
*/

RegExp.prototype.step = function(fn = (x => x)){
    let parser = string => string && [...string.matchAll(this)].map(([_,...args]) => fn.apply(null,args))
    parser.rx = this
    return parser
}

let room = /# (.+?)\n(.+?)\n[-]+\n(.+?)\n[-]+/gs.step(
    (title,content,patchs) => ({
        title,
        content: itemReplace(content),
        patchs: patch(patchs),
        initStates: initState(patchs),
        roomTransitions: roomTransition(patchs),
    })
)
let roomWithoutPatches = /# (.+?)\n(.+?)\n[-]+/gs.step(
    (title,content) => ({
        title,
        content: itemReplace(content),
        patchs: [],
        initStates: [],
    })
)

let patch = /(?:\n|^)> (.+?)\n(((?!\n+>).)+)/gs.step((head,body) => ({
        head,
        body: itemReplace(body)
    })
)

let scriptReplace = str => str.replace(/{%(.+)%}/g,'')
let itemReplace = content => content.replace(/\[([^|[\]]+)\|([^|[\]]+)\]|\[([^|[\]]+?)\]/g,(_,$1,$2,$3) => `<button class='obj' data-name='${$3 || $2}' onclick='UI.itemClick(this)'>${$3 || $1}</button>`).replace(/\n/g,'<br>')
let initState = /@ (.+)/g.step()
let script =   /{%(.+)%}/g.step()
let title =   /:: (.+)/g.step()
let stateTransition = /(.+) => (.+)/g.step((left,right) => [left,right])
let stateAntonyms =  /(.+) <> (.+)/g.step((left,right) => [left,right])
let stateRemove =   /(.+) !> (.+)/g.step((left,right) => [left,right])
let roomTransition = /(.+) -> (.+)/g.step((action,room) => [action,room])

Parser = {
    parse(script){
        return {
            title: title(script)[0],
            rooms: room(script).concat(roomWithoutPatches(script.replace(room.rx,''))),
            stateTransitions: stateTransition(script),
            stateAntonyms: stateAntonyms(script),
            stateRemove: stateRemove(script)
        }
    }
}

Noir = {
    holded: new Set(),
	room: null,
    state: {},
    visited: new Set()
}

UI = {
    load(){
        let editor = document.getElementById('editor')
        editor.value = localStorage['lastScript'] || ''
    },
    run(){
        let editor = document.getElementById('editor')
        document.getElementById('actions').innerHTML = ''
        let ast = Parser.parse(editor.value)
        Noir.source = editor.value
        Noir.ast = ast
        Noir.state = {}
        Noir.visited = new Set()
        Noir.ast.stateAntonyms.forEach(([left,right]) => {
            Noir.ast.stateTransitions.push([left,right])
            Noir.ast.stateTransitions.push([right,left])
            Noir.ast.stateTransitions.filter(([l]) => l == left).forEach(e => Noir.ast.stateRemove.push([right,e[1]]))
            Noir.ast.stateTransitions.filter(([l]) => l == right).forEach(e => Noir.ast.stateRemove.push([left,e[1]]))
        })
        localStorage['lastScript'] = editor.value
        UI.jumpRoom(ast.rooms[0])
    },
    itemClick(item){
        if(item.classList.contains('holded')) {
            item.classList.remove('holded')
            Noir.holded.delete(item.dataset.name)
        }
        else {
            item.classList.add('holded')
            Noir.holded.add(item.dataset.name)
        }
        UI.checkActions()
    },
    checkActions(){
        let actions = document.getElementById('actions')
        actions.innerHTML = ''
        Noir.room.patchs.forEach(({head,body}) => {
            let [verb,...nouns] = head.split(' ');
            [...Noir.holded].length == nouns.length &&
            nouns.every(h => [...Noir.holded].includes(h)) &&
            Noir.state[Noir.room.title].has(head) &&
            (actions.innerHTML += `<button data-jump="${body.replace(/"/g,"'").replace(/\n/g,'\\n')}" data-verb='${verb}' data-items='${nouns.join(' ')}' onclick='UI.jump(this)'>${verb}</button>`)
        })
        
        Noir.room.roomTransitions.forEach(([action,room]) => {
            let [verb,...nouns] = action.split(' ');
            [...Noir.holded].length == nouns.length &&
            nouns.every(h => [...Noir.holded].includes(h)) &&
            Noir.state[Noir.room.title].has(action) &&
            (actions.innerHTML += `<button onclick="jump('${room}')">${verb}</button>`)
        })
    },
    jump(button){
        let player = document.getElementById('player')
        let actions = document.getElementById('actions')
        player.innerHTML += '<br>' + button.dataset.jump.replace(script.rx,(_,expr) => eval(expr) || "")
        actions.innerHTML = ''
        document.querySelectorAll('.holded').forEach(e => e.classList.remove('holded'))
        Noir.holded = new Set()
        UI.nextState([button.dataset.verb,...button.dataset.items.split(' ')].join(' '))
    },
    jumpRoom(room) {
        if(!Noir.visited.has(room.title)) {
            Noir.state[room.title] = new Set(room.initStates)
            Noir.visited.add(room.title)
        }
        UI.printRoom(room)
        Noir.room = room
    },
    printRoom(room){
        let player = document.getElementById('player')
        player.innerHTML = `<b>${room.title}</b><br><br>${room.content.replace(script.rx, expr => eval(expr) || "")}`
    },
    nextState(state){
        Noir.state[Noir.room.title].delete(state)
        let srule = Noir.ast.stateTransitions.filter(([s1,_]) => s1 == state)
        srule.forEach(new_state => Noir.state[Noir.room.title].add(new_state[1]))
        let rrule = Noir.ast.stateRemove.filter(([s1,_]) => s1 == state)
        rrule.forEach(new_state => Noir.state[Noir.room.title].delete(new_state[1]))
        return true
    },
    export(){
        UI.run()
        saveAs(new File([htmlExport(Noir.source,Noir.ast.title)], Noir.ast.title + '.html'))
    },
    docs(){
        let player = document.getElementById('player')
        player.innerHTML = doc
    }
}

let jump = title => UI.jumpRoom(Noir.ast.rooms.find(room => room.title == title))