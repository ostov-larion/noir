UIEXPORT=function(){
noir=new Noir();
$(document).ready(function(){
	RunScript()
	$(document).on("click",".obj",function(){
		if($(this).hasClass("holded"))
		{
			$(this).removeClass("holded");
		}
		else
		{
			$(this).addClass("holded");
		}
		res=noir.triggerAction(getHolded());
		$("#actions").html("");
		for(let i in res)
		{
			$("#actions").append(`<button onclick='TriggerEvent("${res[i]}")'>${res[i].replace(/_/g,' ')}</button>`)
		}
	})
});
function RunScript()
{
	noir.clear();
	$("#actions").html("")
	noir.parse(`SCRIPT`.replace(/<br>/g,'\n').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g,' ')+'\n');
	$("title").text(noir.title!=""?noir.title:"Noir");
	PrintRoom(0)
}
TriggerEvent=function(event)
{
	let holded=getHolded();
	holded.push(event)
	noir.triggerEvent(holded,getHolded(),event);
	$('.obj.holded').each((e,i)=>$(i).removeClass("holded"))
	$("#actions").html("")
}
function getHolded()
{
	let holded=[];
	$('.obj.holded').each((e,i)=>holded.push($(i).data("class")))
	return holded;
}
PrintRoom=function(n)
{
	if(n.constructor==String)
	{
		n=noir.rooms.findIndex((e)=>e.title==n);
	}
	$("#player").html(`<h3>${noir.rooms[n].title}</h3>`);
	insert(noir.rooms[n].content)
}
insert=function(text)
{
	let objectrule=/\[(.+?)]/g;
	while((obj=objectrule.exec(text)))
	{
		let a=obj[1].split("|");
		text=text.replace(/%2c%/g,',').replace(/\\n/g,'<br>').replace(/\\t/g,'&nbsp;&nbsp;').replace(obj[0],`<button class="obj" data-class="${a[1]?a[1]:a[0]}">${a[0].replace(/_/g,' ')}</button>`)
	}
	$("#player").append(text);
}
}