// Constantes utiles au programme:
var TAILLE_ECRAN = 480, TAILLE_BLOC = 20;
var CHAMPIS_MIN = 30, CHAMPIS_MAX = 34;
var DIR_HAUT = 0, DIR_BAS = 1, DIR_GAUCHE = 2, DIR_DROITE = 3; // DO NOT EDIT

var HAUTEUR_GRILLE = TAILLE_ECRAN/TAILLE_BLOC-1, LARGEUR_GRILLE = TAILLE_ECRAN/TAILLE_BLOC;

var HAUT_ZONE_JOUEUR = (TAILLE_ECRAN/TAILLE_BLOC-6)*TAILLE_BLOC;

// Variables (globales) du programme

var cnv = null, ctx = null;

var lastTime = 0, dt;

// Touches clavier

var toucheHaut = false, toucheBas = false,
    toucheGauche = false, toucheDroite = false;
var toucheZ = false, toucheS = false,
    toucheQ = false, toucheD = false;
var appuiHaut = false, appuiBas = false,
    appuiGauche = false, appuiDroite = false;
var appuiTir = false;

// Types agrégés

var joueur;
var nbChampis, champis = []; // Le compteur ne servira qu'au début
var centipede = [];
var tir;
var araignee, puce, scorpion;

var vie;
var niveau;
var score;

// Variables pour le programme

var imgsChampis = [null, [], [], [],[], []];
var imgsAraignee = [null, [], [], [], []];
var imgTeteCenti, imgCorpsCenti;

var rotations = [0, Math.PI, -Math.PI/2, Math.PI/2];

var update, render;

/////////////////////
// Initialisation //
///////////////////

initLancement = function() {
    // lancement de la boucle de jeu
	update = updateMain;
	render = renderMain;
	score = 0;
    lastTime = Date.now();
    boucleDeJeu();
}

initAraignee = function(lvl) {
	var arImg = new Image();
	arImg.onload = function () {
		imgsAraignee[lvl] = arImg;
		if (lvl == 4) {
		    spawnAraignee();
		    initLancement();
		} else
		    initAraignee(lvl+1);
	}
	arImg.src = "imgs/Araignée" + lvl  + ".png";
}

initCentipede = function() {
	imgTeteCenti = new Image();
	imgTeteCenti.onload = function() {
		imgCorpsCenti = new Image();
		imgCorpsCenti.onload = function () {
		    spawnCentipede();
		    initAraignee(1);
		}
		imgCorpsCenti.src = "imgs/CorpsCentipedeHaut.png";
	}
	imgTeteCenti.src = "imgs/TeteCentipedeHaut.png";
}
initTir = function()
{
	tir = 
	{
		boite: {x: 0, y:0, w:5, h:15 , col:"#FE0101"},
		actif: false,
		vitesse: 0.75,		
	};
	initCentipede();
}
initChampignons = function(nbC, lvl) {
	var champisImg = new Image();
	champisImg.onload = function () {
		imgsChampis[lvl][nbC] = champisImg;
		if (nbC == 4) {
			if(lvl == 5) 
			{
				nbChampis = Math.floor(Math.random()*(CHAMPIS_MAX-CHAMPIS_MIN+1) + CHAMPIS_MIN);
				for (var i=0 ; i<nbChampis ; i++)
				  creerChampi(champis);
				initTir();
			}else 
				initChampignons(1, lvl +1);
		} else
			initChampignons(nbC+1, lvl);
	}
	champisImg.src = "imgs/Champignon" + nbC + "Lvl"+ lvl  + ".png";
}

initJoueur = function() {
    var playerImg = new Image();
    playerImg.onload = function() {
        joueur = {
          boite: {x: (cnv.width-TAILLE_BLOC)/2, y: cnv.height-TAILLE_BLOC, w: TAILLE_BLOC, h: TAILLE_BLOC, img: playerImg},
          vies: 2,
          vitesse: 0.2
        };
        initChampignons(1,1);
    }
    playerImg.src = "imgs/Joueur.png";
}


