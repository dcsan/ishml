ishml.Yarn=function Yarn(seed) 
{
	if (this instanceof Yarn)
	{
		this.plot= new ishml.Plotpoint(this)
		this.storyline = new ishml.Storyline(this)  //Event queue
		this.lexicon=null
		this.grammar =null
		this.parser=null
		this.translator= null
		this.viewpoint="2nd person singular"
		this.setting="present"
		ishml.util.reseed(seed)
		this.net=new ishml.Ply("$")
		this.harken()
		this.undo=[]
		
	}
	else
	{
		return new Yarn(seed)
	}	
}

ishml.Yarn.prototype.configure=function(options)
{
	//DEFECT TO DO seed, name, author, etc.
}
ishml.Yarn.prototype.harken=function()
{
	var state={dragging:false}
	document.addEventListener('click', (e)=>this.click(e))
	document.addEventListener('keyup', (e)=> this.keyup(e))
	document.addEventListener('mousedown', (e)=> this.mousedown(e,state))
	document.addEventListener('mouseup', (e)=> this.mouseup(e,state))
	document.addEventListener('mousemove', (e)=> this.mousemove(e,state))
	document.addEventListener('transitionend', (e)=> this.transitionend(e,state))

}
ishml.Yarn.prototype.click=function(e)
{
	if (e.target.matches('.ishml-choice'))
	{
		this.storyline.introduce({plotpoint:this.plot.points[e.target.dataset.plot]||this.plot[e.target.dataset.plot]||this.plot,twist:e.target.dataset})
		this.tell()
	}
}
ishml.Yarn.prototype.keyup=function(e)
{
	if (e.target.matches('.ishml-input'))
	{
		if (e.keyCode===13)
		{
			this.storyline.introduce({plotpoint:this.plot.points[e.target.dataset.plot]||this.plot[e.target.dataset.plot]||this.plot,twist:Object.assign({input:e.target.value}, e.target.dataset)})
			this.tell()
		}
	}
}
ishml.Yarn.prototype.mousedown=function(e,state)
{
	if (e.target.matches('.ishml-draggable'))
	{
		e.preventDefault()
		if(!state.dragging)
		{
			var {top,left}=e.target.getBoundingClientRect()
			state.dragging={}
			state.dragging.clone=e.target.cloneNode(true)
			state.dragging.offset={left:e.clientX-left,top:e.clientY-top}
			state.dragging.originalPosition={left:`${left}px`,top:`${top}px`}
			state.dragging.clone.style.position="fixed"
			state.dragging.clone.style.left=`${e.clientX - state.dragging.offset.left}px`
			state.dragging.clone.style.top=`${e.clientY -state.dragging.offset.top}px`
			state.dragging.original=e.target
			e.target.classList.add("ishml-disappear")
			state.dragging.clone.classList.add("ishml-draggable-dragging")
			document.body.appendChild(state.dragging.clone)
		}
	}
}
ishml.Yarn.prototype.mouseup=function(e,state)
{
	
	if (state.dragging && !state.dragging.transitioning)
	{

		e.preventDefault()
		if(state.dragging.dropbox)
		{
			this.dropHoverStop({draggable:state.dragging.clone,dropbox:state.dragging.dropbox})
		}
		state.dragging.clone.classList.remove("ishml-draggable-dragging")
		state.dragging.clone.classList.add("ishml-draggable-rejected")
		state.dragging.clone.style.left=state.dragging.originalPosition.left
		state.dragging.clone.style.top=state.dragging.originalPosition.top
		state.dragging.transitions=0
		state.dragging.transitioning=true
	}
}
ishml.Yarn.prototype.mousemove=function(e,state)
{
	if (state.dragging && !state.dragging.clone.matches(".ishml-draggable-rejected"))
	{
		e.preventDefault()
		var left=`${e.clientX - state.dragging.offset.left}px`
		var right=`${e.clientY - state.dragging.offset.top}px`
		state.dragging.clone.style.left="-10000px"
		state.dragging.clone.style.top="-10000px"
		let dropbox = document.elementFromPoint(e.clientX, e.clientY)
		if(dropbox){dropbox=dropbox.closest(".ishml-dropbox")}
		if (state.dragging.dropbox != dropbox) 
		{
			if (state.dragging.dropbox)
			{
				this.dropHoverStop({draggable:state.dragging.clone,dropbox:state.dragging.dropbox })
			}
 			state.dragging.dropbox = dropbox;
			if (state.dragging.dropbox) 
			{ 
				this.dropHoverStart({draggable:state.dragging.clone,dropbox:state.dragging.dropbox})
			}
		}
		state.dragging.clone.style.left=left
		state.dragging.clone.style.top=right
	}
}
ishml.Yarn.prototype.transitionend=function(e,state)
{
	if(e.target===state.dragging.clone && state.dragging.transitioning )
	{
		state.dragging.transitions++

		if (state.dragging.transitions==getComputedStyle(state.dragging.clone).getPropertyValue('--transitions'))
		{
			state.dragging.original.classList.remove("ishml-disappear")
			
			document.body.removeChild(state.dragging.clone)
			state.dragging=false
		}
	}
}

ishml.Yarn.prototype.dropHoverStart=function({draggable,dropbox})
{
	draggable.dataset.originalText=draggable.innerText
	draggable.innerText=draggable.innerText + " " +dropbox.innerText
	draggable.classList.add("ishml-draggable-hover")
	dropbox.classList.add("ishml-dropbox-hover")
}
ishml.Yarn.prototype.dropHoverStop=function({draggable,dropbox})
{
	draggable.classList.remove("ishml-draggable-hover")
	draggable.innerText=draggable.dataset.originalText
	dropbox.classList.remove("ishml-dropbox-hover")
}
ishml.Yarn.prototype.dropCheck=function({draggable,dropbox})
{
	var plot=this.plot.points[draggable.dataset.plot]
	if (plot)
	{
		var subplot=this.plot.points[dropbox.dataset.plot]||this.plot[dropbox.dataset.plot]
		var plotpoints=Object.values(plot)
		return plotpoints.includes(subplot)
	}
	return false
}
		
