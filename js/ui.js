noir=new Noir();
$(document).ready(function(){
	$("#run").click(RunScript);
	$("#editor").ready(()=>$("#editor").html(localStorage["noirLastScript"]))
	$("#editor").keydown(function(event){
		if(event.keyCode==13){
			document.execCommand('insertHTML',false,'<br><br>');
			return false;
		}
	})
	$("#export").click(ExportHTML);
	$("#docs").click(()=>$("#player").html(doc))
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
	localStorage["noirLastScript"]=$("#editor").html();
	noir.clear();
	$("#actions").html("")
	noir.parse($("#editor").html().replace(/<br>/g,'\n').replace(/&lt;/g,"<").replace(/&amp;/g,"&").replace(/&gt;/g,">").replace(/&nbsp;/g,' ')+'\n');
	PrintRoom(0)
}
function ExportHTML()
{
	let SCRIPT=$("#editor").html();
	let jqExport="("+JQINIT.toString()+")"+"()";
	let uiExport="("+UIEXPORT.toString()+")"+"()";
	NSExport=Noir.toString()
	HTMLEXPORT=HTMLEXPORT.replace(/NSExport/,NSExport).replace(/jqExport/,jqExport).replace(/uiExport/,uiExport).replace(/SCRIPT/,SCRIPT).replace(/cssExport/,cssExport)
	saveAs(new File([HTMLEXPORT],"export.html"));
}
function TriggerEvent(event)
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
function PrintRoom(n)
{
	if(n.constructor==String)
	{
		n=noir.rooms.findIndex((e)=>e.title==n);
	}
	$("#player").html(`<h3>${noir.rooms[n].title}</h3>`);
	insert(noir.rooms[n].content)
}
function insert(text)
{
	let objectrule=/\[(.+?)]/g;
	let descrule=/\{(.+?)\}/g;
	while((desc=descrule.exec(text)))
	{
		let a=desc[1].split("|");
		let b=a[1].split(" ");
		if(noir.stored.find((e)=>noir.unify(b,e)))
		{
			text=text.replace(desc[0],a[0])
		}
		else
		{
			text=text.replace(desc[0],"")
		}
	}
	while((obj=objectrule.exec(text)))
	{
		let a=obj[1].split("|");
		let b=obj[0].split(",");
		if(b.length>1)
		{
			for(let iii of b)
			{
				text=text.replace(/%2c%/g,',').replace(/\\n/g,'<br>').replace(/\\t/g,'&nbsp;&nbsp;').replace(iii,`<button class="obj" data-class="${iii.replace(/[\[\]]/,'')}">${iii.replace(/_/g,' ').replace(/[\[\]]/,'')}</button>`)
			}
		}
		else
		{
			text=text.replace(/%2c%/g,',').replace(/\\n/g,'<br>').replace(/\\t/g,'&nbsp;&nbsp;').replace(obj[0],`<button class="obj" data-class="${a[1]?a[1]:a[0]}">${a[0].replace(/_/g,' ')}</button>`)
		}
	}
	$("#player").append(text);
	$("#player")[0].scrollTop=$("#player")[0].scrollHeight;
}