init = function() {
    // instanciation de la variable globale contenant le contexte
    cnv = document.getElementById("cnv");
    ctx = cnv.getContext("2d");

    // 2 écouteurs pour le clavier (appui/relâchement d'une touche)
    document.addEventListener("keydown", captureAppuiToucheClavier);
    document.addEventListener("keyup", captureRelacheToucheClavier);
    // on associe au document un écouteur d'événements souris
    //document.addEventListener("click", captureClicSouris)

    // Initialisation des variables
	niveau = 1; // creerChampi en a besoin
	nivMax = parseInt(localStorage.getItem("CentipedeCMINivMax")) || 1;
	record = parseInt(localStorage.getItem("CentipedeCMIRecord")) || 0;
	
    initJoueur();
	
}


boucleDeJeu = function() {
    // mise à jour de l'état du jeu
    update(Date.now());
    // affichage de l'état du jeu
    render();
    // rappel de la boucle de jeu
    requestAnimationFrame(boucleDeJeu);
}


/**
 *  Mise à jour de l'état du jeu
 *  @param  d   date courante
 */
updateMain = function(d) {
    dt = d - lastTime;
    lastTime = d;

    deplacementPersonnage();
    updateTir();
    avancementCentipedes();
    updateAraignee();
    testMort();
}





/**
 *  Fonction réalisant le rendu de l'état du jeu
 */
renderMain = function() {
    // effacement de l'écran
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.fillStyle="#002";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
	
	// Affichage du jeu
	drawTexteSuperieur();
	//drawTextDead();
    dessineBoite(joueur);
    if (araignee.active)
	dessineBoite(araignee);
    for (var i=0 ; i<champis.length ; i++)
        dessineBoite(champis[i]);
    if(tir.actif)
	dessineBoite(tir);
    for (var i=0 ; i<centipede.length ; i++) {
		if (centipede[i] != null && centipede[i].etat)
			dessineBoite(centipede[i]);
    }
}

/////////////////////
// Sous-fonctions //
///////////////////

function spawnCentipede() {
	var vitesse = 0.15*Math.log(2+niveau);
	var seg = 0;
	centipede = [];
	while (seg < niveau && seg < 12) {
		centipede[seg] = {
			etat: 1,
			vitesse: vitesse,
			direction: DIR_BAS,
			debutVertical: -TAILLE_BLOC,
			ancienneDirX: DIR_GAUCHE,
			ancienneDirY: DIR_BAS,
			checkpoints: [],
			boite: {
				x: TAILLE_BLOC*(Math.floor(LARGEUR_GRILLE/2)+Math.min(12, niveau/2) - 2*seg),
				y: -TAILLE_BLOC,
				w: TAILLE_BLOC,
				h: TAILLE_BLOC,
				img: imgTeteCenti,
				rotate: true
			}
		};
		seg++;
	}
	while (seg < 12) {
		centipede[seg] = {
			etat: 2,
			vitesse: vitesse,
			direction: 1,
			curCP: 0, // Checkpoint à traiter
			boite: {
				x: -TAILLE_BLOC, // Écrasé peu après
				y: -TAILLE_BLOC, // Écrasé peu après
				w: TAILLE_BLOC,
				h: TAILLE_BLOC,
				img: imgCorpsCenti,
				rotate: true
			}
		};
		seg++;
	}
}

function spawnAraignee() {
    araignee = {
	vitesseX: 0,
	vitesseY: 0,
	directionX: DIR_GAUCHE,
	nextMove: 0,
	active: false,
	boite: {
		x: -TAILLE_BLOC,
		y: -TAILLE_BLOC,
		w: TAILLE_BLOC,
		h: TAILLE_BLOC,
		img: imgsAraignee[1+(niveau+1)%4]
	}
    };
}

function resetAraignee() {
    araignee.directionX = Math.round(Math.random())?DIR_GAUCHE:DIR_DROITE;
    araignee.vitesseX = araignee.directionX==DIR_GAUCHE?-0.2:0.2;
    araignee.vitesseY = 0.2;
    araignee.nextMove = lastTime + 100 + 300*Math.random();
    araignee.active = true;
    araignee.boite = {
	x: araignee.directionX==DIR_GAUCHE?480:-TAILLE_BLOC,
	y: 480-6*TAILLE_BLOC,
	w: TAILLE_BLOC,
	h: TAILLE_BLOC,
	img: imgsAraignee[1+(niveau+1)%4]
    };


}