ishml.Yarn.prototype.say=function(aText)
{	
	if (typeof aText === 'string' || aText instanceof String)
	{
		var fragment = document.createElement('template')
    	fragment.innerHTML = aText
    	fragment= fragment.content
	}
	else if(aText instanceof ishml.Passage)
	{
		var fragment=aText.documentFragment()
	}
	else
	{
		var fragment=aText
	}
	var _first = (aDocumentSelector)=>
	{
		var targetNodes=document.querySelectorAll(aDocumentSelector)
		targetNodes.forEach((aNode)=>
		{
			aNode.prepend(fragment)
			/*aNode.querySelectorAll(".ishml-input").forEach((descendant)=>descendant.onkeyup=this.input.bind(this))
			aNode.querySelectorAll(".ishml-choice").forEach((descendant)=>descendant.onclick=this.click.bind(this))
			aNode.querySelectorAll(".ishml-drag").forEach((descendant)=>
			{
				descendant.ondragstart=this.drag.bind(this)
				descendant.draggable=true
			})
			aNode.querySelectorAll(".ishml-drop").forEach((descendant)=>
			{
				descendant.ondrop=this.drop.bind(this)
				descendant.ondragenter=this.dragenter.bind(this)
				descendant.ondragover=this.dragover.bind(this)
			})*/
		})

		return this
	}
	var _last = (aDocumentSelector)=>
	{
		var targetNodes=document.querySelectorAll(aDocumentSelector)
		targetNodes.forEach((aNode)=>
		{
			aNode.append(fragment)
			/*aNode.querySelectorAll(".ishml-input").forEach((descendant)=>descendant.onkeyup=this.input.bind(this))
			aNode.querySelectorAll(".ishml-choice").forEach((descendant)=>descendant.onclick=this.click.bind(this))
			aNode.querySelectorAll(".ishml-drag").forEach((descendant)=>
			{
				descendant.ondragstart=this.drag.bind(this)
				descendant.draggable=true
			})
			aNode.querySelectorAll(".ishml-drop").forEach((descendant)=>descendant.ondrop=this.drop.bind(this))
		*/
		})
		return this
	}
	var _instead = (aDocumentSelector)=>
	{
		document.querySelectorAll(aDocumentSelector).forEach((aNode) =>
		{
			while(aNode.firstChild){aNode.removeChild(aNode.firstChild)}
			aNode.append(fragment)

			/*aNode.querySelectorAll(".ishml-input").forEach((descendant)=>descendant.onkeyup=this.input.bind(this))
			aNode.querySelectorAll(".ishml-choice").forEach((descendant)=>descendant.onclick=this.click.bind(this))
			aNode.querySelectorAll(".ishml-drag").forEach((descendant)=>
			{
				descendant.ondragstart=this.drag.bind(this)
				descendant.draggable=true
			})
			aNode.querySelectorAll(".ishml-drop").forEach((descendant)=>descendant.ondrop=this.drop.bind(this))
		*/
		})
		return this
	}
	return {first:_first,last:_last,instead:_instead}
}
ishml.Yarn.prototype.restore=function(key)
{
	var yarn = this
	return new Promise(function(resolve, reject)
	{
		
		var db = indexedDB.open("ishml", 1)
		db.onupgradeneeded = function(e)
		{
			this.result.createObjectStore("games", { keyPath: "key" });
			
		}
		db.onerror = function(e)
		{
			console.log("indexedDB: Could not open ishml save game database.")
			reject(e)
		}
		db.onsuccess = function(e)
		{
			var request=this.result.transaction("games").objectStore("games").get(key)
			request.onsuccess= function(e) 
			{
				var game=e.target.result
				if (game)
				{
					yarn.net=game.net
					yarn.seed=game.seed
					yarn.undo=game.undo
					resolve(game)
				}
				else
				{
					reject(e)
				}
			}

			request.onerror = function(e)
			{
				console.log("indexedDB: Could not retrieve ishml saved game from database.")
				reject(e)
			}
			this.result.close()		
		}	
	})
}	

ishml.Yarn.prototype.save=function(key)
{
	var yarn =this
	
	return new Promise(function(resolve,reject)
	{
		var db = indexedDB.open("ishml", 1)
		db.onupgradeneeded = function(e)
		{
			this.result.createObjectStore("games", { keyPath: "key" });
			
		}
		db.onerror = function(e)
		{
			console.log("indexedDB: Could not open ishml save game database.")
			failure(e)
		}
		db.onsuccess = function(e)
		{
			var request = this.result.transaction(["games"], "readwrite")
				.objectStore("games")
				.put({key:key,net:JSON.stringify(yarn.net),seed:ishml.util._seed,undo:yarn.undo})
			
			request.onsuccess = function(e)
			{
				resolve(e)
			} 
			request.onerror = function(e)
			{
				reject(e)
			}

			this.result.close()
		}	 
	})	
}
ishml.Yarn.prototype.tell=function(aStoryline) 
{
	//DEFECT: Save story state + episode to undo spool.
	var storyline=aStoryline || this.storyline
	while(storyline.continues())
	{
		var {plotpoint,twist}=storyline.advance()
		plotpoint.narrate(twist)
	}
}