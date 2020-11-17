cssExport=`body {
	font-family: monospace;
	background-color: #EEE;
}
::selection {
	background-color: #fffffffa;
	color:black;
}
::-webkit-scrollbar {
	width: 6px;
	height: 6px;
}
::-webkit-scrollbar-track {
	background: #111;
	border-radius: 4px;
}
::-webkit-scrollbar-thumb {
	background: #AAA;
	border-radius: 1px;
}
.box {
	background-color:#111;
	color: #EEE;
	margin-left: 2%;
	margin-right: 2%;
	margin-top: 1%;
	padding: 5px;
	border-radius: 4px;
	outline: none;
	overflow: auto;
}
.panel {
	height:80%;
}
button {
	font-family: monospace;
	background-color: #111;
	color: white;
	border: none;
	border-bottom: 2px solid #111;
	margin: 2px;
	padding: 2px;
	outline: none;
	cursor: pointer;
}
button:not(.obj):hover {
	border-bottom:2px solid gray;
}
button:not(.obj):active {
	border-bottom:2px solid white;
}
* {
	outline: none;
}
.obj {
	border-bottom:2px solid gray;
	margin-right:0;
	margin-left:0;
	padding:0;
}
.holded {
	border-color:white;
}
a {
	color: gray;
}
h1 {
	margin-left: 2%;
}
code {
	background-color: rgb(53, 53, 53);
	border-radius: 1px;
}
.box-input {
	background-color:#111;
	color: #EEE;
	float: left;
	width: 46.8%;
	height: 81.5%;
	margin-left: 2%;
	margin-top: 1%;
	padding: 5px;
	border-radius: 4px;
	outline: none;
	overflow: auto;
	resize: none;
	border: none;
}`

