function Noir()
{
	this.title="";
	this.autor="";
	this.rooms=[];
	this.actionrules=[];
	this.eventrules=[];
	this.storedrules=[];
	this.oprules=[];
	this.unstorable=[];
	this.stored=[];
	this.antonyms=[];
	this.parse=function(text)
	{
		let roomrule=/(.+)\n(?:-+)\n(.+)\n(?:-+)\n/g;
		let actionrule=/(.+?)\s*:=\s*(.+)/s;
		let actionrule2=/(.+?)\s*\|\s*(.+?)\s*:=\s*(.+)/s;
		let eventrule=/(.+?)\s*=:\s*(.+)/s;
		let oprule=/(.+):-(.+)/;
		let unstorerule=/\*(.+)/;
		let antonymsrule=/(.+)<>(.+)/;
		let cmd=/\n(.*?)(?:,|$)/g;
		let t=text.match(/"(.*)"\n/);
		this.title=t[1];
		text=text.replace(t[0],"")
		while((rule=roomrule.exec(text)))
		{
			text=text.replace(rule[0],"");
			this.rooms.push({title:rule[1],content:rule[2]});
		}
		
		let rulebook=text.split(".\n");
		for(rule of rulebook)
		{
			if((result=rule.match(eventrule)))
			{
				let head=result[1].replace(/\n/g,'').split(" ");
				let body=result[2].replace(/\n/g,'').replace(/\s*;\s*/g,';').split(";");
				this.eventrules.push({head:head,body:body,vars:[]});
			}
			else if((result=rule.match(actionrule2)))
			{
				let head=result[1].replace(/\n/g,'').split(" ");
				let cond=result[2].replace(/\s*&\s*/g,'&').split("&").map((e)=>e.split(" "));
				let body=result[3].replace(/\n/g,'').replace(/\s*,\s*/g,',').split(",");
				this.actionrules.push({head:head,cond:cond,body:body});
			}
			else if((result=rule.match(actionrule)))
			{
				let head=result[1].replace(/\n/g,'').split(" ");
				let body=result[2].replace(/\n/g,'').replace(/\s*,\s*/g,',').split(",");
				this.actionrules.push({head:head,body:body});
			}
			else if((result=rule.match(oprule)))
			{
				let head=result[1];
				let body=result[2].split(",");
				this.oprules.push({head:head,body:body});
			}
			else if((result=rule.match(unstorerule)))
			{
				this.unstorable.push(result[1]);
			}
			else if((result=rule.match(antonymsrule)))
			{
				this.antonyms.push([result[1],result[2]]);
			}
		}
	}
	this.triggerAction=function(holded)
	{
		for(let rule of this.actionrules)
		{
			if(equalent(rule.head,holded))
			{
				if(rule.cond)
				{
					for(let cond of rule.cond)
					{
						let True=false;
						for(let stored of this.stored)
						{
							if(equalent(stored,cond))
							{
								True=true
							}
						}
						if(True==false)
						{
							return [];
						}
					}
				}
				return rule.body;
			}
		}
	}
	this.triggerEvent=function(holded,h,event)
	{	
		this.stored.push(holded);
		for(let rule of this.eventrules)
		{
			if(equalent(rule.head,holded))
			{
				for(let cmd of rule.body)
				{
					this.execCmd(cmd,rule);
					if(!this.unstorable.includes(event))
					{
						this.retract(h,event);
					}
					for(let a of this.antonyms)
					{
						if(a[0]==event)
						{
							this.assert(h,a[1]);
							for(let ev in this.stored)
							{
								if(equalent(h.concat([a[1]]),this.stored[ev]))
								{
									this.stored.splice(ev,1);
								}
							}
						}
						else if(a[1]==event)
						{
							this.assert(h,a[0]);
							for(let ev in this.stored)
							{
								if(equalent(h.concat([a[0]]),this.stored[ev]))
								{
									this.stored.splice(ev,1);
								}
							}
						}
					}
				}
			}
			this.vars=[];
		}
	}
	this.execCmd=function(cmd,rule)
	{
		
		if((result=cmd.match(/\$\{(.*)\}/)))
		{
			eval(result[1]);
		}
		else if((result=cmd.match(/\$#\s*(.+)\s*:\s*(.+)/)))
		{
			for(let fact of this.stored)
			{
				let vars=this.unify(result[1].split(" "),fact)
				if(vars)
				{
					rule.vars=rule.vars.concat(vars);
					this.execCmd(result[2],rule)
				}
			}
		}
		else if((result=cmd.match(/\^#\s*(.+)\s*=\s*(.+)/)))
		{
			for(let fact of this.stored)
			{
				let vars=this.unify(result[1].split(" "),fact)
				if(vars)
				{
					rule.vars=rule.vars.concat(vars);
					
				}
			}
		}
		else if((result=cmd.match(/>\s*"(.*)"/)))
		{
			let objrule=/\[(.+?)\]/g;
			while((obj=objrule.exec(result[1])))
			{
				console.log(rule,obj[1])
				for($var in rule.vars)
				{
					if(obj[1]==rule.vars[$var].name)
					{
						result[1]=result[1].replace(obj[1],rule.vars[$var].value)
					}
				}
				if(!obj[1])
				{
					break;
				}
			}
			insert(result[1]);
		}
		else if((result=cmd.match(/(.*)\s*:=\s*\+(.*)/)))
		{
			let head=result[1].split(" ");
			let body=result[2].split(",");
			this.assert(head,body)
		}
		else if((result=cmd.match(/(.*)\s*:=\s*-(.*)/)))
		{
			let head=result[1].split(" ");
			let body=result[2].split(",");
			this.retract(head,body[0]);
		}
		else if((result=cmd.match(/(.*)\s*:=\s*(.*)/)))
		{
			let head=result[1].split(" ");
			let body=result[2].split(",");
			this.actionrules.push({head:head,body:body})
		}
		else if((result=cmd.match(/@\s*(.*)/)))
		{
			PrintRoom(result[1]);
		}
		else if((result=cmd.match(/#\s*(.+)/)))
		{
			this.stored.push(result[1].split(" "));
		}
		else if((result=cmd.match(/(.+)=(.+)/)))
		{
			rule.vars.push({name:result[1],value:result[2]})
		}
	}
	this.clear=function()
	{
		this.rooms=[];
		this.actionrules=[];
		this.eventrules=[];
		this.unstorable=[];
		this.stored=[];
		this.antonyms=[];
	}
	this.assert=function(head,action)
	{
		for(let i in this.actionrules)
		{
			if(equalent(head,this.actionrules[i].head))
			{	
				if(!this.actionrules[i].body.includes(action))
				this.actionrules[i].body=this.actionrules[i].body.concat(action);
			}
		}
	}
	this.retract=function(head,action)
	{
		for(let i in this.actionrules)
		{
			if(equalent(head,this.actionrules[i].head))
			{	
				this.actionrules[i].body=this.actionrules[i].body.filter((e)=>e!=action);
			}
		}
	}
	this.unify=function(a,b)
	{
		let vars=[];
		if(a.length!=b.length)
		{
			return false;
		}
		for(let i in a)
		{
			let res;
			if((res=a[i].match(/\[(.+)\]/)))
			{
				vars.push({name:res[1],value:b[i]})
			}
			else if(a[i]!=b[i])
			{
				return false;
			}
		}
		return vars;
	}
	function equalent(a,b)
	{
		return a.every((e)=>b.includes(e))&&a.length==b.length;
	}
	function intersection(a,b)
	{
		for(let i of a)
		{
			if(i.includes(b))
			{
				return true;
			}
		}
		return false;
	}
}