function testMort()
{
	for(var i =0 ; i < centipede.length; i++)
	{	
		
		if (collisionTolerante(joueur, centipede[i], 0.5*TAILLE_BLOC) && centipede[i].etat !=0
			|| araignee.active && collisionTolerante(joueur, araignee, 0.5*TAILLE_BLOC))
		{
			if (niveau > nivMax)
				localStorage.setItem("CentipedeCMINivMax", niveau);
			if (score > record)
				localStorage.setItem("CentipedeCMIRecord", score);
			joueur.vies--;
			update = function () {};
			if (joueur.vies >= 0) {
				var oldUpdate = update;
				var oldRender = render;
				render = renderMort;
				setTimeout(function () {
					update = updateMain;
					render = renderMain;
					spawnCentipede();
					joueur.boite.x = (cnv.width-TAILLE_BLOC)/2;
					joueur.boite.y = cnv.height-TAILLE_BLOC;
					for (var i=0 ; i<5 ; i++)
					  creerChampi(champis);
					lastTime = Date.now(); 
				}, 1000);
			} else {
				render = renderGameOver;
			}
			break;
			
		}


	}
	
	
}
	


//text centré
drawCenterText = function(text, y)
{
	var textdim = ctx.measureText(text);
	ctx.fillText(text, (TAILLE_ECRAN-textdim.width)/2, y);
}

function renderGameOver() {
	var gradient=ctx.createLinearGradient(0, 250 ,0, 310);
	gradient.addColorStop("0","magenta");
	gradient.addColorStop("0.5","blue");
	gradient.addColorStop("0.99","red");
	gradient.addColorStop("1.0","lime");
	// Fill with gradient
	ctx.fillStyle=gradient;
	drawCenterText("Vous êtes mort",250);
	drawCenterText(" <=> YOU SUCK DUDE !",280);
	drawCenterText(" <=> TRY AGAIN!",310);
	if (score > record) {
		drawCenterText("Nouveau record !",340);
		if (niveau > nivMax)
			drawCenterText("Meilleur niveau atteint !",370);
	} else if (niveau > nivMax)
		drawCenterText("Meilleur niveau atteint !", 340);
	drawCenterText("RECORD À BATTRE NIVEAU : 303 !",400);
	drawCenterText("RECORD À BATTRE SCORE : 363 965 !",440);
}
function renderMort() {
	var gradient=ctx.createLinearGradient(0, 250 ,0, 280);
	/*gradient.addColorStop("0","magenta");
	gradient.addColorStop("0.5","blue");
	gradient.addColorStop("1.0","red");*/
	gradient.addColorStop("0","white");
	gradient.addColorStop("0.5","gray");
	gradient.addColorStop("1.0","darkblue");
	// Fill with gradient
	ctx.fillStyle=gradient;
	drawCenterText("Vous êtes mort !", 250);
	drawCenterText("Encore "+joueur.vies+" vies !",280);
}

function drawTexteSuperieur() {
    ctx.font = "bold " + TAILLE_BLOC + "px Arial";
    ctx.fillStyle = "#FF0000";

    ctx.fillText("Niv. : "+niveau+"/"+nivMax, 1, TAILLE_BLOC);
    ctx.fillText("Score : "+score+"/"+record, 140, TAILLE_BLOC);
    ctx.fillText("Vie : "+joueur.vies, 400, TAILLE_BLOC);
}

function updateTir()
{
	if(appuiTir && !tir.actif)
	{
		tir.actif = true;
		tir.boite.x = joueur.boite.x + (TAILLE_BLOC - tir.boite.w)/2;
		tir.boite.y = joueur.boite.y ;
		playSound("Tir");
		
	}
	if(tir.actif)
	{	
		tir.boite.y -= tir.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
		{
			if(collision(tir,champis[i]))
			{
			tir.actif=false;
			detruireChampi(i);
			//score = score  + 1;
			break;
			}
		}
		for(var i=0; i < centipede.length; i++)
		{
			if(centipede[i].etat && collision(tir,centipede[i]))
			{				
				detruireSegment(i);
				tir.actif=false;
				break;
			}
		}
		if(araignee.active && collision(tir,araignee))
			{				
				araignee.active = false;
				araignee.nextMove = lastTime + 9000 + 2000*Math.random();
				tir.actif=false;
				score += 600;
			}

	}
	if(tir.boite.y <= -tir.boite.h )
	{
		tir.actif=false;
	}
}
function deplacementPersonnage()
{
	if (appuiDroite && joueur.boite.x+joueur.boite.w < cnv.width) {
        joueur.boite.x += joueur.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
			if (collisionTolerante(joueur,champis[i], 0.3*TAILLE_BLOC))
			{
				joueur.boite.x -= joueur.vitesse*dt;
				break;
			}
				
	}
	
	if(appuiGauche && joueur.boite.x> 0) {
		joueur.boite.x -=joueur.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
			if (collisionTolerante(joueur,champis[i], 0.3*TAILLE_BLOC))
			{
				joueur.boite.x += joueur.vitesse*dt;
				break;				
			}
	}

	if(appuiHaut && joueur.boite.y > HAUT_ZONE_JOUEUR) {
		joueur.boite.y -= joueur.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
			if (collisionTolerante(joueur,champis[i], 0.3*TAILLE_BLOC))
			{
				joueur.boite.y += joueur.vitesse*dt;
				break;
			}
				
	}

	if(appuiBas && joueur.boite.y+joueur.boite.h < cnv.height) {
		joueur.boite.y += joueur.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
			if (collisionTolerante(joueur,champis[i], 0.3*TAILLE_BLOC))
			{
				joueur.boite.y -= joueur.vitesse*dt;
				break;
			}
				
	}
}
// function avancementAraignee () {
	// for (var i = 0 )
	
