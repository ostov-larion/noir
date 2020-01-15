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
	this.vars=[];
	this.parse=function(text)
	{
		let roomrule=/(.+)\n(?:-+)\n(.+)\n(?:-+)\n/s;
		let actionrule=/(.+)\s*=>\s*(.+)/s;
		let actionrule2=/(.+?)\s*\|\s*(.+?)\s*=>\s*(.+)/s;
		let eventrule=/(.+?)\s*:\s*(.+)/s;
		let oprule=/(.+):-(.+)/;
		let unstorerule=/\*(.+)/;
		let antonymsrule=/(.+)<>(.+)/;
		let eqrule=/(.+)=(.+)/;
		let cmd=/\n(.*?)(?:,|$)/g;
		let t=text.match(/"(.*)"\n/);
		if(t)
		{
			this.title=t[1];
			text=text.replace(t[0],"")
		}
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
			else if((result=rule.match(eqrule)))
			{
				this.vars.push([result[1],result[2]]);
			}
			else if((result=rule.match(/#\s*(.+)/)))
			{
				this.stored.push(result[1].split(" "));
			}
		}
	}
	this.triggerAction=function(holded)
	{
		let acts=[];
		let pseudorulebody=[];
		for(let rule of this.actionrules)
		{
			pseudorulebody=rule.body;
			if(equalent(rule.head,holded))
			{
				if(rule.cond)
				{
					for(let cond of rule.cond)
					{
						let True=false;
						for(let stored of this.stored)
						{
							if(equalent(cond,stored))
							{
								True=true
							}
						}
						if(True==false)
						{
							pseudorulebody=[]
						}
						else
						{
							pseudorulebody=rule.body
						}
					}
				}
				acts=acts.concat(pseudorulebody);
			}
		}
		return acts.filter((v,i,s)=>s.indexOf(v)===i);
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
				}
				if(!this.unstorable.includes(event))
					{
						this.retract(h,event);
					}
					for(let a of this.antonyms)
					{
						if(a[0]==event)
						{
							//console.log(a[1])
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
			this.vars=[];
		}
		//let save=JSON.stringify()
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
					rule.vars=vars.copyWithin(rule.vars);
					this.execCmd(result[2],rule)
				}
			}
		}
		else if((result=cmd.match(/\$\^\s*(.+)\s*=\s*(.+)/)))
		{
			let vv=[];
			for(let fact of this.stored)
			{
				let vars=this.unify(result[1].split(" "),fact)
				for(let key in vars)
				{
					vv.push(vars[key])
				}
			}
			rule.vars[result[2]]=vv.length>0?vv.toString():"ничего";
		}
		else if((result=cmd.match(/>\s*"(.*)"/)))
		{
			let objrule=/\[(.+?)\]/g;
			while((obj=objrule.exec(result[1])))
			{
				for($var in rule.vars)
				{
					if(obj[1]==$var)
					{
						result[1]=result[1].replace(obj[1],rule.vars[$var])
					}
				}
				if(!obj[1])
				{
					break;
				}
			}
			insert(result[1]);
		}
		else if((result=cmd.match(/(.+)\s*:=\s*\+(.+)/)))
		{
			let head=result[1].split(" ");
			let body=result[2].split(",");
			this.assert(head,body)
		}
		else if((result=cmd.match(/(.+)\s*:=\s*-(.+)/)))
		{
			let head=result[1].split(" ");
			let body=result[2].split(",");
			this.retract(head,body[0]);
		}
		else if((result=cmd.match(/(.+)\s*:=\s*(.+)/)))
		{
			let head=result[1].split(" ");
			let body=result[2].split(",");
			this.actionrules.push({head:head,body:body})
		}
		else if((result=cmd.match(/@\s*(.*)/)))
		{
			PrintRoom(result[1]);
		}
		else if((result=cmd.match(/(.+)\s*=>\s*(.+)/)))
		{
			this.triggerEvent(result[2].split(" ").concat(result[1]),result[2].split(" "),result[1]);
		}
		else if((result=cmd.match(/!#\s*(.+)/)))
		{
			for(let i in this.stored)
			{
				let vars=this.unify(result[1].split(" "),this.stored[i])
				if(vars)
				{
					this.stored.splice(i,1);
				}
			}
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
			//console.log(i,this.actionrules[i].head,this.actionrules[i].body)
			if(equalent(head,this.actionrules[i].head))
			{	
				//console.log(this.actionrules[i].head,this.actionrules[i].body)
				if(!this.actionrules[i].body.includes(action))
				{
					this.actionrules[i].body=this.actionrules[i].body.concat(action);
				}
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
				vars[res[1]]=b[i]
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

phrase={
	regexp:/(\S+)\s*/,
	step:(r)=>parse(r[1],word)[0]||parse(r[1],string)[0]
}
comma={
	regexp:/\s*([^,]+),?/,
	step:(r)=>
		parse(r[1],word)[0]||
		parse(r[1],string)[0]||
		console.log(r)||
		complain(r[1],"word or string")
}
word={
	regexp:/^(\w+)\s*$/,
	step:(r)=>r[1]
}
string={
	regexp:/"(.*)"|'(.*)'/,
	step:(r)=>r[1]||r[2]
}

}