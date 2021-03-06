var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml');
	SandboxAPI = require('./sandboxAPI');

	var DAL;
	function GUID()
    {
        var S4 = function ()
        {
            return Math.floor(
                    Math.random() * 0x10000 /* 65536 */
                ).toString(16);
        };

        return (
                S4() + S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + S4() + S4()
            );
    }
function IsSpace(c)
{
	return c == " " || c == "\t";
}	
function ParseLine(str)
{
	var ret = [""];
	var inquote = false;
	for(var i = 0; i < str.length; i++)
	{
		var c = str[i];
		if(IsSpace(c) && !inquote)
		{
			ret.push("");
		}else
		{
			if(c == "\"")
				inquote = !inquote;
			else
			{
				ret[ret.length -1] += (c);
			}			
		}
	}
	while(ret.indexOf("")!= -1)
		ret.splice(ret.indexOf(""),1);
		
	
	return ret;
}
function StartShellInterface()
{
//shell interface defaults
	global.log('Starting shell interface',0);
	var stdin = process.openStdin();
	stdin.on('data', function(chunk) {
		if(!chunk) return;
		
		if(!global.instances)
			global.instances = {};
					
		chunk = chunk + '  ';
		chunk = chunk.replace(/\r\n/g,'');
		
		var commands = ParseLine(chunk);
		
		if(commands[0] && commands[0] == 'show' && commands[1])
		{
			if(commands[1] == 'instances')
			{
				
				var keys = Object.keys(global.instances);
				for(var i in keys)
					global.log(keys[i],0);	
			}
			if(commands[1] == 'users')
			{
				DAL.getUsers(function(users)
				{
					global.log(users);
				});
			}
			if(commands[1] == 'user')
			{
				DAL.getUser( commands[2], function(users)
				{
					global.log(users);
				});
			}
			if(commands[1] == 'inventory')
			{
				DAL.getInventoryForUser(commands[2],function(inventory,key)
				{
					global.log('Inventory Database key is ' + key);
					global.log(JSON.stringify(inventory));
				});
			
			}
			if(commands[1] == 'inventorydisplay')
			{
				DAL.getInventoryDisplayData(commands[2],function(data)
				{
					global.log(data,0);
				});
			}
			
			if(commands[1] == 'inventoryitem')
			{
				if(commands[2] == 'metadata')
				{
					DAL.getInventoryItemMetaData(commands[3],commands[4],function(data)
					{
						console.log(data);
					});
				}
				if(commands[2] == 'assetdata')
				{
					DAL.getInventoryItemAssetData(commands[3],commands[4],function(data)
					{
						console.log(data);
					});
				}					
				
			}
			if(commands[1] == 'sessions')
			{
				for(var i =0; i < global.sessions.length; i++)
					global.log(global.sessions[i],0);	
			}
			if(commands[1] == 'states')
			{
					DAL.getInstances(function(data)
					{
						global.log(data,0);
					});	
			}
			if(commands[1] == 'state')
			{
					DAL.getInstance(commands[2],function(data)
					{
						global.log(data,0);
					});	
			}
			if(commands[1] == 'clients')
			{
				for(var i in global.instances)
				{
					var keys = Object.keys(global.instances[i].clients);
					for(var j in keys)
					   global.log(keys[j],0);
				}
			}
			if(commands[1] == 'users')
			{
				for(var i in global.instances)
				{
					var keys = Object.keys(global.instances[i].clients);
					for(var j in keys)
					{
					   var client = global.instances[i].clients[keys[j]];
					   if(client && client.loginData)
					   {
						  global.log(client.loginData.UID,0);
					   }
					}
				}
			}
		}
		if(commands[0] == 'compact')
		{
			DAL.compactDatabase();
		}
		if(commands[0] && commands[0] == 'import' && commands[1])
		{
			if(commands[1] == 'users')
			{
				DAL.importUsers();
			}
			if(commands[1] == 'states')
			{
				DAL.importStates();
			}
		}
		if(commands[0] && commands[0] == 'purge' && commands[1])
		{
			if(commands[1] == 'states')
			{
				DAL.purgeInstances();
			}
		}
		if(commands[0] && commands[0] == 'find' && commands[1])
		{
			if(commands[1] == 'state')
			{
				    var search = {}
					search[commands[2]] = commands[3];
					DAL.findState(search,function(results)
					{
						console.log(results);
					});
				
			}
		}
		if(commands[0] == 'update')
		{
			if(commands[1] == 'inventoryitem')
				if(commands[2] == 'metadata')
				{
					DAL.updateInventoryItemMetadata(commands[3],commands[4],JSON.parse(commands[5].replace(/'/g,'"')),function()
					{
					
					});
				}
			if(commands[1] == 'user')
			{
				DAL.updateUser(commands[2],JSON.parse(commands[3].replace(/'/g,'"')),function()
				{
				
				});
			}
			if(commands[1] == 'state')
			{
				DAL.updateInstance(commands[2],JSON.parse(commands[3].replace(/'/g,'"')),function()
				{
				
				});
			}
		}
		if(commands[0] == 'feature')
		{
			if(commands[1] == 'state')
			{
				DAL.updateInstance(commands[2],{featured:true},function()
				{
				
				});
			}
		}
		if(commands[0] == 'unfeature')
		{
			if(commands[1] == 'state')
			{
				DAL.updateInstance(commands[2],{featured:false},function()
				{
				
				});
			}
		}
		if(commands[0] == 'search')
		{
			if(commands[1] == 'inventory')
			{
				DAL.searchInventory(commands[2],commands[3].split(','),function(results)
				{
					console.log(results);
				});
			}
			if(commands[1] == 'states')
			{
				DAL.findState(JSON.parse(commands[2].replace(/'/g,'"')),function(results)
				{
					console.log(results);
				});
			}			
		}
		if(commands[0] && commands[0] == 'boot' && commands[1])
		{
			var name = commands[1];
			
				for(var i in global.instances)
				{
					//shuting down whole instance
					if(i == name)
					{
						var keys = Object.keys(global.instances[i].clients);
						for(var j in keys)
						{
						   var client = global.instances[i].clients[keys[j]];
						   client.disconnect();
						}
					}
					else
					{
						//find either the client or the user and boot them from all instances
						var keys = Object.keys(global.instances[i].clients);
						for(var j in keys)
						{
						   var client = global.instances[i].clients[keys[j]];
						   if(keys[j] == name)
						   {
							   client.disconnect();
						   }
						   if(client && client.loginData)
						   {
							  if(client.loginData.UID == name)
								   client.disconnect();
						   }
						}
					}
				}
			
		}
		if(commands[0] && commands[0] == 'message' && commands[1])
		{
			var name = commands[1];
			
				for(var i in global.instances)
				{
					
					{
						//find either the client or the user and boot them from all instances
						
						for(var j in global.instances[i].clients)
						{
						   var client = global.instances[i].clients[j];
						  
						   if(client && client.loginData)
						   {
							  if(client.loginData.UID == name)
								client.emit('message',{"time":global.instances[i].time,"node":"index-vwf","action":"callMethod","member":'PM',"parameters":[[JSON.stringify({receiver:name,sender:"*System*",text:commands[2]})]]});
						   }
						}
					}
				}
			
		}
		if(commands[0] && commands[0] == 'broadcast' && commands[1])
		{
			var name = commands[1];
			
				for(var i in global.instances)
				{
					
					//find either the client or the user and boot them from all instances
					
					for(var j in global.instances[i].clients)
					{
					   var client = global.instances[i].clients[j];   
					   if(client && client.emit)
						client.emit('message',{"time":global.instances[i].time,"node":"index-vwf","action":"callMethod","member":'receiveChat',"parameters":[[JSON.stringify({sender:"*System*",text:commands[1]})]]});
					   
					}
					
				}
			
		}
		if(commands[0] == 'delete')
		{
			if(commands[1] == 'user')
			{
				DAL.deleteUser(commands[2],function(res){
					
					global.log(res,0);
				
				});
			}
			if(commands[1] == 'inventoryitem')
			{
				DAL.deleteInventoryItem(commands[2],commands[3],function()
				{
				
				});
			}
		}
		if(commands[0] == 'clear')
		{
			if(commands[1] == 'users')
			{
				DAL.clearUsers();
			}
			if(commands[1] == 'inventoryitem')
			{
				DAL.clearStates();
			}
			if(commands[1] == 'cache')
			{
				global.FileCache.clear();
			}
		}
		if(commands[0] == 'create')
		{
			if(commands[1] == 'user')
			{
				DAL.createUser(commands[2],{username:commands[2],loginCount:0},function(res){
					
					global.log(res,0);
				
				});
			}
			if(commands[1] == 'inventoryitem')
			{
				DAL.addToInventory(commands[2],{title:commands[3],created:new Date()},{data:'test asset binary data'},function()
				{
				
				});
			}
		}
		if(commands[0] && commands[0] == 'loglevel' && commands[1])
		{
			global.logLevel = parseInt(commands[1]);	
		}
		if(commands[0] && commands[0] == 'loglevel' && !commands[1])
		{
			console.log(global.logLevel,0);
		}
		
		
		
		
		if(commands[0] && commands[0] == 'test' && commands[1] && commands[1] == 'login' && commands[2] && commands[3] && parseInt(commands[3]))
		{
			var name = commands[2];
			
				for(var i in global.instances)
				{
					//shuting down whole instance
					if(i == name)
					{
						var keys = Object.keys(global.instances[i].clients);
						for(var k =0; k < parseInt(commands[3]); k++)
						{
							for(var j in keys)
							{
								var client = global.instances[i].clients[keys[j]];
								client.emit('message',{"time":global.instances[i].time,"node":"index-vwf","action":"createChild","member":GUID(),"parameters":[{"extends":"NPCcharacter.vwf","source":"usmale.dae","type":"model/vnd.collada+xml","properties":{"activeCycle":"","motionStack":[],"rotZ":Math.random() * 180,"PlayerNumber":GUID(),"owner":GUID(),"ownerClientID":GUID(),"profile":{"Username":GUID(),"Name":"Robert Chadwick","Age":"32","Birthday":"","Password":"","Relationship":"Married","City":"Mclean","State":"VA","Homepage":"","Employer":"ADL","Title":"","Height":"","Weight":"","Nationality":"","Avatar":"usmale.dae"},"translation":[Math.random() * 100-50,Math.random()*100 -50,0.01]},"events":{"ShowProfile":null,"Message":null},"scripts":[
								"this.ShowProfile = "+
								"function(){ "+
								"	if(vwf.client() != vwf.moniker()) return; "+
								"   _UserManager.showProfile(_DataManager.GetProfileForUser(this.PlayerNumber))     "+
								" }; \n"+
								"this.Message = function(){"+
								"	if(vwf.client() != vwf.moniker()) return; "+
								"	setupPmWindow(this.PlayerNumber)     "+
								"}"
								]}],"client":GUID()});
							}
						}
					}
				}
		}	
	});
	
}
exports.setDAL = function(p)
{
	DAL = p;
}	
exports.StartShellInterface = StartShellInterface;