// }

function avancementCentipedes() {
	var iTete, curCP;
	for (var i=0 ; i<centipede.length ; i++) {
		switch (centipede[i].etat) {
			case 1: // Tête qui fonce comme elle peut
				avanceTete(i, centipede[i].vitesse * dt);
				iTete = i;
				curCP = 0;
				break;
			case 2: // Segment déduit depuis la tête et ses checkpoints
				centipede[i].direction = centipede[i-1].direction;
				centipede[i].boite.x = centipede[i-1].boite.x;
				centipede[i].boite.y = centipede[i-1].boite.y;
				curCP = placementSegment(i, iTete, curCP, TAILLE_BLOC);
				centipede[i].curCP = curCP;
				break;
		}
	}
}

function avanceTete(i, dp) { // Gestion récursive du deltaPos (>0) en trop
	switch (centipede[i].direction) {
		case DIR_HAUT:
			if (centipede[i].boite.y - dp <= centipede[i].debutVertical - TAILLE_BLOC) {
				dp -= centipede[i].boite.y - centipede[i].debutVertical;
				centipede[i].boite.y = centipede[i].debutVertical - TAILLE_BLOC;
				centipede[i].direction = (centipede[i].ancienneDirX==DIR_GAUCHE)?DIR_DROITE:DIR_GAUCHE;
				centipede[i].checkpoints.unshift({x: centipede[i].boite.x, y: centipede[i].boite.y, dir: DIR_HAUT});
				if (centipede[i].boite.y == HAUT_ZONE_JOUEUR) {
					centipede[i].ancienneDirY = DIR_BAS;
					// Faire respawn une tête
					var spawnX, spawnDir;
					if (Math.round(Math.random())) {
						spawnX = -TAILLE_BLOC;
						spawnDir = DIR_DROITE;
					} else {
						spawnX = 480;
						spawnDir = DIR_GAUCHE;
					}
					centipede.push({
						etat: 1,
						vitesse: 0.4,
						direction: spawnDir,
						debutVertical: HAUT_ZONE_JOUEUR,
						ancienneDirX: spawnDir,
						ancienneDirY: DIR_BAS,
						checkpoints: [],
						boite: {
							x: spawnX,
							y: HAUT_ZONE_JOUEUR,
							w: TAILLE_BLOC,
							h: TAILLE_BLOC,
							img: imgTeteCenti,
							rotate: true
						}
					});
				}
			} else
				centipede[i].boite.y -= dp;
			dp = 0; // Assez avancé
			break;
		case DIR_BAS:
			if (centipede[i].boite.y + dp >= centipede[i].debutVertical+TAILLE_BLOC) {
				dp -= centipede[i].debutVertical+TAILLE_BLOC - centipede[i].boite.y;
				centipede[i].boite.y = centipede[i].debutVertical+TAILLE_BLOC;
				centipede[i].direction = (centipede[i].ancienneDirX==DIR_GAUCHE)?DIR_DROITE:DIR_GAUCHE;
				centipede[i].checkpoints.unshift({x: centipede[i].boite.x, y: centipede[i].boite.y, dir: DIR_BAS});
				if (centipede[i].boite.y == 480 - TAILLE_BLOC) {
					centipede[i].ancienneDirY = DIR_HAUT;
					/*if (i < centipede.length-1 && centipede[i+1].etat == 2) {
						centipede[i+1].etat = 1;
						centipede[i+1].boite.img = imgTeteCenti;
						centipede[i+1].checkpoints = [];
						centipede[i+1].ancienneDirX = centipede[i].ancienneDirX || centipede[i].direction;
						centipede[i+1].ancienneDirY = DIR_BAS;
					}*/
				}
			} else
				centipede[i].boite.y += dp;
			dp = 0; // Assez avancé
			break;
		case DIR_GAUCHE:
			centipede[i].boite.x -= dp;
			var goDown = centipede[i].boite.x < 0,
			ch = champis.length;
			if (!goDown) { // Note au benêt : à l'époque j'avais la flemme de gérer la remontée
				for(ch = 0 ; ch < champis.length ; ch++) {
					if (champis[ch].boite.x < centipede[i].boite.x && collision(centipede[i],champis[ch])) {
						goDown = true;
						break;
					}
				}
			}
			if (goDown) {
				centipede[i].debutVertical = centipede[i].boite.y;
				centipede[i].ancienneDirX = DIR_GAUCHE;
				centipede[i].direction = centipede[i].ancienneDirY;
				if (ch < champis.length) {
					dp = champis[ch].boite.x + TAILLE_BLOC - centipede[i].boite.x
					centipede[i].boite.x = champis[ch].boite.x + TAILLE_BLOC;
				} else {
					dp = - centipede[i].boite.x
					centipede[i].boite.x = 0;
				}
				centipede[i].checkpoints.unshift({x: centipede[i].boite.x, y: centipede[i].boite.y, dir: DIR_GAUCHE});
			} else {
				dp = 0;
			}
			break;
		case DIR_DROITE:
			centipede[i].boite.x += dp;
			var goDown = centipede[i].boite.x >= 480 - TAILLE_BLOC,
			ch = champis.length;
			if (!goDown) {
				for(ch = 0 ; ch < champis.length ; ch++) {
					if (champis[ch].boite.x > centipede[i].boite.x && collision(centipede[i],champis[ch])) {
						goDown = true;
						break;
					}
				}
			}
			if (goDown) {
				centipede[i].debutVertical = centipede[i].boite.y;
				centipede[i].ancienneDirX = DIR_DROITE;
				centipede[i].direction = centipede[i].ancienneDirY;
				if (ch < champis.length) {
					dp = centipede[i].boite.x + TAILLE_BLOC - champis[ch].boite.x;
					centipede[i].boite.x = champis[ch].boite.x - TAILLE_BLOC;
				} else {
					dp = centipede[i].boite.x + TAILLE_BLOC - 480;
					centipede[i].boite.x = 480 - TAILLE_BLOC;
				}
				centipede[i].checkpoints.unshift({x: centipede[i].boite.x, y: centipede[i].boite.y, dir: DIR_DROITE});
			} else {
				dp = 0;
			}
			break;
		default:
			dp = 0;
	}
	if (dp > 0) {
		//console.log("Relaunch!");
		avanceTete(i, dp);
	}
}

