function clearCameraModeIcons()
		{
			$('#MenuCameraOrbiticon').css('background', '');
			$('#MenuCamera3RDPersonicon').css('background', '');
			$('#MenuCameraNavigateicon').css('background', '');
			$('#MenuCameraFreeicon').css('background', '');
		}
		
define(
{
	
	initialize: function ()
	{
		//$(document.body).append('');
		window.menus = ddsmoothmenu.init(
		{
			mainmenuid: "smoothmenu1", //menu DIV id
			orientation: 'h', //Horizontal or vertical menu: Set to "h" or "v"
			classname: 'ddsmoothmenu', //class added to menu's outer DIV
			//customtheme: ["#1c5a80", "#18374a"],
			contentsource: "markup", //"markup" or ["container_id", "path_to_menu_file"]
			method: 'hover'
		});
		
		$('#MenuEn').click(function (e)
		{
			localStorage.setItem("language","en");
			location.reload();
		});
		$('#MenuRu').click(function (e)
		{
			localStorage.setItem("language","ru");
			location.reload();
		});


		//make the menu items disappear when you click one
		//$(".ddsmoothmenu").find('li').click(function(){$(".ddsmoothmenu").find('li').trigger('mouseleave');});
		$('#MenuLogOut').attr('disabled', 'true');
		$('#MenuLogIn').click(function (e)
		{
			if ($('#MenuLogIn').attr('disabled') == 'disabled') return;
			_UserManager.showLogin();
		});
		$('#MenuSaveNow').click(function (e)
		{
			_DataManager.saveToServer();
		});
		
		$('#MenuShareWorld').click(function (e)
		{
			
			var state =_DataManager.getCurrentSession();
			state = state.replace(/\//g,'_');
			var turl = "/vwfdatamanager.svc/statedata?SID=" +state;
			$.getJSON(turl,function(data)
			{
				placehodler = '';
				if(data)
					placeholder = data.title;
				alertify.prompt('Use the URL below to share this world with your friends! Just have them paste it into their browsers address bar.',function(){},
				window.location.host + '/worlds/' + placeholder);
			
			});
			
		});
		
		$('#MenuLogOut').click(function (e)
		{
			if ($('#MenuLogOut').attr('disabled') == 'disabled') return;
			_UserManager.Logout();
		});
		$('#MenuSelectPick').click(function (e)
		{
			_Editor.SetSelectMode('Pick');
		});
		$('#MenuSelectNone').click(function (e)
		{
			_Editor.SelectObject(null);
			_Editor.SetSelectMode('None');
		});
		$('#MenuMove').click(function (e)
		{
			_Editor.SetGizmoMode(_Editor.Move);
			$('#MenuRotateicon').css('background', "");
			$('#MenuScaleicon').css('background', "");
			$('#MenuMoveicon').css('background', "#9999FF");
		});
		$('#MenuRotate').click(function (e)
		{
			_Editor.SetGizmoMode(_Editor.Rotate);
			$('#MenuRotateicon').css('background', "#9999FF");
			$('#MenuScaleicon').css('background', "");
			$('#MenuMoveicon').css('background', "");
		});
		$('#MenuScale').click(function (e)
		{
			_Editor.SetGizmoMode(_Editor.Scale);
			$('#MenuRotateicon').css('background', "");
			$('#MenuScaleicon').css('background', "#9999FF");
			$('#MenuMoveicon').css('background', "");
		});
		$('#MenuMulti').click(function (e)
		{
			_Editor.SetGizmoMode(_Editor.Multi);
		});
		$('#MenuSaveCopy').click(function (e)
		{
			_InventoryManager.Take();
		});
		$('#MenuShare').click(function (e)
		{
			_PermissionsManager.show();
		});
		$('#MenuSetParent').click(function (e)
		{
			_Editor.SetParent();
		});
		$('#MenuSelectScene').click(function (e)
		{
			_Editor.SelectScene();
		});
		$('#MenuRemoveParent').click(function (e)
		{
			_Editor.RemoveParent();
		});
		$('#MenuSelectParent').click(function (e)
		{
			_Editor.SelectParent();
		});
		$('#MenuHierarchyManager').click(function (e)
		{
			HierarchyManager.show();
		});
		$('#MenuLocal').click(function (e)
		{
			_Editor.SetCoordSystem(_Editor.LocalCoords);
			if (_Editor.GetMoveGizmo()) _Editor.updateGizmoOrientation(true);
		});
		$('#MenuWorld').click(function (e)
		{
			_Editor.SetCoordSystem(_Editor.WorldCoords);
			if (_Editor.GetMoveGizmo()) _Editor.updateGizmoOrientation(true);
		});
		$('#MenuDelete').click(function (e)
		{
			_Editor.DeleteSelection();
		});
		$('#MenuPublish').click(function (e)
		{
			_InventoryManager.Publish();
		});
		$('#MenuChat').click(function (e)
		{
			$('#ChatWindow').dialog('open');
		});
		$('#MenuUsers').click(function (e)
		{
			$('#Players').prependTo($('#Players').parent());
			$('#Players').show('blind', function ()
			{});
			showSidePanel();
		});
		$('#MenuModels').click(function (e)
		{
			_ModelLibrary.show();
		});
		$('#MenuSnapLarge').click(function (e)
		{
			_Editor.SetSnaps(1, 15 * 0.0174532925, 5);
		});
		$('#MenuSnapMedium').click(function (e)
		{
			_Editor.SetSnaps(.5, 5 * 0.0174532925, 2);
		});
		$('#MenuSnapSmall').click(function (e)
		{
			_Editor.SetSnaps(.25, 1 * 0.0174532925, .5);
		});
		$('#MenuSnapOff').click(function (e)
		{
			_Editor.SetSnaps(.001, .01 * 0.0174532925, .001);
		});
		$('#MenuMaterialEditor').click(function (e)
		{
			_MaterialEditor.show();
		});
		$('#MenuScriptEditor').click(function (e)
		{
			_ScriptEditor.show();
		});
		$('#MenuInventory').click(function (e)
		{
			_InventoryManager.show();
			$( "#InventoryTypeChoicePersonal" ).click()
		});
		$('#MenuObjectProperties').click(function (e)
		{
			_PrimitiveEditor.show();
		});
		$('#MenuGlobalInventory').click(function (e)
		{
			_InventoryManager.show();
			$( "#InventoryTypeChoiceGlobal" ).click()
		});
		$('#MenuLatencyTest').click(function (e)
		{
			var e = {};
			e.time = new Date();
			vwf_view.kernel.callMethod('index-vwf', 'latencyTest', [e]);
		});
		$('#MenuCopy').click(function (e)
		{
			_Editor.Copy();
		});
		$('#MenuPaste').click(function (e)
		{
			_Editor.Paste();
		});
		$('#MenuDuplicate').click(function (e)
		{
			_Editor.Duplicate();
		});
		$('#MenuCreatePush').click(function (e)
		{
			_Editor.CreateModifier('push', document.PlayerNumber, true);
		});
		$('#MenuCreateExtrude').click(function (e)
		{
			_Editor.CreateModifier('extrude', document.PlayerNumber, true);
		});
		$('#MenuCreateLathe').click(function (e)
		{
			_Editor.CreateModifier('lathe', document.PlayerNumber, true);
		});
		$('#MenuCreateTaper').click(function (e)
		{
			_Editor.CreateModifier('taper', document.PlayerNumber);
		});
		$('#MenuCreateBend').click(function (e)
		{
			_Editor.CreateModifier('bend', document.PlayerNumber);
		});
		$('#MenuCreateTwist').click(function (e)
		{
			_Editor.CreateModifier('twist', document.PlayerNumber);
		});
		
		$('#MenuCreateUVMap').click(function (e)
		{
			_Editor.CreateModifier('uvmap', document.PlayerNumber,true);
		});
		$('#MenuCreateCenterPivot').click(function (e)
		{
			_Editor.CreateModifier('centerpivot', document.PlayerNumber,true);
		});
		$('#MenuCreatePerlinNoise').click(function (e)
		{
			_Editor.CreateModifier('perlinnoise', document.PlayerNumber);
		});
		$('#MenuCreateSimplexNoise').click(function (e)
		{
			_Editor.CreateModifier('simplexnoise', document.PlayerNumber);
		});
		$('#MenuCreateOffset').click(function (e)
		{
			_Editor.CreateModifier('offset', document.PlayerNumber);
		});
		$('#MenuCreateStretch').click(function (e)
		{
			_Editor.CreateModifier('stretch', document.PlayerNumber);
		});
		
		$('#MenuCreateBehaviorRotator').click(function (e)
		{
			_Editor.CreateBehavior('rotator', _UserManager.GetCurrentUserName());
		});
		$('#MenuCreateBehaviorDialog').click(function (e)
		{
			_Editor.CreateBehavior('DialogSystem', _UserManager.GetCurrentUserName());
		});
		
		
		$('#MenuCreateBehaviorOrbit').click(function (e)
		{
			_Editor.CreateBehavior('orbit', _UserManager.GetCurrentUserName());
		});
		$('#MenuCreateBehaviorHyperlink').click(function (e)
		{
			_Editor.CreateBehavior('hyperlink', _UserManager.GetCurrentUserName());
		});
		$('#MenuCreateBehaviorHoverlabel').click(function (e)
		{
			_Editor.CreateBehavior('hoverlabel', _UserManager.GetCurrentUserName());
		});
		$('#MenuCreateBehaviorLookat').click(function (e)
		{
			_Editor.CreateBehavior('lookat', _UserManager.GetCurrentUserName());
		});
		$('#MenuCreateBehaviorSeek').click(function (e)
		{
			_Editor.CreateBehavior('seek', _UserManager.GetCurrentUserName());
		});
		$('#MenuCreateBehaviorPathFollow').click(function (e)
		{
			_Editor.CreateBehavior('pathfollow', _UserManager.GetCurrentUserName());
		});
		$('#MenuCreateBehaviorClampToGround').click(function (e)
		{
			_Editor.CreateBehavior('clamptoground', _UserManager.GetCurrentUserName());
		});
		
		
		
		
		
		$('#MenuHelpBrowse').click(function (e)
		{
			window.open('../vwf/view/editorview/help/help.html', '_blank');
		});
		$('#MenuHelpAbout').click(function (e)
		{
			$('#NotifierAlertMessage').dialog('open');
			$('#NotifierAlertMessage').html('VWF Sandbox version 0.99 <br/> VWF 0.6 <br/>Rob Chadwick, ADL <br/> robert.chadwick.ctr@adlnet.gov<br/> texture attribution: <br/>http://opengameart.org/content/45-high-res-metal-and-rust-texture-photos CC-BY-3.0<br/>http://opengameart.org/content/golgotha-textures  public domain<br/>http://opengameart.org/content/p0sss-texture-pack-1  CC-BY-3.0<br/>http://opengameart.org/content/117-stone-wall-tilable-textures-in-8-themes    GPL2<br/>http://opengameart.org/content/wall-grass-rock-stone-wood-and-dirt-480 public domain<br/>http://opengameart.org/content/29-grounds-and-walls-and-water-1024x1024  CC-By-SA<br/>http://opengameart.org/content/filth-texture-set  GPL2');
			$('#NotifierAlertMessage').dialog('option','height','auto');
			$('#NotifierAlertMessage').dialog('option','width','auto');
		});
		$('#MenuSave').click(function (e)
		{
			_DataManager.save();
		});
		$('#MenuSaveAs').click(function (e)
		{
			_DataManager.saveAs();
		});
		$('#MenuLoad').click(function (e)
		{
			_DataManager.load();
		});
		$('#ChatInput').keypress(function (e)
		{
			e.stopPropagation();
			ChatKeypress(e);
		});
		$('#ChatInput').keydown(function (e)
		{
			e.stopPropagation();
		});
		$('#MenuCreateBlankBehavior').click(function (e)
		{
			_Editor.AddBlankBehavior();
		});
		$('#MenuViewGlyphs').click(function (e)
		{
			if ($('#glyphOverlay').is(':visible'))
			{
				$('#glyphOverlay').hide();
				_Notifier.notify('Glyphs hidden');
			}
			else
			{
				$('#glyphOverlay').show();
				_Notifier.notify('Glyphs displayed');
			}
		});
		$('#MenuViewStats').click(function (e)
		{
			if(window.stats.domElement.style.display == 'none')
				window.stats.domElement.style.display = 'block';
			else
				window.stats.domElement.style.display = 'none';
		});
		$('#MenuViewShadows').click(function (e)
		{
			var val = !_Editor.findscene().children[1].castShadows;
			_Editor.findscene().children[1].setCastShadows(val);
		});
		$('#MenuViewBatchingForce').click(function (e)
		{
			_Editor.findscene().buildBatches(true);
		});
		$('#MenuViewStaticBatching').click(function (e)
		{
			_Editor.findscene().staticBatchingEnabled = !_Editor.findscene().staticBatchingEnabled;
			if (!_Editor.findscene().staticBatchingEnabled)
			{
				_Editor.findscene().destroyBatches();
				_Notifier.notify('static batching disabled');
			}
			else
			{
				_Notifier.notify('static batching enabled');
			}
		});
		$('#MenuGroup').click(function (e)
		{
			_Editor.GroupSelection();
		});
		$('#MenuUngroup').click(function (e)
		{
			_Editor.UngroupSelection();
		});
		$('#MenuOpenGroup').click(function (e)
		{
			_Editor.OpenGroup();
		});
		$('#MenuCloseGroup').click(function (e)
		{
			_Editor.CloseGroup();
		});
		$('#MenuAlign').click(function (e)
		{
			_AlignTool.show();
		});
		$('#MenuBlockPainter').click(function (e)
		{
			_PainterTool.show();
		});
		$('#MenuSnapMove').click(function (e)
		{
			_SnapMoveTool.show();
		});
		$('#MenuSplineTools').click(function(e){
			_SplineTool.show();
		
		});
		
		$('#MenuViewInterpolation').click(function(e)
		{
			_dView.interpolateTransforms = !_dView.interpolateTransforms;
			if(!_dView.interpolateTransforms)
				alertify.log('Animation interpolation disabled');
			else
				alertify.log('Animation interpolation enabled');
		});
		$('#MenuViewToggleWireframe').click(function (e)
		{
			
			if (_Editor.findscene().overrideMaterial)
			{
				_Editor.findscene().overrideMaterial = null;
			}
			else
			{
				_Editor.findscene().overrideMaterial = new THREE.MeshPhongMaterial();
				_Editor.findscene().overrideMaterial.wireframe = true;
				_Editor.findscene().overrideMaterial.color.r = 0;
				_Editor.findscene().overrideMaterial.color.g = 0;
				_Editor.findscene().overrideMaterial.color.b = 0;
				_Editor.findscene().overrideMaterial.fog = false;
			}
		});
		
		
		
		$('#MenuViewToggleAO').click(function (e)
		{
			if (_Editor.findscene().getFilter2d())
			{
				_Editor.findscene().setFilter2d();
			}
			else
			{
				var ao = new MATH.FilterAO();
				_Editor.findscene().setFilter2d(ao)
			}
		});

		function focusSelected()
		{
			var focusID = null;
			if (_Editor.GetSelectedVWFNode())
				focusID = _Editor.GetSelectedVWFNode().id;
			if(!focusID)
				focusID =  _UserManager.GetAvatarForClientID(vwf.moniker()) &&  _UserManager.GetAvatarForClientID(vwf.moniker()).id;
			if (focusID)
			{
					
					var t = _Editor.GetMoveGizmo().parent.matrixWorld.getPosition();
					var gizpos = [t.x, t.y, t.z];
					var box = _Editor.findviewnode(focusID).getBoundingBox();
					
					var dist = 1;
					if(box)
						dist = MATH.distanceVec3([box.max.x, box.max.y, box.max.z], [box.min.x, box.min.y, box.min.z]);
					if(dist == Infinity)
						dist = 1;
					vwf.models[0].model.nodes['index-vwf'].orbitPoint(gizpos);
					vwf.models[0].model.nodes['index-vwf'].zoom = dist * 2;
					vwf.models[0].model.nodes['index-vwf'].updateCamera();
				
			}
		}
		
		$('#MenuActivateCamera').click(function (e)
		{
			_dView.chooseCamera();
		});
		$('#MenuFocusSelected').click(function (e)
		{
			_dView.setCameraDefault();
			focusSelected();
		});
		$('#MenuCameraOrbit').click(function (e)
		{
			_dView.setCameraDefault();
			clearCameraModeIcons();
			$('#MenuCameraOrbiticon').css('background', '#9999FF');
			var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];
			var ray = _Editor.GetCameraCenterRay();
			var dxy = _Editor.intersectLinePlane(ray, campos, [0, 0, 0], _Editor.WorldZ);
			var newintersectxy = MATH.addVec3(campos, MATH.scaleVec3(ray, dxy));
			vwf.models[0].model.nodes['index-vwf'].orbitPoint(newintersectxy);
			vwf.models[0].model.nodes['index-vwf'].updateCamera();
		});
		// click events for touching sub menus
		$('#MenuViewBatching,#MenuParticles,#MenuLights,#MenuModifiers,#MenuGrouping,#MenuPrimitives,#MenuTransforms,#MenuSnaps,#MenuSelect').click(function (e)
		{
			$(this).mouseenter();
		});
		
		$('#MenuCameraNavigate').click(function (e)
		{
			_dView.setCameraDefault();
			clearCameraModeIcons();
			$('#MenuCameraNavigateicon').css('background', '#9999FF');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Orbit');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Navigate');
		});
		
		
		$('#MenuCameraShare').click(function (e)
		{
		    _dView.setCameraDefault();
		    var broadcasting = vwf.callMethod('index-vwf','getBroadcasting',[]);
		    if(!broadcasting)
		    {
			    alertify.confirm("Are you sure you want to share your camera position? Other users will be able to see from your camera!",function(ok)
			    {
				if(ok)
				{
							vwf_view.kernel.callMethod('index-vwf','cameraBroadcastStart',[]);
				 
				}
			    }.bind(this));
		    }else
		    {
			alertify.confirm("You are currently sharing your camera view. Would you like to stop sharing?",function(ok)
			    {
				if(ok)
				{
							vwf_view.kernel.callMethod('index-vwf','cameraBroadcastEnd',[]);
				 
				}
			    }.bind(this));
		    
		    }
		});
		
		$('#MenuCameraFly').click(function (e)
		{
			_dView.setCameraDefault();
			clearCameraModeIcons();
			$('#MenuCameraNavigateicon').css('background', '#9999FF');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Fly');
			
		});
		
		$('#MenuCameraNone').click(function (e)
		{
			_dView.setCameraDefault();
			clearCameraModeIcons();
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('None');
		});
		$('#MenuCameraFree').click(function (e)
		{
			_dView.setCameraDefault();
			clearCameraModeIcons();
			$('#MenuCameraFreeicon').css('background', '#9999FF');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Orbit');
			vwf.models[0].model.nodes['index-vwf'].setCameraMode('Free');
		});
		var pfx = ["webkit", "moz", "ms", "o", ""];

		function RunPrefixMethod(obj, method)
		{
			var p = 0,
				m, t;
			while (p < pfx.length && !obj[m])
			{
				m = method;
				if (pfx[p] == "")
				{
					m = m.substr(0, 1).toLowerCase() + m.substr(1);
				}
				m = pfx[p] + m;
				t = typeof obj[m];
				if (t != "undefined")
				{
					pfx = [pfx[p]];
					return (t == "function" ? obj[m]() : obj[m]);
				}
				p++;
			}
		}
		$('#MenuViewFullscreen').click(function (e)
		{
			if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen"))
			{
				RunPrefixMethod(document, "CancelFullScreen");
			}
			else
			{
				RunPrefixMethod(document.body, "RequestFullScreen");
			}
		});
		$('#MenuCamera3RDPerson').click(function (e)
		{
			
			if (_UserManager.GetCurrentUserName())
			{
				_dView.setCameraDefault();
				clearCameraModeIcons();
				$('#MenuCamera3RDPersonicon').css('background', '#9999FF');
				vwf.models[0].model.nodes['index-vwf'].followObject(vwf.models[0].model.nodes[_UserManager.GetCurrentUserID()]);
				vwf.models[0].model.nodes['index-vwf'].setCameraMode('3RDPerson');
			}
			else
			{
				_Notifier.alert('First person mode is not available when you are not logged in.');
			}
		});
		
		
		$('#MenuCreateCameraPerspective').click(function (e)
		{
			_Editor.CreateCamera(_Editor.GetInsertPoint(),document.PlayerNumber);
		});
		$('#MenuCreateParticlesBasic').click(function (e)
		{
			_Editor.createParticleSystem('basic', _Editor.GetInsertPoint(), document.PlayerNumber);
		});
		$('#MenuCreateLightPoint').click(function (e)
		{
			_Editor.createLight('point', _Editor.GetInsertPoint(), document.PlayerNumber);
		});
		$('#MenuCreateLightSpot').click(function (e)
		{
			_Editor.createLight('spot', _Editor.GetInsertPoint(), document.PlayerNumber);
		});
		$('#MenuCreateLightDirectional').click(function (e)
		{
			_Editor.createLight('directional', _Editor.GetInsertPoint(), document.PlayerNumber);
		});
		$('#MenuCreateBox').click(function (e)
		{
			_Editor.CreatePrim('box', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateLine').click(function (e)
		{
			_Editor.CreatePrim('line', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateCircle').click(function (e)
		{
			_Editor.CreatePrim('circle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateStar').click(function (e)
		{
			_Editor.CreatePrim('star', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateRectangle').click(function (e)
		{
			_Editor.CreatePrim('rectangle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateLSection').click(function (e)
		{
			_Editor.CreatePrim('lsection', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateTSection').click(function (e)
		{
			_Editor.CreatePrim('tsection', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateTerrain').click(function (e)
		{
			_Editor.CreatePrim('terrain', [0,0,0], [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		
		$('#MenuCreateLoadMeshURL').click(function (e)
		{
			alertify.prompt('Input a URL to a COLLADA mesh. Please note: this must serve from a CORS capable host!',function(ok,val){
			if(ok)
				_Editor.loadMesh(val);
			},'http://');
		});
		
		
		$('#MenuCreateSphere').click(function (e)
		{
			_Editor.CreatePrim('sphere', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		
		$('#MenuCreateText').click(function (e)
		{
			_Editor.CreatePrim('text', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateTorus').click(function (e)
		{
			_Editor.CreatePrim('torus', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreatePlane').click(function (e)
		{
			_Editor.CreatePrim('plane', _Editor.GetInsertPoint(), [1, 1, 5], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateCylinder').click(function (e)
		{
			_Editor.CreatePrim('cylinder', _Editor.GetInsertPoint(), [1, .5, .5], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreateCone').click(function (e)
		{
			_Editor.CreatePrim('cone', _Editor.GetInsertPoint(), [.500, 1, .5], 'checker.jpg', document.PlayerNumber, '');
		});
		$('#MenuCreatePyramid').click(function (e)
		{
			_Editor.CreatePrim('pyramid', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', document.PlayerNumber, '');
		});
		
		$('#LocationGoToPosition').click(function (e)
		{
			_LocationTools.GoToPosition();
		});
		
		$('#LocationGoToPlacemark').click(function (e)
		{
			_LocationTools.GoToPlaceMark();
		});
		
		$('#LocationAddPlacemark').click(function (e)
		{
			_LocationTools.AddPlacemark();
		});
		
		$('#LocationMoveToGround').click(function (e)
		{
			_LocationTools.MoveToGround();
		});
		list = $('#smoothmenu1').find('[id]');
		
		//make every clicked menu item close all menus
		 $('#smoothmenu1').find('[id]').filter(':only-child').click(function(){ddsmoothmenu.closeall({type:'click',target:'asd'})});
		
	}
});