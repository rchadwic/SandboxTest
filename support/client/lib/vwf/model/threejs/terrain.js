(function(){
	function terrain(childID, childSource, childName)
	{
		
		var self = this;
		var totalmintilesize = 16;
		var tileres = 16;
		var minTileSize = totalmintilesize;
		var maxTileSize = 2048;
		var worldExtents = 2048;
		var updateEvery = 15;
		
		
		function loadScript	(url)
		{
			
			var xhr = $.ajax(url,{async:false});
			return eval(xhr.responseText);

		}
		
		loadScript(   "vwf/model/threejs/terrainTileCache.js");
		loadScript(   "vwf/model/threejs/terrainQuadtree.js");
		
		
		this.settingProperty = function(propertyName,propertyValue)
		{
			if(propertyName == 'controlPoints')
			{
				this.controlPoints = propertyValue;
				
			}
		}
		
		this.initializingNode = function()
		{
			window.requestAnimationFrame(this.update);
			vwf.setProperty(this.ID,'controlPoints',this.controlPoints);
			Math.sign = function(e){ return e<0?-1:1};
			
			
			quadtreesetSelf(this);	
			quadtreesetRes(tileres);
			self.TileCache = new TileCache();
			
			this.terrainGenerator = loadScript("vwf/model/threejs/terrainGenerator.js");
			
			self.TileCache.terrainGenerator = this.terrainGenerator;
			
			this.terrainType = 'NoiseTerrainAlgorithm';
			this.terrainParams = 12312;
			
			this.terrainGenerator.init(this.terrainType,this.terrainParams);
			this.DisableTransform();
			
			this.quadtree = new QuadtreeNode([-worldExtents,-worldExtents],[worldExtents,worldExtents],this.getRoot(),0,-1,minTileSize,maxTileSize);
			
			
			this.quadtree.update([[1,1]],[]);
			
			
			//this.quadtree.updateMesh();
			window.terrain = self;
			this.counter = 0;
			
			this.getRoot().FrustrumCast = function(frustrum,opts){return {};};
			this.getRoot().CPUPick = function(o,d,opts){
				
				var node = self.quadtree.containing(o);;
				if(!node) return;
				var mesh = node.mesh;
				if(mesh)
				return mesh.CPUPick(o,d,opts);
				
				return [];
				
			}
			
			_SceneManager.specialCaseObjects.push(this.getRoot());
			
		}
		this.setAlgorithmParams = function(data)
		{
			this.terrainGenerator.setAlgorithmParams(data);
			this.rebuildAll();
		}
		this.getAlgorithmParams = function()
		{
			return this.terrainGenerator.getAlgorithmParams();
		}
		this.setMeshParams = function(min,max,size,res)
		{
			totalmintilesize = min;
			minTileSize = totalmintilesize;
			tileres = res;
			maxTileSize = max;
			worldExtents = size;
			this.cancelUpdates();
			this.quadtree.walk(function(n)
			{
				if(n.mesh)
					self.TileCache.returnMesh(n.mesh);
			});
			quadtreesetRes(tileres);
			this.quadtree = new QuadtreeNode([-worldExtents,-worldExtents],[worldExtents,worldExtents],this.getRoot(),0,-1,minTileSize,maxTileSize);
			this.terrainGenerator.reInit(this.terrainType,this.terrainParams);
			this.TileCache.clear();
		}
		this.setTerrainAlgorithm = function(algo,params)
		{
			this.cancelUpdates();
			this.terrainType = algo;
			this.terrainParams = params;
			this.terrainGenerator.reInit(this.terrainType,this.terrainParams);
			this.TileCache.clear();
			
			this.quadtree.walk(function(n)
			{
				if(n.mesh)
					self.TileCache.returnMesh(n.mesh);
			});
			quadtreesetRes(tileres);
			this.quadtree = new QuadtreeNode([-worldExtents,-worldExtents],[worldExtents,worldExtents],this.getRoot(),0,-1,minTileSize,maxTileSize);
			
		}
		this.cancelUpdates =function()
		{
			self.needRebuild = [];
			self.terrainGenerator.cancel();
			
			this.quadtree.walk(function(n)
			{
				if(n.waitingForRebuild)
				debugger;
				if(n.fadelist)
				{
					n.fadelist.forEach(function(e)
					{
						if(e.parent)
						{
							e.parent.remove(e);
							self.TileCache.returnMesh(e);
							e.quadnode = null;
						}
						window.cancelAnimationFrame(e.fadeHandle);
					});
					n.fadelist = null;
					if(n.mesh)
					n.mesh.visible = true;
				}
				
			});
			
			this.quadtree.walk(function(n)
			{
				if(n.setForDesplit)
				delete n.setForDesplit;
				if(n.mesh && n.mesh.visible == false)
				{
					if(n.mesh.parent)
					{
						n.mesh.parent.remove(n.mesh);
						self.TileCache.returnMesh(n.mesh);
					}
					n.mesh.quadnode = null;
					n.mesh.visible = true;
					n.mesh = null;
				}
				if(n.backupmesh)
				{
					n.mesh = n.backupmesh;
					n.mesh.quadnode = n;
					delete n.backupmesh;
				}
				delete n.oldmesh;
				delete n.waiting_for_rebuild;
				
			});
			this.quadtree.walk(function(n)
			{
				
				if(n.isSplit() && n.mesh)
				{
					var list = [];
					n.children[0].destroy(list);
					n.children[1].destroy(list);
					n.children[2].destroy(list);
					n.children[3].destroy(list);
					n.children = [];
					list.forEach(function(e)
					{
						e.quadnode = null;
						if(e.parent)
						{
							e.parent.remove(e);
							self.TileCache.returnMesh(e);
						}
					});
				}
				
				
			});
			this.quadtree.walk(function(n)
			{
				
				if(n.mesh)
				{
					n.mesh.material.uniforms.blendPercent.value = 1;
				}
				
				
			});
		}
		this.removelist = [];
		this.containingList = [];
		self.needRebuild = [];
		this.enabled = true;
		this.BuildTerrainInner= function(mesh,normlen,cb)
		{
			this.terrainGenerator.generateTerrain(mesh,normlen,cb);
		}
		this.rebuildAll = function()
		{
			this.cancelUpdates();
			this.quadtree.walk(function(n){
			
				if(n.mesh)
					self.needRebuild.push(n);
			
			});
			self.rebuild(true);	
		
		}
		this.update = function()
		{
			window.requestAnimationFrame(this.update);
			this.counter ++;
			if(this.counter >= updateEvery && this.enabled)
			{
				this.counter = 0;
				
				var campos = _Editor.findcamera().position;
				var x = campos.x;
				var y = campos.y;
				
				var hit = this.getRoot().CPUPick([x,y,10000],[0,0,-1],{});
				var height = 0;
				if(hit && hit[0])
				height = hit[0].point[2];
				var minRes = Math.pow(2,Math.floor(Math.log(Math.max(1.0,campos.z - height))/Math.LN2)-1);
				minTileSize = Math.max(minRes,totalmintilesize);
				var maxRes = Math.pow(2,Math.floor(Math.log(campos.z)/Math.LN2)+4);
				if((this.containingList.indexOf(this.quadtree.containing([x,y])) == -1 || this.currentMinRes != minTileSize))
				{
					
					
					
					
					this.currentMinRes = minTileSize;
					//maxTileSize = Math.max(maxRes,2048);
					this.quadtree.updateMinMax(minTileSize,maxTileSize);
					//cant resize the max side on the fly -- tiles in update have already made choice
					
					if (self.needRebuild.length > 0 || this.terrainGenerator.countBusyWorkers() > 0)
					{	
						this.cancelUpdates();
						//wait for next loop
						return;
					}
					
					
					
					this.quadtree.update([[x,y]],this.removelist);
					
					
					
					var cont = this.quadtree.containing([x,y]);
					if(!cont) return;
					this.containing = cont.parent;
					
					
					
					
					while(this.containing.NN() && this.containing.NN().depth != this.containing.depth)
					this.containing.NN().split(this.removelist);
					while(this.containing.SN() && this.containing.SN().depth != this.containing.depth)
					this.containing.SN().split(this.removelist);
					while(this.containing.EN() && this.containing.EN().depth != this.containing.depth)
					this.containing.EN().split(this.removelist);
					while(this.containing.WN() && this.containing.WN().depth != this.containing.depth)
					this.containing.WN().split(this.removelist);
					
					
					while(this.containing.NEN() &&  this.containing.NEN().depth != this.containing.depth)
					this.containing.NEN().split(this.removelist);
					while(this.containing.SEN() && this.containing.SEN().depth != this.containing.depth)
					this.containing.SEN().split(this.removelist);
					while(this.containing.SWN() && this.containing.SWN().depth != this.containing.depth)
					this.containing.SWN().split(this.removelist);
					while(this.containing.NWN() && this.containing.NWN().depth != this.containing.depth)
					this.containing.NWN().split(this.removelist);
					
					if(this.containing.NN())
					this.containing.NN().split(this.removelist);
					if(this.containing.EN())
					this.containing.EN().split(this.removelist);
					if(this.containing.WN())
					this.containing.WN().split(this.removelist);
					if(this.containing.SN())
					this.containing.SN().split(this.removelist);						
					
					if(this.containing.NEN())
					this.containing.NEN().split(this.removelist);
					if(this.containing.SEN())
					this.containing.SEN().split(this.removelist);
					if(this.containing.NWN())
					this.containing.NWN().split(this.removelist);
					if(this.containing.SWN())
					this.containing.SWN().split(this.removelist);		
					
					var lowergrid = [this.containing,
					this.containing.NN(),
					this.containing.EN(),
					this.containing.SN(),
					this.containing.WN(),
					this.containing.NEN(),
					this.containing.NWN(),
					this.containing.SEN(),
					this.containing.SWN()]
					
					
					for(var i = 0; i < lowergrid.length ; i++)
					{
						if(lowergrid[i])
						for(var j =0; j < lowergrid[i].children.length; j++)
						{
							
							lowergrid[i].children[j].isMip = true;
						}
						
					}
					
					var lowergridinner = [this.containing.NW(),this.containing.NE(),this.containing.SE(),this.containing.SW()];
					if(this.containing.NN())
					{
						lowergridinner.push(this.containing.NN().SE());
						lowergridinner.push(this.containing.NN().SW());
					}
					if(this.containing.EN())
					{
						lowergridinner.push(this.containing.EN().NW());
						lowergridinner.push(this.containing.EN().SW());
					}
					if(this.containing.SN())
					{
						lowergridinner.push(this.containing.SN().NE());
						lowergridinner.push(this.containing.SN().NW());
					}
					if(this.containing.WN())
					{
						lowergridinner.push(this.containing.WN().SE());
						lowergridinner.push(this.containing.WN().NE());
					}
					
					
					
					
					if(this.containing.NEN())				
					lowergridinner.push(this.containing.NEN().SW());
					if(this.containing.NWN())
					lowergridinner.push(this.containing.NWN().SE());
					if(this.containing.SEN())
					lowergridinner.push(this.containing.SEN().NW());
					if(this.containing.SWN())
					lowergridinner.push(this.containing.SWN().NE());
					
					
					
					
					
					this.containingList = lowergridinner;		
					this.quadtree.balance(this.removelist);
					this.quadtree.balance(this.removelist);
					//this.quadtree.cleanup(this.removelist);
					var nodes = this.quadtree.getBottom();
					
					//immediately remove old nodes that are now too big
					this.quadtree.walk(function(n)
					{
						if(n.max[0]-n.min[0] > maxTileSize && n.setForDesplit)
						{
							
							var list = [];
							n.cleanup(list);
							list.forEach(function(e)
							{
								if(e.parent)
								{
									e.parent.remove(e);
									self.TileCache.returnMesh(e);
									
								}
								e.quadnode = null;
							});
							n.children = [];
							delete n.setForDesplit;
						}
					});
					var newleaves = this.quadtree.getLeaves();
					
					for(var i = 0; i <  newleaves.length; i++)
					{
						
						if(!newleaves[i].mesh)
						{
							if(newleaves[i].max[0] - newleaves[i].min[0] < maxTileSize)
							self.needRebuild.push(newleaves[i]);
						}
						else if(newleaves[i].sideNeeded() != newleaves[i].side)
						{
							self.needRebuild.push(newleaves[i]);
						}
						
					}
					
					self.needRebuild.sort(function(a,b)
					{
						return (a.max[0] - a.min[0]) - (b.max[0] - b.min[0]);
						
					});
					
					
					//walk the parents of the nodes whose meshs are removing, and 
					//note how may children that nodes has to rebuild
					var	splitting = [];
					this.quadtree.walk(function(n)
					{
						if(n.backupmesh && n.isSplit())
						{
							splitting.push(n);
							
							var count = 0;
							n.getLeaves().forEach(function(e)
							{
								if(!e.mesh)
								count++;
								
							});
							n.waiting_for_rebuild = count;
						}
						
					});
					
					
					self.rebuild();	
					
					
				}
				
			}
		}.bind(this);
		
		self.rebuildCallback = function(tile,force)
		{
			//if forcing update, don't bother with any of this drama, the mesh was rebuilt, but has no children or parents taht need updating
			if(!force)
			{
				//now that I've drawn my tile, I can remove my children.
				var list = []
				tile.cleanup(list)
				tile.debug(0,0,0);
				
				if(list.length > 0)
				tile.mesh.visible = false;
				var o = tile.mesh;
				list.forEach(function(e)
				{
					tile.fadelist = list;
					if(e.parent)
					{
						e.material.uniforms.debugColor.value.r = 0;
						e.material.uniforms.debugColor.value.g = 0;
						e.material.uniforms.debugColor.value.b = 1;
						e.quadnode.mesh = null;
						e.material.uniforms.blendPercent.value = 1;
						var fade = function()
						{
							e.material.uniforms.blendPercent.value -= .1 * window.deltaTime/100;
							if(e.material.uniforms.blendPercent.value > 0)
							{
								e.fadeHandle = window.requestAnimationFrame(fade);
							}else
							{
								if(e.parent)
								{
									e.parent.remove(e);
									e.quadnode = null;
									self.TileCache.returnMesh(e);
								}
								o.visible = true
								o.material.uniforms.blendPercent.value = 1;
								
								tile.fadelist = null;
							}
						};
						e.fadeHandle = window.requestAnimationFrame(fade);
						
					}
				});
				
				var e = tile.mesh;
				e.material.uniforms.blendPercent.value = 1;
				
				var p = tile.parent;
				//look up for the node I'm replaceing
				while(p && !p.waiting_for_rebuild)
				p = p.parent;
				if(p)
				{							
					if(p.waiting_for_rebuild > 1)
					{
						
						p.waiting_for_rebuild--;
						tile.mesh.visible = false;
						window.cancelAnimationFrame(tile.fade);
						p.debug(1,.5,.5);
					}
					else  if(p.waiting_for_rebuild == 1)
					{
						
						if(p.backupmesh && p.backupmesh.parent)
						{
							
							var e = p.backupmesh;
							
							e.quadnode = null;
							if(e.parent)
							{
								e.parent.remove(e);
								self.TileCache.returnMesh(e);
							}
							
							
							
							p.backupmesh = null;
						}
						
						delete p.waiting_for_rebuild;
						p.walk(function(l)
						{
							//this really should be true now!
							if(l.mesh)
							{
								l.debug(0,1,1);
								l.mesh.visible = true;
								var o = l.mesh;
								o.material.uniforms.blendPercent.value = 0;
								var fade = function()
								{
									
									o.material.uniforms.blendPercent.value += .1 * window.deltaTime/100;
									if(o.material.uniforms.blendPercent.value < 1)
									{
										window.requestAnimationFrame(fade);
									}else
									{
										l.debug(0,0,0);
										o.material.uniforms.blendPercent.value = 1;
									}
									
								};
								window.requestAnimationFrame(fade);
							}	
						});
					}
				}
			}
			
			self.rebuild(force);
			
			
		}.bind(self)
		
		self.rebuild = function(force)
		{
			
			while(self.terrainGenerator.countFreeWorkers() > 0 && self.needRebuild.length > 0)
			
			{
				
				var tile1 = self.needRebuild.shift();
				var needUpdate = true;
				
				if(self.terrainGenerator.forceTileRebuildCallback && force)
					needUpdate = self.terrainGenerator.forceTileRebuildCallback(tile1);
				if(needUpdate)
				{				
					tile1.debug(0,1,0);
					tile1.updateMesh(self.rebuildCallback,force);
				}
				
			}
				
		}.bind(self);
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		this.callingMethod = function(methodName,args)
		{
			if(methodName == 'setPoint')
			{
				if(args.length == 6)
				{
					var cp = this.controlPoints[args[0]];
					cp.x = args[1];
					cp.y = args[2];
					cp.z = args[3];
					cp.dist = args[4];
					cp.falloff = args[5];
				}
				else if(args.length == 2)
				{
					this.controlPoints[args[0]] = args[1];
				}
				
				return true;
			}
			if(methodName == 'getPoint')
			{
				return this.controlPoints[args[0]];
			}
			if(methodName == 'getPointCount')
			{
				return this.controlPoints.length;
			}
		}
		this.gettingProperty = function(propertyName)
		{
			
			if(propertyName == 'controlPoints')
			{
				return this.controlPoints ;
			}
			if(propertyName == 'type')
			{	
				return 'Terrain';
			}					
		}
		
		//must be defined by the object
		this.getRoot = function()
		{
			return this.rootnode;
		}
		this.rootnode = new THREE.Object3D();
		this.inherits = ['vwf/model/threejs/transformable.js'];
		//this.Build();
	}
		//default factory code
	return function(childID, childSource, childName) {
		//name of the node constructor
		return new terrain(childID, childSource, childName);
	}
})();