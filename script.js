// Constantes utiles au programme:
var TAILLE_ECRAN = 480, TAILLE_BLOC = 24;
var CHAMPIS_MIN = 30, CHAMPIS_MAX = 34;
var DIR_HAUT = 0, DIR_BAS = 1, DIR_GAUCHE = 2, DIR_DROITE = 3; // DO NOT EDIT

var HAUTEUR_GRILLE = TAILLE_ECRAN/TAILLE_BLOC-1, LARGEUR_GRILLE = TAILLE_ECRAN/TAILLE_BLOC;

var HAUT_ZONE_JOUEUR = (TAILLE_ECRAN/TAILLE_BLOC-5)*TAILLE_BLOC;

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


var niveau;
var score;

// Variables pour le programme

var imgsChampis = [null, [], [], [],[],[]];
var imgTeteCenti, imgCorpsCenti;

/////////////////////
// Initialisation //
///////////////////

initLancement = function() {
    // lancement de la boucle de jeu
    lastTime = Date.now();
	score = 0;
	niveau = 1;
    boucleDeJeu();
	

}
initCentipede = function() {
    imgTeteCenti = new Image();
    imgTeteCenti.onload = function() {
      imgCorpsCenti = new Image();
      imgCorpsCenti.onload = function () {
	centipede[0] = {
	  etat: 1,
	  vitesse: 0.40,
	  direction: DIR_BAS,
	  debutVertical: -TAILLE_BLOC,
	  ancienneDir: DIR_GAUCHE,
	  boite: {
	    x: 6*TAILLE_BLOC,
	    y: 0,
	    w: TAILLE_BLOC,
	    h: TAILLE_BLOC,
	    img: imgTeteCenti
	  }
	};
	for (var seg=1 ; seg<12; seg++) {
	  centipede[seg] = {
	    etat: 2,
	    vitesse: 0.40,
	    direction: 1,
	    //checkpoints: [{nextDir:DIR_DROITE, px: 0}],
	    checkpoints: [],
	    boite: {
	      x: 6*TAILLE_BLOC,
	      y: -seg*TAILLE_BLOC,
	      w: TAILLE_BLOC,
	      h: TAILLE_BLOC,
	      img: imgCorpsCenti
	    }
	  };
	}
	initLancement();
      }
      imgCorpsCenti.src = "imgs/CorpsCentipedeHaut.png";
    }
    imgTeteCenti.src = "imgs/TeteCentipedeHaut.png";
}
initTir = function()
{
	//console.log("Initialisation du tir...")
	tir = 
	{
		boite: {x: 0, y:0, w:5, h:15 , col:"#FE0101"},
		actif: false,
		vitesse: 0.95,		
	};
	initCentipede();
}
initChampignons = function(nbC, lvl) {
    //console.log("Initialisation des champignons…");
	var champisImg = new Image();
	champisImg.onload = function () {
		//console.debug("lvl="+lvl+" nbC="+nbC)
		imgsChampis[lvl][nbC] = champisImg; // lvl nbc + modif init
		if (nbC == 4) {
			if(lvl == 5) 
			{
				nbChampis = Math.floor(Math.random()*(CHAMPIS_MAX-CHAMPIS_MIN+1) + CHAMPIS_MIN);
				//console.log(nbChampis);

				for (var i=0 ; i<nbChampis ; i++) {
				  champis[i] = creerChampi(champis);
				  champis[i].boite.img = imgsChampis[1][4];
				}
				//console.log("Initialisation du tir");
				initTir();
				//console.log("Champignons initialisés !");
			}else 
				initChampignons(1, lvl +1);
		} else
			initChampignons(nbC+1, lvl);
	}
	champisImg.src = "imgs/Champignon" + nbC + "Lvl"+ lvl  + ".png";
}