function placementSegment(i, tete, iCP, dp) {
	var testCP = iCP < centipede[tete].checkpoints.length,
		applyCP = false,
		cp = centipede[tete].checkpoints[iCP];
	// console.log(tete);
	// console.log(iCP);
	// console.log(centipede);
	// console.log(centipede[tete].checkpoints[iCP]);
	// console.log(cp);
	switch (centipede[i].direction) {
		case DIR_HAUT:
			centipede[i].boite.y += dp;
			applyCP = testCP && centipede[i].boite.y > cp.y;
			break;
		case DIR_BAS:
			centipede[i].boite.y -= dp;
			applyCP = testCP && centipede[i].boite.y < cp.y;
			break;
		case DIR_GAUCHE:
			centipede[i].boite.x += dp;
			applyCP = testCP && centipede[i].boite.x > cp.x;
			break;
		case DIR_DROITE:
			centipede[i].boite.x -= dp;
			applyCP = testCP && centipede[i].boite.x < cp.x;
			break;
	}
	if (applyCP) {
		dp = Math.abs(centipede[i].boite.x - cp.x) + Math.abs(centipede[i].boite.y - cp.y);
		centipede[i].boite.x = cp.x;
		centipede[i].boite.y = cp.y;
		centipede[i].direction = cp.dir;
		iCP++;
		if (dp > 0) {
			//console.log("Replacing segment ", i, " for ", TAILLE_BLOC - dp, "px");
			iCP = placementSegment(i, tete, iCP, dp);
		}
	}
	return iCP;
}

