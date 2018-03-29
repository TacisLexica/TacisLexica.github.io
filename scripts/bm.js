
	let cvs = document.createElement("canvas");
	document.body.appendChild(cvs);
	let ctx = cvs.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	
	let cvsGrid = document.createElement("canvas");
	let ctxGrid = cvsGrid.getContext("2d");
	ctxGrid.imageSmoothingEnabled = false;
	
	
	let cvsKeys = document.createElement("canvas");
	//document.body.appendChild(cvsKeys);
	let ctxKeys = cvsKeys.getContext("2d");
	cvsKeys.width = 120;
	cvsKeys.height = 120;
	
	
	let mapWidth = 42;
	let mapHeight = 99;
	
	let viewWidth = 15;
	let viewHeight = 13;
	
	let invWidth = 3;
	
	let healthMeterMaxHeight = 1;
	let fuelMeterMaxHeight = 2;
	let invMeterMaxHeight = 8;
	
	let maxHealth = 1;
	let currentHealth = 1;
	
	let maxFuel = 3;
	let currentFuel = 3;
	let movesPerFuel = 18;
	let movesRemaining = 0;
	
	let maxInv = 9;
	let currentInv = new Uint8ClampedArray(invWidth * invMeterMaxHeight);
	
	let gameBorderWidth = 2;
	//Add 1 for a gap between the view and the inventory.
	cvsGrid.width = viewWidth + invWidth + 1 + 2*gameBorderWidth;
	cvsGrid.height = viewHeight + 2*gameBorderWidth;
	
	let scale = 16;
	
	cvs.width = cvsGrid.width * scale;
	cvs.height = cvsGrid.height * scale;
	
	let skyHeight = 15;
	
	let playerX = 0;
	let playerY = skyHeight - 1;
	
	let terr = new Uint8ClampedArray(mapWidth * mapHeight);
	
	let cellTypes = {
		VOID:			0
	}
	
	
	let cellProperties = [{colour: "#000000", replace: 0}];
	
	let addCellType = (function() {
		let ID = 0;
		return function (name, colour, replace, density, loot, amt) {
			if (typeof density === "undefined") { 
				density = 2;
			}
			loot = loot || null;
			replace = replace || null;
			amt = amt || (loot ? 1 : 0);
			cellTypes[name] = ++ID;
			cellProperties[ID] = {colour: colour, replace: replace, density: density, loot: loot, amt: amt};
			//colours[ID] = colour; //Temp
		}
	})();
	
	//			Name			Colour	   Replace		Density	Loot
	addCellType("AIR",			"#905320", null,		1);
	addCellType("FRESH_AIR",	"#90A0B0", null,		0);
	addCellType("PLAYER",		"#7FFFFF", null,		99999);
	addCellType("HEALTH_EMPTY",	"#800000");
	addCellType("HEALTH_FULL",	"#FF0000");
	addCellType("INV_EMPTY",	"#202020");//Will be repurposed
	addCellType("INV_FULL",		"#FFFFFF");//Will be repurposed
	addCellType("FUEL_EMPTY",	"#008000");
	addCellType("FUEL_FULL",	"#00FF00");
	addCellType("DIRT",			"#703300", "AIR"	,	2);
	addCellType("ROCK",			"#707070", "AIR"	,	30,		"ROCK",			1);
	addCellType("COAL",			"#303030", "AIR"	,	2,		"COAL",			1);
	addCellType("FUEL_ORE",		"#00A000", "AIR"	,	2,		"FUEL_FULL",	1);
	addCellType("FUEL_SHOP",	"#30A050", null		,	0,		"FUEL_FULL",	99999);
	
	terr.fill(cellTypes.FRESH_AIR, 0, mapWidth * skyHeight);
	terr.fill(cellTypes.DIRT, mapWidth * skyHeight, mapWidth * mapHeight);
	
	setTerrainType(4, skyHeight - 1, cellTypes.FUEL_SHOP);
	
	scatterTerrainInBox(0,skyHeight,mapWidth,skyHeight + 5, cellTypes.FUEL_ORE, 20);
	scatterTerrainInBox(0,skyHeight + 5,mapWidth,skyHeight + 8, cellTypes.ROCK, 50);
	scatterTerrainInBox(0,skyHeight + 5,mapWidth,skyHeight + 8, cellTypes.COAL, 30);
	
	window.addEventListener("keydown",keyDownHandler);
	window.addEventListener("keyup",keyUpHandler);
	window.addEventListener("focusout",focusOutHandler);
	
	let lastTickTime = new Date(0);
	
	let moveInterval = 120;
	
	let commandKeys = {
		down: false,
		left: false,
		right: false,
		up: false
	}
	
	function cellToIndex(x,y) {
		return (((x % mapWidth) + mapWidth) % mapWidth) + (((y % mapHeight) + mapHeight) % mapHeight) * mapWidth;
		//Wrap.
		//return x + y * mapWidth;
	}
	
	function indexToCell(i) {
		return [i % mapWidth, Math.floor(i / mapWidth)];
	}
	
	function getTerrainType(x, y) {
		return terr[cellToIndex(x,y)];
	}
	
	function setTerrainType(x, y, t) {
		terr[cellToIndex(x,y)] = t;
	}
	
	function focusOutHandler(e) {
		commandKeys.down = false;
		commandKeys.left = false;
		commandKeys.right = false;
		commandKeys.up = false;
	}
	
	//TODO: Prevent ore overwrite. Three failures, then build a list of dirt.
	//For now, jsut overwrite random cells without looking at them.
	function scatterTerrainInBox(x0,y0,x1,y1, type, count) {
		count = count || 1;
		
		for (let i = 0; i < count; ++i) {
			setTerrainType(randInt(x0,x1),randInt(y0,y1),type);
		}
	}
	
	function randInt(start, cap) {
		return Math.floor(Math.random() * (cap - start) + start);
	}
	
	function keyDownHandler(e) {
		//console.log("Keydown:" + e.key);
		switch(e.key) {
			case "ArrowDown":
			case "Down":
				commandKeys.down = true;
				break;
			case "ArrowLeft":
			case "Left":
				commandKeys.left = true;
				break;
			case "ArrowRight":
			case "Right":
				commandKeys.right = true;
				break;
			case "ArrowUp":
			case "Up":
				commandKeys.up = true;
				break;
			//case "q":
			//	clearInterval(tickTimer);
			//	break;
		}
	}
	
	function keyUpHandler(e) {
		//console.log("Keyup:" + e.key);
		switch(e.key) {
			case "ArrowDown":
			case "Down":
				commandKeys.down = false;
				break;
			case "ArrowLeft":
			case "Left":
				commandKeys.left = false;
				break;
			case "ArrowRight":
			case "Right":
				commandKeys.right = false;
				break;
			case "ArrowUp":
			case "Up":
				commandKeys.up = false;
				break;
		}
	}
	
	function tick() {
		showKeyMap();
		
		let now = new Date();
		
		if (now - lastMoveTime >= moveInterval) {
			if (commandKeys.down) {
				movePlayer(playerX,playerY + 1);
			} else if (commandKeys.left) {
				movePlayer(playerX - 1,playerY);
			} else if (commandKeys.right) {
				movePlayer(playerX + 1,playerY);
			} else if (commandKeys.up) {
				movePlayer(playerX,playerY - 1);
			}
		}
		
		ctxGrid.fillStyle = cellProperties[cellTypes.VOID].colour;
		ctxGrid.fillRect(0, 0, cvsGrid.width, cvsGrid.height);
		
		drawGameMap(gameBorderWidth, gameBorderWidth, viewWidth, viewHeight, playerX - Math.floor(viewWidth/2), Math.max(playerY - Math.floor(viewHeight/2), 0));
		
		drawInv(gameBorderWidth + viewWidth + 1, gameBorderWidth);
		
		
		//Draw to main canvas
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(cvsGrid,0,0,cvs.width,cvs.height);
	}
	
	let lastMoveTime = new Date(0);
	let invPulseDur = 20;
	let invPulseLevel = 0;
	
	function rgba(r,g,b,a) {
		return "rgba(" + r + "," + g + "," + b + "," + a + ")";
	}
	
	function movePlayer(targetX, targetY) {
		if (targetY < skyHeight - 1 || targetY >= mapHeight) {
			return;
		}
		
		let targetType = getTerrainType(targetX,targetY);
		
		let movesRequired = cellProperties[targetType].density;
		lastMoveTime = new Date();
		
		//console.log("Move: ", targetType, movesRequired);
		
		if (movesRemaining < movesRequired && movesRemaining + movesPerFuel * currentFuel >= movesRequired) {
			let fuelBurn = Math.ceil((movesRequired - movesRemaining)/movesPerFuel);
			if (currentFuel >= fuelBurn) {
				currentFuel -= fuelBurn;
				movesRemaining += movesPerFuel * fuelBurn;
			}
		}
		
		if (movesRemaining < movesRequired) {
			if (movesRemaining <= 0 && currentFuel <= 0) {
				console.log("Lose - no fuel, no moves.");
			}
			return;
		}
		else {
			movesRemaining -= movesRequired;
		}
		
		if (cellProperties[targetType].loot !== null) {
			addToInventory(targetType);
		}
		
		//console.log(movesRemaining);
		if (cellProperties[targetType].replace !== null) {
			setTerrainType(targetX, targetY, cellTypes[cellProperties[targetType].replace]);
		}
		
		playerX = targetX;
		playerY = targetY;
	}
	
	function addToInventory(type, qty) {
		//console.log("Loot: ", qty, type);
		qty = (qty || cellProperties[type].amt) || 1;
		
		if (cellProperties[type].loot == null) {
			return;
		}
		
		//Fuel
		if (cellTypes[cellProperties[type].loot] == cellTypes.FUEL_FULL) {
			//console.log("Refuel: ", qty); 
			currentFuel = Math.min(currentFuel + qty, maxFuel);
			return;
		}
		
		//Find some space
		let spot = currentInv.findIndex((i) => {return i == cellTypes.VOID});
		if (spot >= maxInv || spot < 0) {
			invPulseLevel = invPulseDur;
			return;
		}
		currentInv[spot] = type;
	}
	
	function drawInv(startX, startY) {
		
		let j = 0;
		
		for (let i = 0; i < maxHealth; ++i) {
			ctxGrid.fillStyle = cellProperties[currentHealth > i ? cellTypes.HEALTH_FULL : cellTypes.HEALTH_EMPTY].colour;
			j = Math.floor(i / invWidth);
			ctxGrid.fillRect(startX + i % invWidth, startY + j,1,1);
		}
		
		++j;
		
		for (let i = 0; i < maxFuel; ++i) {
			ctxGrid.fillStyle = cellProperties[currentFuel > i ? cellTypes.FUEL_FULL : cellTypes.FUEL_EMPTY].colour;
			if (i % invWidth == 0) {
				++j;
			}
			ctxGrid.fillRect(startX + i % invWidth, startY + j,1,1);
		}
		
		++j;
		
		for (let i = 0; i < maxInv; ++i) {
			ctxGrid.fillStyle = cellProperties[currentInv[i] || cellTypes.INV_EMPTY].colour;
			if (i % invWidth == 0) {
				++j;
			}
			ctxGrid.fillRect(startX + i % invWidth, startY + j,1,1);
			
			ctxGrid.fillStyle = rgba(255,0,0,invPulseLevel/invPulseDur);
			ctxGrid.fillRect(startX + i % invWidth, startY + j,1,1);
		}
		
		if (invPulseLevel > 0) {
			--invPulseLevel;
		}
	}
	
	function drawGameMap(startX, startY, width, height, terrainX0, terrainY0) {
		for(let x = 0; x < width; ++x) {
			for(let y = 0; y < height; ++y) {
				ctxGrid.fillStyle = cellProperties[getTerrainType(terrainX0 + x, terrainY0 + y)].colour;
				ctxGrid.fillRect(startX + x, startY + y, 1, 1);
			}
		}
		
		ctxGrid.fillStyle = cellProperties[cellTypes.PLAYER].colour;
		ctxGrid.fillRect(startX + playerX - terrainX0, startY + playerY - terrainY0, 1, 1);
	}
	
	function showKeyMap() {
		ctxKeys.fillStyle = commandKeys.down ? "#00FF00" : "#FF0000";
		ctxKeys.fillRect(cvsKeys.width/3,2*cvsKeys.height/3,cvsKeys.width/3,cvsKeys.height/3);
		ctxKeys.fillStyle = commandKeys.left ? "#00FF00" : "#FF0000";
		ctxKeys.fillRect(0,cvsKeys.height/3,cvsKeys.width/3,cvsKeys.height/3);
		ctxKeys.fillStyle = commandKeys.right ? "#00FF00" : "#FF0000";
		ctxKeys.fillRect(2*cvsKeys.width/3,cvsKeys.height/3,cvsKeys.width/3,cvsKeys.height/3);
		ctxKeys.fillStyle = commandKeys.up ? "#00FF00" : "#FF0000";
		ctxKeys.fillRect(cvsKeys.width/3,0,cvsKeys.width/3,cvsKeys.height/3);
	}
	
	let tickTimer = setInterval(tick,30);
	//tick();