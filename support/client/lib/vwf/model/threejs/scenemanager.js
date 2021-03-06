var maxObjects = 5; 
var maxDepth = 16;
var batchAtLevel = 8;
var drawSceneManagerRegions = false;
var maxSize = 64000;
function SceneManager(scene)
{
	
}

function GetAllLeafMeshes(threeObject,list)
{
	if(threeObject instanceof THREE.Mesh || threeObject instanceof THREE.Line)
	{
		list.push(threeObject);
	}
	if(threeObject.children)
	{
		for(var i=0; i < threeObject.children.length; i++)
		{
			GetAllLeafMeshes(threeObject.children[i],list);
		}               
	}     
}
SceneManager.prototype.forceBatchAll = function()
{
	var list = [];
	GetAllLeafMeshes(this.scene,list);
	for(var i = 0; i < list.length; i++)
	{
		if(list[i].setStatic)
			list[i].setStatic(true);
	}
}
SceneManager.prototype.forceUnbatchAll = function()
{
	var list = [];
	GetAllLeafMeshes(this.scene,list);
	for(var i = 0; i < list.length; i++)
	{
		if(list[i].setStatic)
			list[i].setStatic(false);
	}
}
SceneManager.prototype.rebuild = function(mo,md)
{
	
	maxObjects = mo;
	maxDepth = md;
	var children = this.root.getChildren();
	this.root.deinitialize();
	this.min = [-maxSize,-maxSize,-maxSize];
	this.max = [maxSize,maxSize,maxSize];
	this.root = new SceneManagerRegion(this.min,this.max,0,this.scene,0);
	for(var i =0; i < children.length; i++)
		this.root.addChild(children[i]);
}
SceneManager.prototype.show = function()
{
	drawSceneManagerRegions = true;
	this.rebuild(maxObjects,maxDepth)
}
SceneManager.prototype.hide = function()
{
	drawSceneManagerRegions = false;
	this.rebuild(maxObjects,maxDepth)
}
SceneManager.prototype.addToRoot = function(child)
{
	this.specialCaseObjects.push(child);
}
SceneManager.prototype.removeFromRoot = function(child)
{
	if(this.specialCaseObjects.indexOf(child) != -1)
		this.specialCaseObjects.splice(this.specialCaseObjects.indexOf(child),1);
}
SceneManager.prototype.CPUPick = function(o,d,opts)
{
	if(d[0] == 0 && d[1] ==0 && d[2] == 0)
		return null;
	//console.profile("PickProfile");

	var hitlist = this.root.CPUPick(o,d,opts || new THREE.CPUPickOptions());
	
	for(var i = 0; i < this.specialCaseObjects.length; i++)
	{
		var childhits = this.specialCaseObjects[i].CPUPick(o,d,opts|| new THREE.CPUPickOptions());
		if(childhits)
			hitlist = hitlist.concat(childhits);
	}
	
	//sort the hits by priority and distance
	hitlist = hitlist.sort(function(a,b){
		var ret = b.priority - a.priority;
		if(ret == 0)
			ret = a.distance - b.distance;
		return ret;
	
	});
	// Enter name of script here
	//console.profileEnd();
	return hitlist[0];
}
SceneManager.prototype.FrustrumCast = function(f,opts)
{
	//console.profile("PickProfile");

	var hitlist = this.root.FrustrumCast(f,opts || new THREE.CPUPickOptions());
	for(var i = 0; i < this.specialCaseObjects.length; i++)
	{
		var childhits = this.specialCaseObjects[i].FrustrumCast(f,opts || new THREE.CPUPickOptions());
		if(childhits)
			hitlist = hitlist.concat(childhits);
	}
	
	return hitlist;
}
SceneManager.prototype.SphereCast = function(center,r,opts)
{
	//console.profile("PickProfile");

	var hitlist = this.root.SphereCast(center,r,opts || new THREE.CPUPickOptions());
	for(var i = 0; i < this.specialCaseObjects.length; i++)
	{
		var childhits = this.specialCaseObjects[i].SphereCast(center,r,opts || new THREE.CPUPickOptions());
		if(childhits)
			hitlist = hitlist.concat(childhits);
	}
	
	return hitlist;
}		
SceneManager.prototype.dirtyObjects = [];
SceneManager.prototype.setDirty = function(object)
{
	if(this.dirtyObjects.indexOf(object) == -1)
	{
		this.dirtyObjects.push(object);
	}	
}
SceneManager.prototype.update = function(dt)
{
	if(!this.initialized) return;
	for(var i = 0; i < this.dirtyObjects.length; i++)
	{
		
		this.dirtyObjects[i].sceneManagerUpdate();
		
	}
	this.dirtyObjects = [];
	for(var i =0; i < this.BatchManagers.length; i++)
	{
		this.BatchManagers[i].update();
	}
	var removelist = [];
	for(var i =0; i < this.tempDebatchList.length; i++)
	{
		
		this.tempDebatchList[i].updateCount -= .5;
		if(this.tempDebatchList[i].updateCount < 0)
		{
			
			removelist.push(i);
			delete this.tempDebatchList[i]._static;
			console.log('Rebatching ' + this.tempDebatchList[i].name);
			this.tempDebatchList[i].sceneManagerUpdate();
		}
	}
	for(var i =0; i < removelist.length; i++)
	{
		this.tempDebatchList.splice(removelist[i],1);
	}
	for(var i =0; i < this.particleSystemList.length; i++)
	{
		this.particleSystemList[i].update(dt);
	}
}
SceneManager.prototype.getTexture = function(src,noclone)
{
	
	var p = window.location.pathname;
	if(p[p.length-1] == '/') {p = p.substring(0,p.length -1)};
	p = p.substring(p.lastIndexOf('/')+1);
	src = src.replace(p,'');
	
	
	if(!this.textureList)
		this.textureList = {};
	if(!this.textureList[src])
	{
	
		var tex = this.textureList[src];
		
		var onload = function(){
		
			if(tex.clones)
			{
				for(var i =0; i < tex.clones.length; i++)
					tex.clones[i].needsUpdate = true;
			
			
			}
		}.bind(this);
		
		this.textureList[src]  = THREE.ImageUtils.loadTexture(src,new THREE.UVMapping(), onload);
		var tex = this.textureList[src];
		tex.clones = [];
		return this.textureList[src];
	}
	var ret = this.textureList[src];
	if(noclone) 
		return ret;
	ret = new THREE.Texture(ret.image);
	ret.needsUpdate  = true;
	this.textureList[src].clones.push(ret);
    return ret;	
}
SceneManager.prototype.initialize = function(scene)
{
	this.min = [-64000,-64000,-64000];
	this.max = [64000,64000,64000];
	this.BatchManagers = [];
	this.specialCaseObjects = [];
	this.tempDebatchList = [];
	this.particleSystemList = [];
	if(!this.textureList)
		this.textureList = {};
	this.initialized = true;
	THREE.Object3D.prototype.add_internal = THREE.Object3D.prototype.add;
	THREE.Object3D.prototype.add = function(child,SceneManagerIgnore)
	{
		
		this.add_internal(child);
		
		
		
		//here, we need to walk up the graph and make sure that at some point, the object is a child of the scene.
		// if it's not, it should not go in the scenemanager.
		var parent = this;
		var found = false;
		while(parent)
		{
			if(parent instanceof THREE.Scene)
			{
				found = true;
				break;
			}else
			{
				parent = parent.parent;
			}
		}
		if(!found) return;
		
		if(SceneManagerIgnore)
			return;
		
		var list = [];
		GetAllLeafMeshes(child,list);
		for(var i =0; i < list.length; i++)
		{
			_SceneManager.addChild(list[i]);
		}
		
		
	}
	THREE.Object3D.prototype.remove_internal = THREE.Object3D.prototype.remove;
	THREE.Object3D.prototype.remove = function(child,SceneManagerIgnore)
	{
		
		var meshes = [];
		
		this.remove_internal(child);
		
		if(SceneManagerIgnore)
			return;
		
		GetAllLeafMeshes(child,meshes);		
		for(var i =0; i < meshes.length; i++)
		{
			meshes[i].sceneManagerDelete();
			//_SceneManager.removeChild(meshes[i]);
		}
	}
	THREE.Mesh.prototype.materialUpdated = function()
	{
		if(!this.updateCount)
			this.updateCount = 1;
		this.updateCount++;	
		if(this.updateCount == 100)
		{
			console.log(this.name + ' is not static, debatching');
			this._static = false;
			if(this.RenderBatchManager)
				this.RenderBatchManager.remove(this);
			
			_SceneManager.tempDebatchList.push(this);	
			return;	
		}	
				
		if(this.RenderBatchManager)
			this.RenderBatchManager.materialUpdated(this);
	}
	THREE.Line.prototype.materialUpdated = THREE.Mesh.prototype.materialUpdated;
	THREE.Object3D.prototype.setStatic = function(_static)
	{
		if(this.isDynamic && this.isDynamic()) return;
		this._static = _static;
		this.sceneManagerUpdate();
	}
	THREE.Object3D.prototype.setDynamic = function(_dynamic)
	{
		if(this.dynamic == _dynamic) return;
		this._dynamic = _dynamic;
		this._static = false;
		if(this._dynamic)
		{
			this.sceneManagerDelete();
			_SceneManager.addToRoot(this);
		}else
		{
			_SceneManager.removeFromRoot(this);
			var list = [];
			GetAllLeafMeshes(this,list);
			for(var i =0; i < list.length; i++)
			{
				_SceneManager.addChild(list[i]);
			}
			this.sceneManagerUpdate();
		}
	}
	THREE.Object3D.prototype.isStatic = function()
	{
		if(this._static != undefined)
			return this._static;
		return (this.parent && this.parent.isStatic());
	}
	THREE.Object3D.prototype.isDynamic = function()
	{
		if(this._dynamic != undefined)
			return this._dynamic;
		return (this.parent && this.parent.isDynamic());
	}
	THREE.Object3D.prototype.sceneManagerUpdate = function()
	{
		if(this.isDynamic && this.isDynamic()) return;
		for(var i =0; i <  this.children.length; i++)
		{
			this.children[i].sceneManagerUpdate();
		}
		
	}
	THREE.Object3D.prototype.sceneManagerDelete = function()
	{
		for(var i =0; i <  this.children.length; i++)
		{
			this.children[i].sceneManagerDelete();
		}
		
	}
	THREE.Object3D.prototype.sceneManagerIgnore = function()
	{
		for(var i =0; i <  this.children.length; i++)
		{
			this.children[i].sceneManagerIgnore();
		}
		
	}
	THREE.Mesh.prototype.sceneManagerIgnore = function()
	{
		_SceneManager.removeChild(this);
		this.SceneManagerIgnore = true;
	}
	this.root = new SceneManagerRegion(this.min,this.max,0,scene,0);
	this.scene = scene;
}
SceneManager.prototype.addChild = function(c)
{
	
	this.root.addChild(c);
}
SceneManager.prototype.removeChild = function(c)
{
	this.root.removeChild(c);
}
function SceneManagerRegion(min, max, depth,scene,order)
{
	
	this.min = min;
	this.max = max;
	this.childCount = 0;
	this.c = [(this.max[0]+this.min[0])/2,(this.max[1]+this.min[1])/2,(this.max[2]+this.min[2])/2];
	this.childRegions = [];
	this.childObjects = [];
	this.depth = depth;
	this.scene = scene;
	this.order = order;
	if(drawSceneManagerRegions)
	{
		this.mesh = new THREE.Mesh(new THREE.CubeGeometry(this.max[0]-this.min[0],this.max[0]-this.min[0],this.max[0]-this.min[0]),new THREE.MeshBasicMaterial(0xFF0000));
		this.mesh.material.wireframe = true;
		this.mesh.material.depthTest = false;
		this.mesh.material.depthWrite = false;
		this.mesh.material.transparent = true;
		this.mesh.material.color.r = (this.depth/maxDepth) * 2;
		this.mesh.material.color.g = 0;
		this.mesh.material.color.b = 0;
		this.mesh.position.x = this.c[0];
		this.mesh.position.y = this.c[1];
		this.mesh.position.z = this.c[2];
		this.mesh.InvisibleToCPUPick =  true;
		this.mesh.renderDepth = this.depth * 8 + this.order;
		this.scene.add(this.mesh,true);
	}
	if(this.depth <= batchAtLevel)
	{
		this.RenderBatchManager = new THREE.RenderBatchManager(scene,GUID());
		_SceneManager.BatchManagers.push(this.RenderBatchManager);
	}
}
SceneManagerRegion.prototype.deinitialize = function()
{
	if(this.mesh)
		this.mesh.parent.remove(this.mesh,true);
	for(var i=0; i < this.childRegions.length; i++)
	{
		this.childRegions[i].deinitialize();
	}
	if(this.RenderBatchManager)
	{
		_SceneManager.BatchManagers.splice(_SceneManager.BatchManagers.indexOf(this.RenderBatchManager),1);
		this.RenderBatchManager.deinitialize();
	}
}