function updateAraignee() {
    if (lastTime > araignee.nextMove) {
		if (araignee.active) {
			switch (Math.floor(Math.random()*3)) {
			case 0: // Inversion sur Y
			case 1:
				araignee.vitesseY *= -1;
				araignee.vitesseX = 0;
				break;
			case 2: // Partage en diagonale
				araignee.vitesseX = araignee.directionX==DIR_GAUCHE?-0.2:0.2;
				araignee.vitesseY = 0.2;
				break;
			}
		} else {
			resetAraignee();
		}
		araignee.nextMove = lastTime + 100 + 300 * Math.random();
    }
    if (araignee.active) {
		araignee.boite.x += araignee.vitesseX * dt;
		araignee.boite.y += araignee.vitesseY * dt;
		if (araignee.vitesseX > 0 && araignee.boite.x > 480
			|| araignee.vitesseX < 0 && araignee.boite.x < -TAILLE_BLOC) {
			araignee.active = false;
			araignee.nextMove = lastTime + 9000 + 2000*Math.random();
		} else if (araignee.vitesseY > 0 && araignee.boite.y > 480 - TAILLE_BLOC
			|| araignee.vitesseY < 0 && araignee.boite.y < HAUT_ZONE_JOUEUR) {
			araignee.vitesseY = -araignee.vitesseY;
			araignee.vitesseX = 0;
			araignee.nextMove = lastTime + 100 + 300 * Math.random();
		}
    }
	for(var i =0 ; i < champis.length;i++)
	{
		if(collision(araignee, champis[i]))
		{
			detruireChampi(i);
			// break;
		}
	}
}

function niveauSuivant() {
	var passe = true, seg = 0;
	while (passe && seg < centipede.length) {
		if (centipede[seg].etat != 0)
			passe = false;
		else
			seg++;
	}
	if (passe) {
		setTimeout(function() {
			niveau++;
			for (var ch = 0 ; ch < champis.length ; ch++)
				champis[ch].boite.img = imgsChampis[(niveau-1)%5+1][champis[ch].vie];
			spawnCentipede();
		}, 1000);
	}
}

//Avec Z,Q,S,Date
/*
	if (appuiD && joueur.boite.x < cnv.width) {
        boite.dt++;
		//if (collision())
	}
	
	if(appuiQ && joueur.boite.x > 0) {
		boite.dt--;
		//if (collision())
	}

	if(appuiZ && joueur.boite.y > 0) {
		boite.dt--;
		//if (collision())
	}

	if(appuiS && joueur.boite.y < cnv.height) {
		boite.dt--;
		//if (collision())
	}

}
*/
//////////////////
// Utilitaires //
////////////////

/**
 * Fonction qui génère un champignon sain à une place disponible dans la grille
 */
function creerChampi(x, y) {
	if (x === undefined || y === undefined) {
		var nouvChampiX, nouvChampiY, duplique;
		do {
			nouvChampiX = Math.floor(Math.random()*LARGEUR_GRILLE)*TAILLE_BLOC;
			nouvChampiY = TAILLE_BLOC + Math.floor(Math.random()*(HAUTEUR_GRILLE-1))*TAILLE_BLOC;
			duplique = false;
			for (var ch=0 ; ch<champis.length ; ch++) {
				duplique |= champis[ch].boite.x == nouvChampiX && champis[ch].boite.y == nouvChampiY;
			}
		} while (duplique);
		champis.push({
			boite: {x: nouvChampiX, y: nouvChampiY, w: TAILLE_BLOC, h: TAILLE_BLOC, img: imgsChampis[(niveau-1)%5+1][4]},
			vie: 4,
			estVeneneux: false
		});
	} else {
		var nch = {
			boite: {x: x, y: y, w: TAILLE_BLOC, h: TAILLE_BLOC},
			vie: 4,
			estVeneneux: false
		}, touche = false;
		
		for (var ch=0 ; ch<champis.length ; ch++) {
			if (collision(nch, champis[ch])) {
				touche = true;
				//console.log("Spawn impossible !");
				break;
			}
		}
		
		if (!touche) {
			nch.boite.img = imgsChampis[(niveau-1)%5+1][4];
			champis.push(nch);
		}
	}
}

