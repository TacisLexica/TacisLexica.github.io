
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
	let mapHeight = 42;
	
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
	
	let scale = 4;
	
	cvs.width = cvsGrid.width * scale;
	cvs.height = cvsGrid.height * scale;
	
	let playerX = 0;
	let playerY = 0;
	
	let terr = new Uint8ClampedArray(mapWidth * mapHeight);
	
	let cellTypes = {
		VOID:			0,
		AIR:			1,
		PLAYER:			2,
		HEALTH_EMPTY:	3,
		HEALTH_FULL:	4,
		INV_EMPTY:		5,
		INV_FULL:		6,
		FUEL_EMPTY:		7,
		FUEL_FULL:		8,
		DIRT:			9,
		ROCK:			10,
		FUEL_ORE:		11
	}
	
	let colours = [];
	colours[cellTypes.VOID]			= "#000000";
	colours[cellTypes.AIR]			= "#905320";
	colours[cellTypes.PLAYER]		= "#7FFFFF";
	colours[cellTypes.HEALTH_EMPTY]	= "#800000";
	colours[cellTypes.HEALTH_FULL]	= "#FF0000";
	colours[cellTypes.INV_EMPTY]	= "#202020";//Will be repurposed
	colours[cellTypes.INV_FULL]		= "#FFFFFF";//Will be repurposed
	colours[cellTypes.FUEL_EMPTY]	= "#008000";
	colours[cellTypes.FUEL_FULL]	= "#00FF00";
	colours[cellTypes.DIRT]			= "#703300";
	colours[cellTypes.ROCK]			= "#707070";
	colours[cellTypes.FUEL_ORE]		= "#00A000";
	
	terr.fill(cellTypes.DIRT, 0, mapWidth * mapHeight);

	setTerrainType(playerX, playerY, cellTypes.AIR);
	
	scatterTerrainInBox(0,1,mapWidth,5, cellTypes.FUEL_ORE, 20);
	
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
		
		ctxGrid.fillStyle = colours[cellTypes.VOID];
		ctxGrid.fillRect(0, 0, cvsGrid.width, cvsGrid.height);
		
		drawGameMap(gameBorderWidth, gameBorderWidth, viewWidth, viewHeight, playerX - Math.floor(viewWidth/2), playerY - Math.floor(viewHeight/2));
		
		ctxGrid.fillStyle = colours[cellTypes.PLAYER];
		ctxGrid.fillRect(gameBorderWidth + Math.floor(viewWidth/2), gameBorderWidth + Math.floor(viewHeight/2), 1, 1);
		
		drawInv(gameBorderWidth + viewWidth + 1, gameBorderWidth);
		
		
		//Draw to main canvas
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(cvsGrid,0,0,cvs.width,cvs.height);
	}
	
	let lastMoveTime = new Date(0);
	
	function movePlayer(targetX, targetY) {
		let targetType = getTerrainType(targetX,targetY);
		
		if (targetType !== cellTypes.ROCK) {
			lastMoveTime = new Date();
			
			let movesRequired = 1;
			if (targetType !== cellTypes.AIR) {
				++movesRequired; //Dig penalty
			}
			
			if (movesRemaining < movesRequired) {
				if (currentFuel) {
					--currentFuel;
					movesRemaining += movesPerFuel;
				}
				else {
					if (movesRemaining == 0) {
						console.log("Lose - no fuel, no moves.");
					}
					return;
				}
			}
			
			movesRemaining -= movesRequired;
			
			if (targetType !== cellTypes.DIRT) {
				if (targetType !== cellTypes.AIR) {
					addToInventory(targetType);
				}
			}
			//console.log(movesRemaining);
			setTerrainType(targetX, targetY, cellTypes.AIR);
			playerX = targetX;
			playerY = targetY;
		}
	}
	
	function addToInventory(type, qty) {
		qty = qty || 1;
		
		//Fuel ore -> fuel
		if (type == cellTypes.FUEL_ORE) {
			++currentFuel;
			return; //Balancing decision
		}
		
		//Find some space
		let spot = currentInv.findIndex((i) => {return i == cellTypes.VOID});
		if (spot >= maxInv) {
			return;
		}
		currentInv[spot] = maxInv;
	}
	
	function drawInv(startX, startY) {
		
		let j = 0;
		
		for (let i = 0; i < maxHealth; ++i) {
			ctxGrid.fillStyle = colours[currentHealth > i ? cellTypes.HEALTH_FULL : cellTypes.HEALTH_EMPTY];
			j = Math.floor(i / invWidth);
			ctxGrid.fillRect(startX + i % invWidth, startY + j,1,1);
		}
		
		++j;
		
		for (let i = 0; i < maxFuel; ++i) {
			ctxGrid.fillStyle = colours[currentFuel > i ? cellTypes.FUEL_FULL : cellTypes.FUEL_EMPTY];
			if (i % invWidth == 0) {
				++j;
			}
			ctxGrid.fillRect(startX + i % invWidth, startY + j,1,1);
		}
		
		++j;
		
		for (let i = 0; i < maxInv; ++i) {
			ctxGrid.fillStyle = colours[currentInv[i] || cellTypes.INV_EMPTY];
			if (i % invWidth == 0) {
				++j;
			}
			ctxGrid.fillRect(startX + i % invWidth, startY + j,1,1);
		}
	}
	
	function drawGameMap(startX, startY, width, height, terrainX0, terrainY0) {
		for(let x = 0; x < width; ++x) {
			for(let y = 0; y < height; ++y) {
				ctxGrid.fillStyle = colours[terr[cellToIndex(terrainX0 + x, terrainY0 + y)]];
				ctxGrid.fillRect(startX + x, startY + y, 1, 1);
			}
		}
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