SceneManagerRegion.prototype.getChildren = function()
{
	var count = [];
	for(var i=0; i < this.childRegions.length; i++)
	{
		count = count.concat(this.childRegions[i].getChildren());
	}
	return count.concat(this.childObjects);
}

SceneManagerRegion.prototype.getChildCount = function()
{
	//can we keep track without the recursive search?
	//return this.childCount;
	
	var count = 0;
	for(var i=0; i < this.childRegions.length; i++)
	{
		count += this.childRegions[i].getChildCount();
	}
	return count + this.childObjects.length;
}
SceneManagerRegion.prototype.removeChild= function(child)
{
	var removed = false;
	if(this.childObjects.indexOf(child) != -1)
	{
		removed = true;
		this.childCount--;
		this.childObjects.splice(this.childObjects.indexOf(child),1);
		
		if(this.RenderBatchManager)
		{
			
			this.RenderBatchManager.remove(child);
		}
		
	}
	else
	{
		for(var i=0; i < this.childRegions.length; i++)
		{
			removed = this.childRegions[i].removeChild(child);
			if(removed)
			{
				this.childCount--;
				break;	
			}
		}
	}
	if(this.getChildCount() <= maxObjects)
			this.desplit();
	return 	removed;	
}
SceneManagerRegion.prototype.desplit = function()
{
	var children = this.getChildren();
	for(var i=0; i < this.childRegions.length; i++)
	{
		this.childRegions[i].deinitialize();
	}
	this.childObjects = children;
	for(var j = 0; j < children.length; j++)
	{
		children[j].sceneManagerNode = this;
		//this.updateObject(children[j]);
		
		
		if(children[j].isStatic())
		{
			
				//search up for the lowest level batch manager I fit in
				var p = this;
				var found = false;
				while(!found && p)
				{
					if(p.RenderBatchManager)
					{
						found = true;
						break;
					}
					p = p.parent;
				
				}
				
				//remove me from my old batch, if any
				if(children[j].RenderBatchManager)
					children[j].RenderBatchManager.remove(children[j]);
				
				//add to the correct batch, if I'm static
			    p.RenderBatchManager.add(children[j]);	
			
		}
		
	}
	
	this.childRegions = [];
}
SceneManagerRegion.prototype.completelyContains = function(object)
{
	
	//changing transforms make this cache not work
	if(!object.tempbounds) 
	{
		object.updateMatrixWorld();
		
		object.tempbounds = object.GetBoundingBox(true).transformBy(object.getModelMatrix());
	}
	var box = object.tempbounds;
	if(box.min[0] > this.min[0] && box.max[0] < this.max[0])
	if(box.min[1] > this.min[1] && box.max[1] < this.max[1])
	if(box.min[2] > this.min[2] && box.max[2] < this.max[2])
		return true;
	return false;	
}
SceneManagerRegion.prototype.addChild= function(child)
{
	//sort the children down into sub nodes
	var added = this.distributeObject(child);
	
	if(child.isStatic())
	{
	if(this.depth == batchAtLevel && added)
	{
		this.RenderBatchManager.add(child);
	}
	if(this.depth >= 0 && this.depth <= batchAtLevel && !added)
	{
		this.RenderBatchManager.add(child);
	}
	}
}
SceneManagerRegion.prototype.distributeObject = function(object)
{
	var added = false;
	if(this.childObjects.length + 1 > maxObjects && this.depth < maxDepth && this.childRegions.length == 0)
		this.split();
	if(this.childRegions)
	{
		for(var i = 0; i < this.childRegions.length; i++)
		{
			if(this.childRegions[i].completelyContains(object))
			{
				this.childRegions[i].addChild(object);
				added = true;
				//it either goes in me or my children
				this.childCount++;
				break;
			}
		}
	}
	if(!added)
	{
		if(this.childObjects.indexOf(object) == -1)
		{
			this.childObjects.push(object);
			//it either goes in me or my children
				this.childCount++;
			if(this.mesh)
			{
				this.mesh.material.color.g = this.childObjects.length / maxObjects;
				this.mesh.renderDepth = this.depth * 8 + this.order + this.childObjects.length;
			}
			
			object.sceneManagerNode = this;
			
			object.sceneManagerUpdate = function()
			{
				if(this.SceneManagerIgnore)
					return;
				
				if(!this.updateCount)
					this.updateCount = 1;
				this.updateCount++;	
				if(this.updateCount == 100 && this.isStatic())
				{
					console.log(this.name + ' is not static, debatching');
					this._static = false;
					_SceneManager.tempDebatchList.push(this);
				}	
				
				this.updateMatrixWorld();
				this.tempbounds = object.GetBoundingBox(true).transformBy(this.getModelMatrix());
				this.sceneManagerNode.updateObject(this);
			}.bind(object)
			object.sceneManagerDelete = function()
			{
				
				if(this.RenderBatchManager)
					this.RenderBatchManager.remove(this);
				_SceneManager.removeChild(this);
			}.bind(object)
		}
	}
	return added;
}
SceneManagerRegion.prototype.updateObject = function(object)
{
	//the object has not crossed  into a new region, so no need to search up
	if(this.completelyContains(object))
	{
		if(this.childObjects.indexOf(object) != -1)
			this.removeChild(object)
		
		
		this.addChild(object);
		
		if(!this.RenderBatchManager)
		{
			//search up for the lowest level batch manager I fit in
			var p = this;
			var found = false;
			while(!found && p)
			{
				if(p.RenderBatchManager)
				{
					found = true;
					break;
				}
				p = p.parent;
			
			}
			
			//remove me from my old batch, if any
			if(object.RenderBatchManager)
				object.RenderBatchManager.remove(object);
			
			//add to the correct batch, if I'm static
			if(object.isStatic())	
				p.RenderBatchManager.add(object);	
		}
	}
	//the object has left the region, search up.
	else
	{
		//if dont have parent, then at top level and cannot toss up
		if(this.parent)
		{
			this.removeChild(object);
			this.parent.updateObject(object);
		}
	}
}
SceneManagerRegion.prototype.split = function()
{
	
	var v0 = [this.min[0],this.min[1],this.min[2]];
	var v0 = [this.min[0],this.min[1],this.min[2]];
	var v1 = [this.min[0],this.min[1],this.max[2]];
	var v2 = [this.min[0],this.max[1],this.min[2]];
	var v3 = [this.min[0],this.max[1],this.max[2]];
	var v4 = [this.max[0],this.min[1],this.min[2]];
	var v5 = [this.max[0],this.min[1],this.max[2]];
	var v6 = [this.max[0],this.max[1],this.min[2]];
	var v7 = [this.max[0],this.max[1],this.max[2]];
	
	this.c = [(this.max[0]+this.min[0])/2,(this.max[1]+this.min[1])/2,(this.max[2]+this.min[2])/2];
	
	this.r = MATH.distanceVec3(this.c,this.max);
	
	var m1 = [this.c[0],this.min[1],this.min[2]];
	var m2 = [this.max[0],this.c[1],this.c[2]];
	var m3 = [this.min[0],this.c[1],this.min[2]];
	var m4 = [this.c[0],this.max[1],this.c[2]];
	var m5 = [this.c[0],this.c[1],this.min[2]];
	var m6 = [this.max[0],this.max[1],this.c[2]];
	var m7 = [this.min[0],this.min[1],this.c[2]];
	var m8 = [this.c[0],this.c[1],this.max[2]];
	var m9 = [this.c[0],this.min[1],this.c[2]];
	var m10 = [this.max[0],this.c[1],this.max[2]];
	var m11 = [this.min[0],this.c[1],this.c[2]];
	var m12 = [this.c[0],this.max[1],this.max[2]];
	
	this.childRegions[0] = new SceneManagerRegion(v0,this.c,this.depth+1,this.scene,0);
	this.childRegions[1] = new SceneManagerRegion(m1,m2,this.depth+1,this.scene,1);
	this.childRegions[2] = new SceneManagerRegion(m3,m4,this.depth+1,this.scene,2);
	this.childRegions[3] = new SceneManagerRegion(m5,m6,this.depth+1,this.scene,3);
	this.childRegions[4] = new SceneManagerRegion(m7,m8,this.depth+1,this.scene,4);
	this.childRegions[5] = new SceneManagerRegion(m9,m10,this.depth+1,this.scene,5);
	this.childRegions[6] = new SceneManagerRegion(m11,m12,this.depth+1,this.scene,6);
	this.childRegions[7] = new SceneManagerRegion(this.c,v7,this.depth+1,this.scene,7);
	
	this.childRegions[0].parent = this;
	this.childRegions[1].parent = this;
	this.childRegions[2].parent = this;
	this.childRegions[3].parent = this;
	this.childRegions[4].parent = this;
	this.childRegions[5].parent = this;
	this.childRegions[6].parent = this;
	this.childRegions[7].parent = this;
	
	//if I have faces, but I split, I need to distribute my faces to my children
	var objectsBack = this.childObjects;
	this.childObjects = [];
	for(var i = 0; i < objectsBack.length; i++)
	{
	   if(this.RenderBatchManager)
		  this.RenderBatchManager.remove(objectsBack[i]);
	   var added = this.distributeObject(objectsBack[i]);
	   if(!added)
	   {
		   if(this.RenderBatchManager)
				if(objectsBack[i].isStatic())
					this.RenderBatchManager.add(objectsBack[i]);
	   }
	}
	
	this.isSplit = true;	
}