/**
* Fonction qui test la collision entre deux objets
*/
function collision (e1,e2)
{
	var rectangle1 = e1.boite;
	var rectangle2 = e2.boite;
	return !(rectangle1.x+rectangle1.w <= rectangle2.x || 
                 rectangle1.x >= rectangle2.x+rectangle2.w || 
                 rectangle1.y+rectangle1.h <= rectangle2.y || 
                 rectangle1.y >= rectangle2.y+rectangle2.h);
}

function collisionTolerante (e1,e2, t)
{
	var rectangle1 = e1.boite;
	var rectangle2 = e2.boite;
	return !(rectangle1.x + rectangle1.w <= rectangle2.x + t ||
                rectangle1.x + t >= rectangle2.x + rectangle2.w ||
                rectangle1.y + rectangle1.h <= rectangle2.y + t ||
                rectangle1.y + t >= rectangle2.y + rectangle2.h);
}

function detruireChampi (index) {
  champis[index].vie--;
  
  if (champis[index].vie == 0) {
    for (var c=index ; c<champis.length-1 ; c++)
      champis[c] = champis[c+1];
		champis.pop();
		addScore(1);
  } else {
    champis[index].boite.img = imgsChampis[(niveau-1)%5+1][champis[index].vie];
	
  }

}

function detruireSegment(i)
{
	if(centipede[i].etat == 1)
		addScore(100);
	if(centipede[i].etat == 2)
		addScore(10);
	if (i < centipede.length-1) {
		// On vérifie le segment d'après
		if (centipede[i+1].etat == 2) {
			var tete = getHead(i+1);
			centipede[i+1].etat = 1;
			centipede[i+1].boite.img = imgTeteCenti;
			/*var seg = i+2;
			if (centipede[i].etat == 2) {
				while (seg < centipede.length && centipede[seg].etat == 2) {
					//console.log(centipede[i+1].checkpoints.length, " checkpoints supprimés pour le segment " + seg +" qui en avait " + centipede[seg].checkpoints.length + ".");
					for (var ch = 0 ; ch < centipede[i+1].checkpoints.length ; ch++) {
						//console.log("SHIFTING");
						centipede[seg].checkpoints.shift();
					}
					//console.log("Maintenant " + centipede[seg].checkpoints.length + ".");
					seg++;
				}
			}
			centipede[i+1].checkpoints = null;*/
			
			centipede[i+1].checkpoints = [];
			for (var cp = centipede[i+1].curCP ; cp < centipede[tete].checkpoints.length ; cp++)
				centipede[i+1].checkpoints.push(centipede[tete].checkpoints[cp]);

			if (centipede[i+1].direction == DIR_BAS)
				centipede[i+1].debutVertical = centipede[i+1].boite.y-centipede[i+1].boite.y%TAILLE_BLOC;
			else if (centipede[i+1].direction == DIR_HAUT)
				centipede[i+1].debutVertical = centipede[i+1].boite.y-centipede[i+1].boite.y%TAILLE_BLOC + TAILLE_BLOC;
			else
				centipede[i+1].debutVertical = 0;

			centipede[i+1].ancienneDirX = centipede[i].ancienneDirX || centipede[i].direction;
			centipede[i+1].ancienneDirY = centipede[tete].ancienneDirY;
			
		}
	}
	centipede[i].etat = 0;
	var spawnX = centipede[i].boite.x-centipede[i].boite.x%TAILLE_BLOC,
		spawnY = centipede[i].boite.y-centipede[i].boite.y%TAILLE_BLOC;
	switch (centipede[i].direction) {
		// case DIR_HAUT:
			// spawnY-= TAILLE_BLOC;
			// break;
		case DIR_BAS:
			spawnY+= TAILLE_BLOC;
			break;
		// case DIR_GAUCHE:
			// spawnX-= TAILLE_BLOC;
			// break;
		case DIR_DROITE:
			spawnX+= TAILLE_BLOC;
			break;
	}
	creerChampi(spawnX, spawnY);
	niveauSuivant();
}

/**
 * Retourne l'index de la tête associée au segment
 */
function getHead(seg) {
  while (seg >= 0 && centipede[seg].etat == 2)
    seg--;
  if (seg < 0 || centipede[seg].etat != 1)
    return -1;
  else
    return seg;
}