initJoueur = function() {
    //console.log("Initialisation du joueur…");
    var playerImg = new Image();
    playerImg.onload = function() {
        joueur = {
          boite: {x: (cnv.width-TAILLE_BLOC)/2, y: cnv.height-TAILLE_BLOC, w: TAILLE_BLOC, h: TAILLE_BLOC, img: playerImg},
          vies: 2,
          vitesse: 0.2
        };
        //console.log("Joueur initialisé !");
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
update = function(d) {
    dt = d - lastTime;
    lastTime = d;    
	deplacementPersonnage();
	updateTir();
    avancementCentipedes();
	drawScore();
	drawTextDead();
	testMort();
	centiChampi();
}





/**
 *  Fonction réalisant le rendu de l'état du jeu
 */
render = function() {
    // effacement de l'écran
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.fillStyle="#002";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
	drawScore(score);
    dessineBoite(joueur);
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

function testMort()
{
	for(var i =0 ; i < centipede.length;i++)
	{	
		
		if (collisionTolerante(joueur, centipede[i], 0.5*TAILLE_BLOC))
		{
			// update = function()
			// {
				
				
			// }
			render = function()
			{
				drawTextDead();
				
			}
		}
	}
	
}

//text centré
drawCenterText = function(text, y)
{
	var textdim = ctx.measureText(text);
	ctx.fillText(text, (TAILLE_ECRAN-textdim.width)/2, y);
}

function drawTextDead() {
var gradient=ctx.createLinearGradient(0,100,0,0);
gradient.addColorStop("0","magenta");
gradient.addColorStop("0.5","blue");
gradient.addColorStop("1.0","red");
// Fill with gradient
ctx.fillStyle=gradient;
drawCenterText("Vous êtes mort",250);
drawCenterText(" <=> YOU SUCK DUDE !",280);
drawCenterText(" <=> TRY AGAIN!",310);
}
function drawScore() {
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.fillText("Score: "+score, 01, 20);
}
function updateTir()
{
	if(appuiTir && !tir.actif)
	{
		tir.actif = true;
		tir.boite.x = joueur.boite.x + (TAILLE_BLOC - tir.boite.w)/2;
		tir.boite.y = joueur.boite.y ;
		
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
				//centiChampi(champis);
			}
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

	if(appuiHaut && joueur.boite.y+joueur.boite.h > HAUT_ZONE_JOUEUR) {
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

function avancementCentipedes() {
  for (var i=0 ; i<centipede.length ; i++) {
    switch (centipede[i].etat) {
      case 1: // Tête qui fonce comme elle peut
	switch (centipede[i].direction) {
	    case DIR_HAUT:
		centipede[i].boite.y -= centipede[i].vitesse * dt;
		if (centipede[i].boite.y <= centipede[i].debutVertical-TAILLE_BLOC) {
		    centipede[i].direction = (centipede[i].ancienneDir==DIR_GAUCHE)?DIR_DROITE:DIR_GAUCHE;
		    centipede[i].boite.y = centipede[i].debutVertical-TAILLE_BLOC;
		}
		break;
	    case DIR_BAS:
		centipede[i].boite.y += centipede[i].vitesse * dt;
		if (centipede[i].boite.y >= centipede[i].debutVertical+TAILLE_BLOC) {
		    centipede[i].direction = (centipede[i].ancienneDir==DIR_GAUCHE)?DIR_DROITE:DIR_GAUCHE;
		    //console.log("La tête va de " + centipede[i].ancienneDir + " et tourne à " + centipede[i].direction + ".");
		    centipede[i].boite.y = centipede[i].debutVertical+TAILLE_BLOC;
		    var seg = i+1;
		    while (seg < centipede.length && centipede[seg].etat == 2) {
			centipede[seg].checkpoints.push({nextDir: centipede[i].direction, px: centipede[i].boite.y});
			seg++;
		    }

		}
		break;
	    case DIR_GAUCHE:
		centipede[i].boite.x -= centipede[i].vitesse * dt;
		var goDown = centipede[i].boite.x < 0;
		if (!goDown) {
		    for(var ch =0 ; ch < champis.length ; ch++) {
			if (champis[ch].boite.x < centipede[i].boite.x && collision(centipede[i],champis[ch])) {
			    goDown = true;
			    break;
			}
		    }
		}
		if (goDown) {
		    centipede[i].debutVertical = centipede[i].boite.y;
		    centipede[i].ancienneDir = DIR_GAUCHE;
		    centipede[i].direction = DIR_BAS;
		    var seg = i+1;
		    while (seg < centipede.length && centipede[seg].etat == 2) {
			centipede[seg].checkpoints.push({nextDir: DIR_BAS, px: centipede[i].boite.x});
			seg++;
		    }
		}
		break;
	    case DIR_DROITE:
		centipede[i].boite.x += centipede[i].vitesse * dt;
		var goDown = centipede[i].boite.x >= 480 - TAILLE_BLOC;
		if (!goDown) {
		    for(var ch =0 ; ch < champis.length ; ch++) {
			if (champis[ch].boite.x > centipede[i].boite.x && collision(centipede[i],champis[ch])) {
			    goDown = true;
			    break;
			}
		    }
		}
		if (goDown) {
		    centipede[i].debutVertical = centipede[i].boite.y;
		    centipede[i].ancienneDir = DIR_DROITE;
		    centipede[i].direction = DIR_BAS;
		    var seg = i+1;
		    while (seg < centipede.length && centipede[seg].etat == 2) {
			centipede[seg].checkpoints.push({nextDir: DIR_BAS, px: centipede[i].boite.x});
			seg++;
		    }
		}
		break;
	}
	/*if (centipede[i].direction == DIR_HAUT || centipede[i].direction == DIR_BAS)
	  centipede[i].boite.y += (centipede[i].direction*2-1) * centipede[i].vitesse * dt;
	else
	  centipede[i].boite.x += ((centipede[i].direction-2)*2-1) * centipede[i].vitesse * dt;*/
	break;
      case 2: // Segment qui suit ses checkpoints
	/*if (centipede[i].direction == DIR_HAUT || centipede[i].direction == DIR_BAS) {
	  centipede[i].boite.y += (centipede[i].direction*2-1) * centipede[i].vitesse * dt;
	} else {
	  centipede[i].boite.x += ((centipede[i].direction-2)*2-1) * centipede[i].vitesse * dt;
	}*/
	switch (centipede[i].direction) {
	  case DIR_HAUT:
	    centipede[i].boite.y -= centipede[i].vitesse*dt;
	    if (centipede[i].checkpoints.length && centipede[i].boite.y <= centipede[i].checkpoints[0].px) {
	      //console.log("Checkpoint dans DIR_HAUT ! "+centipede[i].checkpoints[0].px+"px vers " +centipede[i].checkpoints[0].nextDir);
	      centipede[i].boite.y = centipede[i].checkpoints[0].px;
	      centipede[i].direction = centipede[i].checkpoints.shift().nextDir;
	    }
	    break;
	  case DIR_BAS:
	    centipede[i].boite.y += centipede[i].vitesse*dt;
	    if (centipede[i].checkpoints.length && centipede[i].boite.y >= centipede[i].checkpoints[0].px) {
	      //console.log("Checkpoint dans DIR_BAS ! "+centipede[i].checkpoints[0].px+"px vers " +centipede[i].checkpoints[0].nextDir);
	      centipede[i].boite.y = centipede[i].checkpoints[0].px;
	      centipede[i].direction = centipede[i].checkpoints.shift().nextDir;
	    }
	    break;
	  case DIR_GAUCHE:
	    centipede[i].boite.x -= centipede[i].vitesse*dt;
	    if (centipede[i].checkpoints.length && centipede[i].boite.x <= centipede[i].checkpoints[0].px) {
	      //console.log("Checkpoint dans DIR_GAUCHE ! "+centipede[i].checkpoints[0].px+"px vers " +centipede[i].checkpoints[0].nextDir);
	      centipede[i].boite.x = centipede[i].checkpoints[0].px;
	      centipede[i].direction = centipede[i].checkpoints.shift().nextDir;
	    }
	    break;
	  case DIR_DROITE:
	    centipede[i].boite.x += centipede[i].vitesse*dt;
	    if (centipede[i].checkpoints.length && centipede[i].boite.x >= centipede[i].checkpoints[0].px) {
	      //console.log("Checkpoint dans DIR_DROITE ! "+centipede[i].checkpoints[0].px+"px vers " +centipede[i].checkpoints[0].nextDir);
	      centipede[i].boite.x = centipede[i].checkpoints[0].px;
	      centipede[i].direction = centipede[i].checkpoints.shift().nextDir;
	    }
	    break;
	}
	break;
    }
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
function creerChampi() {
  var nouvChampiX, nouvChampiY, duplique;
  do {
    nouvChampiX = Math.floor(Math.random()*LARGEUR_GRILLE)*TAILLE_BLOC;
    nouvChampiY = TAILLE_BLOC + Math.floor(Math.random()*(HAUTEUR_GRILLE-1))*TAILLE_BLOC;
    duplique = false;
    for (var ch=0 ; ch<champis.length ; ch++) {
      duplique |= champis[ch].boite.x == nouvChampiX && champis[ch].boite.y == nouvChampiY;
    }
  } while (duplique);
  return {
    boite: {x: nouvChampiX, y: nouvChampiY, w: TAILLE_BLOC, h: TAILLE_BLOC},
    vie: 4,
    estVeneneux: false
  };
}
function centiChampi() {
	var nouvChampiX, nouvChampiY;

    nouvChampiX = Math.floor(Math.random()*LARGEUR_GRILLE)*TAILLE_BLOC;
    nouvChampiY = TAILLE_BLOC + Math.floor(Math.random()*(HAUTEUR_GRILLE-1))*TAILLE_BLOC;
	

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
		score = score + 1;
  } else {
    champis[index].boite.img = imgsChampis[niveau][champis[index].vie];
	
  }

}

function detruireSegment(index)
{
    if (index < centipede.length-1) {
	// On vérifie le segment d'après
	if (centipede[index+1].etat == 2) {
	    centipede[index+1].etat = 1;
	    centipede[index+1].boite.img = imgTeteCenti;
	    var seg = index+2;
	    if (centipede[index].etat == 2) {
	      while (seg < centipede.length && centipede[seg].etat == 2) {
		//console.log(centipede[index+1].checkpoints.length, " checkpoints supprimés pour le segment " + seg +" qui en avait " + centipede[seg].checkpoints.length + ".");
		for (var ch = 0 ; ch < centipede[index+1].checkpoints.length ; ch++) {
		  //console.log("SHIFTING");
		  centipede[seg].checkpoints.shift();
		}
		//console.log("Maintenant " + centipede[seg].checkpoints.length + ".");
		seg++;
	      }
	    }
	    centipede[index+1].checkpoints = null;
	    if (centipede[index+1].direction == DIR_BAS)
		centipede[index+1].debutVertical = centipede[index+1].boite.y-centipede[index+1].boite.y%TAILLE_BLOC;
	    else if (centipede[index+1].direction == DIR_HAUT)
		centipede[index+1].debutVertical = centipede[index+1].boite.y-centipede[index+1].boite.y%TAILLE_BLOC + TAILLE_BLOC;
	    else
		centipede[index+1].debutVertical = 0;
	    
	    centipede[index+1].ancienneDir = centipede[index].ancienneDir || centipede[index].direction;

	}
    }
    centipede[index].etat = 0;
}


function dessineBoite(obj) {
    //console.log(obj);
    //ctx.fillStyle = "#0f0";
    //ctx.fillRect(obj.boite.x, obj.boite.y, obj.boite.w, obj.boite.h);
	if (obj.boite != null) {
		if (obj.boite.img != null)
			ctx.drawImage(obj.boite.img, obj.boite.x, obj.boite.y, obj.boite.w, obj.boite.h);
		else if (obj.boite.col != null) {
			ctx.fillStyle = obj.boite.col;
			ctx.fillRect(obj.boite.x, obj.boite.y, obj.boite.w, obj.boite.h);
		}
	}
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
