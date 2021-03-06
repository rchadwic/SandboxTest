function heightmapTerrainAlgorithm() 
{	
	
	//this init is called from each thread, and gets data from the poolInit function.
	this.init = function(data)
	{
		this.data = data.data;
		console.log('data received');
		
		this.dataHeight = data.dataHeight;
		this.dataWidth = data.dataWidth;
		this.worldLength = data.worldLength || 13500;
		this.worldWidth = data.worldWidth || 9500;
		this.min = data.min;
		console.log('from thread: min is ' + this.min);
		this.type = 'bt';
		
		this.importScript('simplexNoise.js');
		this.importScript('Rc4Random.js');
		this.SimplexNoise = new SimplexNoise((new Rc4Random(1 +"")).random);
	}
	//This can generate data on the main thread, and it will be passed to the coppies in the thread pool
	this.poolInit = function(cb,params)
	{	
		
		this.type = 'bt';
		this.url = (params && params.url) || 'terrain/River.bt';
		this.diffuseUrl = (params && params.diffuseUrl) || 'terrain/River.jpg';
		if(this.type == 'img')
		{
			canvas = document.createElement('canvas');
			
			var img = new Image();
			img.src = this.url;
			
			img.onload = function()
			{
				
				this.dataHeight = img.naturalHeight;
				this.dataWidth = img.naturalWidth;
				canvas.height = this.dataHeight;
				canvas.width = this.dataWidth;
				var context = canvas.getContext('2d');
				context.drawImage(img, 0, 0);
				var data = context.getImageData(0, 0, this.dataHeight, this.dataWidth).data;
				
				var array = new Uint8Array(this.dataHeight*this.dataWidth);
				for(var i =0; i < this.dataHeight*this.dataWidth * 4; i+=4)
					array[Math.floor(i/4)] = Math.pow(data[i]/255.0,1.0) * 255;
				var data = new Uint8Array(this.dataHeight*this.dataWidth);
				for(var i = 0; i < this.dataWidth; i++)
				{
					for(var j = 0; j < this.dataHeight; j++)
					{
						var c = i * this.dataWidth + j;
						var c2 = j * this.dataHeight + i;
						data[c] = array[c2];
					}
				}
				cb({dataHeight:this.dataHeight,dataWidth:this.dataWidth,min:0,data:data});
			}
		}
		if(this.type == 'bt')
		{
			var buff;
			var self2 = this;
			var xhr = new XMLHttpRequest();
			xhr.responseType = 'arraybuffer';
			xhr.onload = function(e) {
				if (xhr.status === 200) {
				  buff = xhr.response;
				  
				  var t = new Date();
					while((new Date()) - t < 10000){};
				  
				  self2.parseBT(buff,cb);
				} else
				{
					cb(null);
				}
			};
			xhr.open('GET', this.url);
			
			this.worldLength = params && parseFloat(params.worldLength) || 13500;
			this.worldWidth =  params && parseFloat(params.worldWidth) || 9500;
			
			xhr.send();
		}
		
		//signal the pool that we need an async startup
		return false;
	}
	this.parseBT = function(arraybuf,cb)
	{
		
		var DV = new DataView(arraybuf);
		this.dataWidth = DV.getInt32(10,true);
		this.dataHeight = DV.getInt32(14,true);
		var dataSize = DV.getInt16(18,true);
		var isfloat = DV.getInt16(20,true);
		var scale = DV.getFloat32(62,true);
		var data;
		if(isfloat == 1)
		{
			data = new Float32Array(this.dataWidth*this.dataHeight);
		}
		else
		{
			data = new Int16Array(this.dataWidth*this.dataHeight);
		}
		var min = Infinity;
		for(var i =0; i < this.dataWidth*this.dataHeight; i++)
		{
			if(isfloat == 1)
			{
				data[i] = DV.getFloat32(256 + 4 * i,true);			
			}else
			{
				data[i] = DV.getInt16(256 + 2 * i,true);
			}
			if(data[i] < min)
				min = data[i];
		}
		this.min = min;
		this.data = data;
		cb({worldLength:this.worldLength,worldWidth:this.worldWidth,dataHeight:this.dataHeight,dataWidth:this.dataWidth,min:min,data:data});
	}
	//This is the settings data, set both main and pool side
	this.getEditorData = function(data)
	{
		return {
		heightmapSrc:{
								displayname : 'HeightMap URL',
								property:'url',
								type:'prompt'
						},
		diffuseSrc:{
								displayname : 'HeightMap URL',
								property:'diffuseUrl',
								type:'prompt'
						},	
		worldLength:{
								displayname : 'Length (m)',
								property:'worldLength',
								type:'prompt'
						},
		worldWidth:{
								displayname : 'Width (m)',
								property:'worldWidth',
								type:'prompt'
						}							
		}
	}
	//This is the settings data, set both main and pool side
	this.setAlgorithmData = function(data)
	{
		
	}
	//this sets the values on the pool side. Keep these cached here, so the engine can query them without an async call
	//updatelist is the existing tiles. Return tiles in an array  that will need an update after the property set. This will 
	//allow the engine to only schedule tile updates that are necessary.
	this.setAlgorithmDataPool = function(data,updateList)
	{
		if(!data) return [];
		var needRebuild = false;
		if(data.url && data.url != this.url)
		{
			this.url = data.url;
			needRebuild = true;
		}
		if(data.worldLength && data.worldLength != this.worldLength)
		{
			this.worldLength =  parseFloat(data.worldLength);
			needRebuild = true;
		}
		if(data.worldWidth && data.worldWidth != this.worldWidth)
		{
			this.worldWidth =  parseFloat(data.worldWidth);
			needRebuild = true;
		}
		if(data.diffuseUrl != this.diffuseUrl)	
		{
			this.diffuseUrl = data.diffuseUrl;
			this.materialRebuildCB();
		}
		if(needRebuild) return updateList;
		return [];
	}
	
	//the engine will read the data values here
	this.getAlgorithmDataPool = function(seed)
	{
		return {
			url:this.url,
			diffuseUrl:this.diffuseUrl,
			worldWidth:this.worldWidth,
			worldLength:this.worldLength
		};
	}
	//This will allow you to setup shader variables that will be merged into the the terrain shader
	this.getMaterialUniforms = function(mesh,matrix)
	{
		
		var uniforms_default = {
		diffuseSampler:   { type: "t", value: _SceneManager.getTexture( this.diffuseUrl,true) },
		dirtSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/dirt.jpg",true ) },
		brushSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/scrub.jpg",true ) },
		};
		uniforms_default.diffuseSampler.value.wrapS = uniforms_default.diffuseSampler.value.wrapT = THREE.RepeatWrapping;
		uniforms_default.dirtSampler.value.wrapS = uniforms_default.dirtSampler.value.wrapT = THREE.RepeatWrapping;
		uniforms_default.brushSampler.value.wrapS = uniforms_default.brushSampler.value.wrapT = THREE.RepeatWrapping;
		return uniforms_default;
	}
	//This funciton allows you to compute the diffuse surface color however you like. 
	//must implement vec4 getTexture(vec3 coords, vec3 norm) or return null which will give you the default white
	this.getDiffuseFragmentShader = function(mesh,matrix)
	{
		
		return (
		"uniform sampler2D diffuseSampler;\n"+
		"uniform sampler2D dirtSampler;\n"+
		"uniform sampler2D brushSampler;\n"+
		"vec4 getTexture(vec3 coords, vec3 norm, vec2 uv)" +
		"{"+
			"vec4 diffuse = texture2D(diffuseSampler,((coords.yx * vec2(1.0,1.0) + vec2("+((this.worldWidth)/2).toFixed(5)+","+((this.worldLength)/2).toFixed(5)+"))/vec2("+((this.worldWidth)).toFixed(5)+","+((this.worldLength)).toFixed(5)+")));\n"+
			//"vec4 diffuse = texture2D(diffuseSampler,((coords.yx * vec2(1.0,1.0) + vec2(6750.0,4750.0))/vec2(13500.0,9500.0)));\n"+
			"vec4 dirt = texture2D(dirtSampler,((coords.yx / 10.0)));\n"+
			"vec4 brush = texture2D(brushSampler,((coords.yx / 5.0)));\n"+
			"float minamt = smoothstep(0.0,100.0,distance(cameraPosition , coords));\n"+
			"float dirtdot = dot(diffuse,vec4(182.0/255.0,179.0/255.0,164.0/255.0,1.0));\n"+
			"dirtdot = clamp(0.0,1.0,pow(max(.5,dirtdot)-.5,9.5)/100.0);\n"+
			
			"vec4 near = mix(brush,dirt,dirtdot);\n"+
			"return mix(near,diffuse,minamt);\n"+
		"}")
	}
	
	//This is the displacement function, which is called in paralell by the thread pool
	this.displace= function(vert)
	{
		var z = this.SimplexNoise.noise2D((vert.x)/100,(vert.y)/100) * 4.5;
		z += this.SimplexNoise.noise2D((vert.x)/300,(vert.y)/300) * 4.5;
		z += this.SimplexNoise.noise2D((vert.x)/10,(vert.y)/10) * 0.5;
		var h = this.type == 'img'?2.2:1.0;
		return this.sampleBiCubic((vert.x+ (this.worldLength/2)) / this.worldLength ,(vert.y + (this.worldWidth/2)) / this.worldWidth  ) * h  + z|| 0;
	}
	this.at = function(x,y)
	{
		if( x >= this.dataHeight || x < 0) return 0;
		if( y >= this.dataWidth || y < 0) return 0;
		var i = y * this.dataWidth  + x;
		return this.data[i]  - this.min;
	}
	this.sampleBiLinear = function(u,v)
	{
		//u = u - Math.floor(u);
		//v = v - Math.floor(v);
		u = u * this.dataWidth - .5;
		v = v * this.dataHeight - .5;
		var x = Math.floor(u);
		var y = Math.floor(v);
		var u_ratio = u -x;
		var v_ratio = v - y;
		var u_opposite = 1 - u_ratio;
		var v_opposite = 1 - v_ratio;
		var result = (this.at(x,y)   * u_opposite  + this.at(x+1,y)   * u_ratio) * v_opposite + 
                   (this.at(x,y+1) * u_opposite  + this.at(x+1,y+1) * u_ratio) * v_ratio;
		return result;
	}
	this.cubicInterpolate = function(p, x) 
	{
		return p[1] + 0.5 * x*(p[2] - p[0] + x*(2.0*p[0] - 5.0*p[1] + 4.0*p[2] - p[3] + x*(3.0*(p[1] - p[2]) + p[3] - p[0])));
	}
	this.bicubicInterpolate = function(p, x, y)
	{
		var arr = [];
		arr[0] = this.cubicInterpolate(p[0], y);
		arr[1] = this.cubicInterpolate(p[1], y);
		arr[2] = this.cubicInterpolate(p[2], y);
		arr[3] = this.cubicInterpolate(p[3], y);
		return this.cubicInterpolate(arr, x);
	}
	this.sampleBiCubic = function(u,v)
	{
		var y = Math.floor(u * this.dataHeight);
		var x = Math.floor(v * this.dataWidth);
		
		u = (u * this.dataHeight) - Math.floor(u * this.dataHeight);
		v = (v * this.dataWidth) - Math.floor(v * this.dataHeight);
		var p = [];
		var t = x;
		x = y;
		y = t;
		t = u;
		u = v;
		v = t;
		p[0] = [this.at(x-1,y-1),this.at(x-0,y-1),this.at(x+1,y-1),this.at(x+2,y-1)];
		p[1] = [this.at(x-1,y-0),this.at(x-0,y-0),this.at(x+1,y-0),this.at(x+2,y-0)];
		p[2] = [this.at(x-1,y+1),this.at(x-0,y+1),this.at(x+1,y+1),this.at(x+2,y+1)];
		p[3] = [this.at(x-1,y+2),this.at(x-0,y+2),this.at(x+1,y+2),this.at(x+2,y+2)];
		return this.bicubicInterpolate(p,u,v);
	}
}