function addScore(delta) {
	if (delta > 0) {
		var lifePart = Math.floor(score/12000); // Sans ennemis supplémentaires, plus équilibré que 12 000
		score += delta;
		joueur.vies += Math.floor(score/12000) - lifePart;
	}
}

// Affichage

function dessineBoite(obj) {
    //console.log(obj);
    //ctx.fillStyle = "#0f0";
    //ctx.fillRect(obj.boite.x, obj.boite.y, obj.boite.w, obj.boite.h);
	if (obj.boite != null) {
		if (obj.boite.img != null) {
			if (obj.boite.rotate !== undefined) {
				ctx.save();
				ctx.translate(obj.boite.x + obj.boite.w/2, obj.boite.y + obj.boite.h/2);
				ctx.rotate(rotations[obj.boite.rotate === true?obj.direction:obj.boite.rotate]);
				ctx.drawImage(obj.boite.img, - obj.boite.w/2, - obj.boite.h/2, obj.boite.w, obj.boite.h);
				ctx.restore();
			} else
				ctx.drawImage(obj.boite.img, obj.boite.x, obj.boite.y, obj.boite.w, obj.boite.h);
		} else if (obj.boite.col != null) {
			ctx.fillStyle = obj.boite.col;
			ctx.fillRect(obj.boite.x, obj.boite.y, obj.boite.w, obj.boite.h);
		}
	}
}

function playSound(name) {
    //document.getElementById("son"+name).pause();
    document.getElementById("son"+name).currentTime = 0;
    if (document.getElementById("son"+name).paused)
	document.getElementById("son"+name).play();
    console.log(document.getElementById("son"+name));
}

/**
 *  Fonction appelée lorsqu'une touche du clavier est appuyée
 *  Associée à l'événement "keyDown"
 */
captureAppuiToucheClavier = function(event) {
    // pratique pour connaître les keyCode des touches du clavier :
    //  --> http://www.cambiaresearch.com/articles/15/javascript-key-codes
    switch (event.keyCode) {
      case 38:
        toucheHaut = true;
        event.preventDefault();
        break;
      case 40:
        toucheBas = true;
        event.preventDefault();
        break;
      case 37:
        toucheGauche = true;
        event.preventDefault();
        break;
      case 39:
        toucheDroite = true;
        event.preventDefault();
        break;
      case 90:
        toucheZ = true;
        break;
      case 83:
        toucheS = true;
        break;
      case 81:
        toucheQ = true;
        break;
      case 68:
        toucheD = true;
        break;
      case 32:
        appuiTir = true;
        event.preventDefault();
    }

    miseAJourAppuis();
}

/**
 *  Fonction appelée lorsqu'une touche du clavier est relâchée
 *  Associée à l'événement "keyUp"
 */
captureRelacheToucheClavier = function(event) {
    switch (event.keyCode) {
      case 38:
        toucheHaut = false;
        break;
      case 40:
        toucheBas = false;
        break;
      case 37:
        toucheGauche = false;
        break;
      case 39:
        toucheDroite = false;
        break;
      case 90:
        toucheZ = false;
        break;
      case 83:
        toucheS = false;
        break;
      case 81:
        toucheQ = false;
        break;
      case 68:
        toucheD = false;
        break;
      case 32:
        appuiTir = false;
    }
  miseAJourAppuis();
}

miseAJourAppuis = function() {
  appuiHaut = toucheHaut || toucheZ;
  appuiBas = toucheBas || toucheS;
  appuiGauche = toucheGauche || toucheQ;
  appuiDroite = toucheDroite || toucheD;
  //console.log((appuiHaut)?"Touche Haut appuyée":"Touche Haut relâchée.");
  //console.log((appuiBas)?"Touche Bas appuyée":"Touche Bas relâchée.");
  //console.log((appuiGauche)?"Touche Gauche appuyée":"Touche Gauche relâchée.");
  //console.log((appuiDroite)?"Touche Droite appuyée":"Touche Droite relâchée.");
  //console.log((appuiTir)?"Touche Tir appuyée":"Touche Tir relâchée.");
}

/**
 *  Fonction appelée lorsqu'une touche du clavier est relâchée
 *  Associée à l'événement "click"
 */
// Inutile pour la version basique du jeu
/* captureClicSouris = function(event) {
    // calcul des coordonnées de la souris dans le canvas
    if (event.target.id == "cvs") {
        clic.x = event.pageX - event.target.offsetLeft;
        clic.y = event.pageY - event.target.offsetTop;
    }
} */