SceneManagerRegion.prototype.contains = function(o)
{
	if(o[0] > this.min[0] && o[0] < this.max[0])
	if(o[1] > this.min[1] && o[1] < this.max[1])
	if(o[2] > this.min[2] && o[2] < this.max[2])
		return true;
	return false;	
}

//Test a ray against an octree region
SceneManagerRegion.prototype.CPUPick = function(o,d,opts)
{
	
	var hits = [];
	//if no faces, can be no hits. 
	//remember, faces is all faces in this node AND its children
	if(this.getChildCount().length == 0)
		return hits;
		
	//reject this node if the ray does not intersect it's bounding box
	if(this.testBoundsRay(o,d).length == 0)
		return hits;
	
	//the the opts specify a max dist
	//if the start is not in me, and im to far, don't bother with my children or my objcts
	if(opts.maxDist > 0 && this.r + MATH.distanceVec3(o,this.c) > opts.maxDist)
	{
		
		if(!this.contains(o))
			return hits;
	}	
	
	//check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
	//for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
	for(var i = 0; i < this.childRegions.length; i++)
	{
		var childhits = this.childRegions[i].CPUPick(o,d,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	for(var i = 0; i < this.childObjects.length; i++)
	{
		
		var childhits = this.childObjects[i].CPUPick(o,d,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	return hits;
	
}

//Test a ray against an octree region
SceneManagerRegion.prototype.FrustrumCast = function(frustrum,opts)
{
	
	var hits = [];
	//if no faces, can be no hits. 
	//remember, faces is all faces in this node AND its children
	if(this.getChildCount().length == 0)
		return hits;
		
	//reject this node if the ray does not intersect it's bounding box
	if(this.testBoundsFrustrum(frustrum).length == 0)
		return hits;
	
	//the the opts specify a max dist
	//if the start is not in me, and im to far, don't bother with my children or my objcts
	if(opts.maxDist > 0 && this.r + MATH.distanceVec3(o,this.c) > opts.maxDist)
	{
		if(!this.contains(o))
			return hits;
	}	
	
	//check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
	//for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
	for(var i = 0; i < this.childRegions.length; i++)
	{
		var childhits = this.childRegions[i].FrustrumCast(frustrum,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	for(var i = 0; i < this.childObjects.length; i++)
	{
		var childhits = this.childObjects[i].FrustrumCast(frustrum,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	return hits;
}

//Test a ray against an octree region
SceneManagerRegion.prototype.SphereCast = function(center,r,opts)
{
	
	var hits = [];
	//if no faces, can be no hits. 
	//remember, faces is all faces in this node AND its children
	if(this.getChildCount().length == 0)
		return hits;
		
	//reject this node if the ray does not intersect it's bounding box
	if(this.testBoundsSphere(center,r).length == 0)
		return hits;
	
	//the the opts specify a max dist
	//if the start is not in me, and im to far, don't bother with my children or my objcts
	if(opts.maxDist > 0 && this.r + MATH.distanceVec3(o,this.c) > opts.maxDist)
	{
		if(!this.contains(o))
			return hits;
	}	
	
	//check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
	//for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
	for(var i = 0; i < this.childRegions.length; i++)
	{
		var childhits = this.childRegions[i].SphereCast(center,r,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	for(var i = 0; i < this.childObjects.length; i++)
	{
		var childhits = this.childObjects[i].SphereCast(center,r,opts);
		if(childhits)
			hits = hits.concat(childhits);
	}
	return hits;
}

SceneManagerRegion.prototype.testBoundsRay = BoundingBoxRTAS.prototype.intersect;
SceneManagerRegion.prototype.testBoundsSphere = BoundingBoxRTAS.prototype.intersectSphere;
SceneManagerRegion.prototype.intersect = BoundingBoxRTAS.prototype.intersect;
SceneManagerRegion.prototype.testBoundsFrustrum = BoundingBoxRTAS.prototype.intersectFrustrum;

_SceneManager = new SceneManager();





















THREE.RenderBatch = function(material,scene)
{
	this.objects = [];
	this.material = material;
	this.dirty = false;
	this.scene = scene;
	this.totalVerts = 0;
	this.totalFaces = 0;
}
THREE.RenderBatch.prototype.addObject = function(object)
{
	if(this.objects.indexOf(object) == -1)
	{
		this.totalVerts += object.geometry.vertices.length;
		this.totalFaces += object.geometry.faces.length;
		this.objects.push(object);
		
		this.dirty = true;
	}
	
}
THREE.RenderBatch.prototype.removeObject = function(object)
{
	if(this.objects.indexOf(object) != -1)
	{
		this.totalVerts -= object.geometry.vertices.length;
		this.totalFaces -= object.geometry.faces.length;
		this.objects.splice(this.objects.indexOf(object),1);
		this.dirty = true;
	}
	
}
THREE.RenderBatch.prototype.update = function()
{
	
	if(this.dirty)
		this.build();
	this.dirty = false;	
}
THREE.RenderBatch.prototype.checkSuitability = function(object)
{
	if(this.totalFaces + object.geometry.faces.length > 32767 || this.totalVerts + object.geometry.vertices.length > 32767) return false;
	return compareMaterials(this.material,object.material);
}
THREE.RenderBatch.prototype.deinitialize = function()
{
	if(this.mesh)
		this.scene.remove_internal(this.mesh);
}
THREE.RenderBatch.prototype.build = function()
{
	console.log('Building batch ' + this.name + ' : objects = ' + this.objects.length); 
	
	//do the merge:
	if(this.mesh)
		this.scene.remove_internal(this.mesh);
	
	if(this.objects.length == 0) return;	
	
	this.mesh = null;
    var geo = new THREE.Geometry();
	this.mesh = new THREE.Mesh(geo,this.objects[0].material.clone());
	this.mesh.castShadow=true;
	this.mesh.receiveShadow=true;
	this.scene.add_internal(this.mesh);
	
	var totalUVSets = 1;
	
	
	for(var i =0; i < this.objects.length; i++)
	{
		totalUVSets = Math.max(totalUVSets,this.objects[i].geometry.faceVertexUvs.length);
	}
	console.log(totalUVSets);
	for(var i = 0; i < totalUVSets; i++)
	{
		geo.faceVertexUvs[i] = [];
	}
	for(var i =0; i < this.objects.length; i++)
	{
		
		var tg = this.objects[i].geometry;
		var matrix = this.objects[i].matrixWorld.clone();
		var normalMatrix = new THREE.Matrix3();
		normalMatrix.getInverse(matrix);
		normalMatrix.transpose();
		//normalMatrix.elements[3] = normalMatrix.elements[7] = normalMatrix.elements[11] = 0;
		if(tg)
		{	
			
			for(var j = 0; j < tg.faces.length; j++)
			{
				var face = tg.faces[j];
				var newface;
				if(face.d !== undefined)
					newface = new THREE.Face4();
				else
					newface = new THREE.Face3();
					
				newface.a = face.a + geo.vertices.length;	
				newface.b = face.b + geo.vertices.length;
				newface.c = face.c + geo.vertices.length;
				if(face.d !== undefined)
					newface.d = face.d + geo.vertices.length;

				//newface.materialIndex = face.materialIndex;
				newface.centroid.copy( face.centroid );
				newface.normal.copy(face.normal);		
				newface.normal.applyMatrix3( normalMatrix ).normalize();
				for(var k = 0; k < face.vertexNormals.length; k++)
					newface.vertexNormals.push(face.vertexNormals[k].clone().applyMatrix3(normalMatrix).normalize());
				
				geo.faces.push(newface);
			
			}
			for(var j = 0; j < tg.vertices.length; j++)
			{
				geo.vertices.push(tg.vertices[j].clone().applyMatrix4(matrix));
			}
			
			for(var j = 0; j < tg.normals.length; j++)
			{
				geo.normals.push(tg.normals[j].clone().applyMatrix4(matrix));
			}
			
			
			for(var l = 0; l < totalUVSets; l++)
			{
				var uvs2 = tg.faceVertexUvs[ l ];
				
				if(uvs2 && uvs2.length === tg.faces.length)
				{
					for ( u = 0, il = uvs2.length; u < il; u ++ ) 
					{

						var uv = uvs2[ u ], uvCopy = [];

						for ( var j = 0, jl = uv.length; j < jl; j ++ ) {

							uvCopy.push( new THREE.Vector2( uv[ j ] ? uv[ j ].x : 0, uv[ j ] ? uv[ j ].y : 0 ) );

						}

						geo.faceVertexUvs[l].push( uvCopy );

					}
				}
				else
				{
					for ( u = 0, il = tg.faces.length; u < il; u ++ )
					{

						var count = 3;
						if(tg.faces[u].d !== undefined)
							count = 4;

						var uvCopy = [];
						for ( var j = 0, jl = count; j < jl; j ++ ) {

							uvCopy.push( new THREE.Vector2( 0,0) );

						}

						geo.faceVertexUvs[l].push( uvCopy );

					}
				
				}
			}
		}
	}
	geo.computeBoundingSphere();
	geo.computeBoundingBox();
}

function compareMaterials(m1,m2)
{
	
	var delta = 0;
	delta += Math.abs(m1.color.r - m2.color.r);
	delta += Math.abs(m1.color.g - m2.color.g);
	delta += Math.abs(m1.color.b - m2.color.b);
	
	delta += Math.abs(m1.ambient.r - m2.ambient.r);
	delta += Math.abs(m1.ambient.g - m2.ambient.g);
	delta += Math.abs(m1.ambient.b - m2.ambient.b);
	
	delta += Math.abs(m1.emissive.r - m2.emissive.r);
	delta += Math.abs(m1.emissive.g - m2.emissive.g);
	delta += Math.abs(m1.emissive.b - m2.emissive.b);
	
	delta += Math.abs(m1.specular.r - m2.specular.r);
	delta += Math.abs(m1.specular.g - m2.specular.g);
	delta += Math.abs(m1.specular.b - m2.specular.b);
	
	delta += Math.abs(m1.opacity - m2.opacity);
	
	delta += Math.abs(m1.transparent - m2.transparent);
	
	delta += Math.abs(m1.shininess - m2.shininess);
	
	delta += Math.abs(m1.reflectivity - m2.reflectivity);
	delta += Math.abs(m1.alphaTest - m2.alphaTest);	
	delta += Math.abs(m1.bumpScale - m2.bumpScale);	
	delta += Math.abs(m1.normalScale.x - m2.normalScale.x);
	delta += Math.abs(m1.normalScale.y - m2.normalScale.y);
	delta += m1.side != m2.side ? 1000 : 0;
		var mapnames = ['map','bumpMap','lightMap','normalMap','specularMap'];
        for(var i =0; i < mapnames.length; i++)
        {
				var mapname = mapnames[i];
				
				
				
				
				
				if(m1[mapname] && !m2[mapname])
				{
					delta += 1000;
				}
				if(!m1[mapname] && m2[mapname])
				{
					delta += 1000;
				}
				if(m1[mapname] && m2[mapname])
				{
					if(m1[mapname].image.src.toString() != m2[mapname].image.src.toString())
						delta += 1000;
				
				
               
                delta += m1[mapname].wrapS != m1[mapname].wrapS;
				delta += m1[mapname].wrapT != m1[mapname].wrapT;
                delta += Math.abs(m1[mapname].mapping.constructor != m2[mapname].mapping.constructor) * 1000;	
				delta += Math.abs(m1[mapname].repeat.x - m2[mapname].repeat.x);
				delta += Math.abs(m1[mapname].repeat.y - m2[mapname].repeat.y);
				delta += Math.abs(m1[mapname].offset.x - m2[mapname].offset.x);
				delta += Math.abs(m1[mapname].offset.y - m2[mapname].offset.y);
				}
			
        }
   		
	if(delta < .001)
		return true;
	return false;	


}


THREE.RenderBatchManager = function(scene,name)
{
	this.scene = scene;
	this.name = name;
	this.objects = [];
	this.batches = [];
	
}

THREE.RenderBatchManager.prototype.update = function()
{
	
	if(this.dirty)
		for(var i =0; i < this.batches.length; i++)
			this.batches[i].update(); 
	this.dirty = false;		
}

THREE.RenderBatchManager.prototype.add = function(child)
{
	
	//if(this.objects.indexOf(child) != -1)
	//	return;
		
	if(child.RenderBatchManager)
		child.RenderBatchManager.remove(child);
	
	
	
	this.objects.push(child);
	child.visible = false;

	child.RenderBatchManager = this;
	
	var added = false;
	for(var i = 0; i < this.batches.length; i++)
	{
		if(this.batches[i].checkSuitability(child))
		{
			this.batches[i].addObject(child);
			if(!child.reBatchCount)
				child.reBatchCount = 0;
			child.reBatchCount++;	
			added = true;
		}
	}
	if(!added)
	{
		var newbatch = new THREE.RenderBatch(child.material.clone(),this.scene);
		newbatch.addObject(child);
		this.batches.push(newbatch);
	}
	
//	console.log('adding ' + child.name + ' to batch' + this.name);  
	this.dirty = true;
}

THREE.RenderBatchManager.prototype.remove = function(child)
{
	
	if(this.objects.indexOf(child) == -1)
		return;
	
	child.visible = true;
	child.RenderBatchManager = null;
//	console.log('removing ' + child.name + ' from batch' + this.name);  
	this.objects.splice(this.objects.indexOf(child),1);
	
	var indexToDelete = [];
	for(var i = 0; i < this.batches.length; i++)
	{
		this.batches[i].removeObject(child);
		if(this.batches[i].objects.length == 0)
			indexToDelete.push(i);
	}
	for(var i = 0; i < indexToDelete.length; i++)
	{
		this.batches[indexToDelete[i]].deinitialize();
		this.batches.splice(indexToDelete[i],1);
	}
	this.dirty = true;
}

THREE.RenderBatchManager.prototype.materialUpdated = function(child)
{
	if(this.objects.indexOf(child) == -1)
	{
		console.log('Should have never got here. Updating material in batch taht does not contain object');
		return;
	}
	this.remove(child);
	this.add(child);
}
THREE.RenderBatchManager.prototype.deinitialize = function(child)
{
	
	if(this.mesh)
		this.scene.remove_internal(this.mesh);
	for(var i = 0; i < this.batches.length; i++)
	{
		this.batches[i].deinitialize();
	}	
}