jsExport = "RegExp.prototype.step=function(a=a=>a){let b=b=>b&&[...b.matchAll(this)].map(([b,...c])=>a.apply(null,c));return b.rx=this,b};let room=/# (.+?)\\n(.+?)\\n[-]+\\n(.+?)\\n[-]+/gs.step((a,b,c)=>({title:a,content:b,patchs:patch(c),initStates:initState(c),roomTransitions:roomTransition(c)})),roomWithoutPatches=/# (.+?)\\n(.+?)\\n[-]+/gs.step((a,b)=>({title:a,content:b,patchs:[],initStates:[]})),patch=/(?:\\n|^)> (.+?)\\n(((?!\\n+>).)+)/gs.step((a,b)=>({head:a,body:b})),scriptReplace=a=>a.replace(/{%(.+)%}/g,\"\"),itemReplace=a=>a.replace(/\\[([^|[\\]]+)\\|([^|[\\]]+)\\]|\\[([^|[\\]]+?)\\]/g,(a,b,c,d)=>`<button class='obj' data-name='${d||c}' onclick='UI.itemClick(this)'>${d||b}</button>`).replace(/\\n/g,\"<br>\").replace(/\\\\n/g,\"<br>\"),initState=/@ (.+)/g.step(),script=/{%(.+)%}/g.step(),title=/:: (.+)/g.step(),macro=/(.+) >> (.+)/g.step((a,b)=>[a,b]),stateTransition=/(.+) => (.+)/g.step((a,b)=>[a,b]),stateAntonyms=/(.+) <> (.+)/g.step((a,b)=>[a,b]),stateRemove=/(.+) !> (.+)/g.step((a,b)=>[a,b]),roomTransition=/(.+) -> (.+)/g.step((a,b)=>[a,b]);Parser={parse(a){return{title:title(a)[0],rooms:room(a).concat(roomWithoutPatches(a.replace(room.rx,\"\"))),stateTransitions:stateTransition(a),stateAntonyms:stateAntonyms(a),stateRemove:stateRemove(a)}}},Noir={holded:new Set,room:null,state:{},globalState:{},visited:new Set};let macroExpand=a=>{var b=a;for(m of macro(a))b=b.replace(new RegExp(m[0],\"g\"),m[1]);return console.log(b),b};UI={load(){UI.run()},run(){document.getElementById(\"actions\").innerHTML=\"\";let a=Parser.parse(macroExpand(scenario));Noir.source=scenario,Noir.ast=a,Noir.state={},Noir.visited=new Set,Noir.ast.stateAntonyms.forEach(([a,b])=>{Noir.ast.stateTransitions.push([a,b]),Noir.ast.stateTransitions.push([b,a]),Noir.ast.stateTransitions.filter(([b])=>b==a).forEach(a=>Noir.ast.stateRemove.push([b,a[1]])),Noir.ast.stateTransitions.filter(([a])=>a==b).forEach(b=>Noir.ast.stateRemove.push([a,b[1]]))}),UI.jumpRoom(a.rooms[0])},itemClick(a){a.classList.contains(\"holded\")?(a.classList.remove(\"holded\"),Noir.holded.delete(a.dataset.name)):(a.classList.add(\"holded\"),Noir.holded.add(a.dataset.name)),UI.checkActions()},checkActions(){let a=document.getElementById(\"actions\");a.innerHTML=\"\",Noir.room.patchs.forEach(({head:b,body:c})=>{let[d,...e]=b.split(\" \");[...Noir.holded].length==e.length&&e.every(a=>[...Noir.holded].includes(a))&&Noir.state[Noir.room.title].has(b)&&(a.innerHTML+=`<button data-jump=\"${c.replace(/\"/g,\"'\").replace(/\\n/g,\"\\\\n\")}\" data-verb='${d}' data-items='${e.join(\" \")}' onclick='UI.jump(this)'>${d}</button>`)}),Noir.room.roomTransitions.forEach(([b,c])=>{let[d,...e]=b.split(\" \");[...Noir.holded].length==e.length&&e.every(a=>[...Noir.holded].includes(a))&&Noir.state[Noir.room.title].has(b)&&(a.innerHTML+=`<button onclick=\"jump('${c}')\">${d}</button>`)})},jump(button){let player=document.getElementById(\"player\"),actions=document.getElementById(\"actions\");player.innerHTML+=\"<br>\"+itemReplace(button.dataset.jump.replace(script.rx,(_,expr)=>eval(expr)||\"\")),actions.innerHTML=\"\",document.querySelectorAll(\".holded\").forEach(a=>a.classList.remove(\"holded\")),Noir.holded=new Set,UI.nextState([button.dataset.verb,...button.dataset.items.split(\" \")].join(\" \"))},jumpRoom(a){Noir.visited.has(a.title)||(Noir.state[a.title]=new Set(a.initStates),Noir.visited.add(a.title)),UI.printRoom(a),Noir.room=a},printRoom(room){let player=document.getElementById(\"player\");player.innerHTML=`<b>${room.title}</b><br><br>${itemReplace(room.content.replace(script.rx,expr=>eval(expr)||\"\"))}`},nextState(a){Noir.state[Noir.room.title].delete(a);let b=Noir.ast.stateTransitions.filter(([b,c])=>b==a);b.forEach(a=>Noir.state[Noir.room.title].add(a[1]));let c=Noir.ast.stateRemove.filter(([b,c])=>b==a);return c.forEach(a=>Noir.state[Noir.room.title].delete(a[1])),!0},export(){UI.run(),saveAs(new File([htmlExport(Noir.source,Noir.ast.title)],Noir.ast.title+\".html\"))},docs(){let a=document.getElementById(\"player\");a.innerHTML=doc}};let jump=a=>UI.jumpRoom(Noir.ast.rooms.find(b=>b.title==a));"

htmlExport= (scenario,title) => `<html>
<head>
    <title>${title} - Noir</title>
    <meta charset=utf-8>
    <meta name='viewport' content="width=device-width"/>
    <!--<link href="favicon.png" rel="icon"></link>-->
</head>
<style>${cssExport}</style>
<script>${'let scenario = "' + scenario.replace(/\\/g,'\\\\').replace(/\n/g,'\\n') + '";' + jsExport}</script>
<body onload="UI.load()">
<h1>${title}</h1>
    <div class="box panel" id="player"></div>
    <div class="box" id="actions" style="min-height:4.4%"><div>
</body>
</html>`