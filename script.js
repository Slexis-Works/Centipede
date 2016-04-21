// Constantes utiles au programme:
var HAUTEUR_JOUEUR = 32, LARGEUR_JOUEUR = 32;
var CHAMPIS_MIN = 30, CHAMPIS_MAX = 34;
var HAUTEUR_CHAMPI = 32, LARGEUR_CHAMPI = 32;

var HAUTEUR_GRILLE = 15, LARGEUR_GRILLE = 15;

var HAUT_ZONE_JOUEUR = (HAUTEUR_GRILLE-5)*HAUTEUR_CHAMPI;

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
var nbChampis, champis = [];
var centipede = [];
var tir;
var centipede = [];
var araignee, puce, scorpion;

var niveau;
var score;

/////////////////////
// Initialisation //
///////////////////

initLancement = function() {
    // lancement de la boucle de jeu
    lastTime = Date.now();
    boucleDeJeu();

}

initChampignons = function() {
    //console.log("Initialisation des champignons…");
    var champisImg = new Image();
    champisImg.onload = function () {
        nbChampis = Math.floor(Math.random()*(CHAMPIS_MAX-CHAMPIS_MIN+1) + CHAMPIS_MIN);
        //console.log(nbChampis);

        for (var i=0 ; i<nbChampis ; i++) {
          champis[i] = creerChampi(champis);
          champis[i].boite.img = champisImg;
        }
        //console.log("Champignons initialisés !");
        initLancement();
    }
    champisImg.src = "imgs/Champignon.png";
}
initTir = function()
{
	//console.log("Initialisation du tir...")
	tir = 
	{
		boite: {x: 0, y:0, w:2, h:5},
		actif: false,
		vitesse: 0.1,
		
	};
}
initJoueur = function() {
    //console.log("Initialisation du joueur…");
    var playerImg = new Image();
    playerImg.onload = function() {
        joueur = {
          boite: {x: (cnv.width-LARGEUR_JOUEUR)/2, y: cnv.height-HAUTEUR_JOUEUR, w: LARGEUR_JOUEUR, h: HAUTEUR_JOUEUR, img: playerImg},
          vies: 2,
          vitesse: 0.1
        };
        //console.log("Joueur initialisé !");
        initChampignons();
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
}





/**
 *  Fonction réalisant le rendu de l'état du jeu
 */
render = function() {
    // effacement de l'écran
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.fillStyle="#002";
    ctx.fillRect(0, 0, cnv.width, cnv.height);

    dessineBoite(joueur);
    for (var i=0 ; i<champis.length ; i++)
        dessineBoite(champis[i]);
	dessineBoite(tir);
}

/////////////////////
// Sous-fonctions //
///////////////////

function deplacementPersonnage()
{
	if (appuiDroite && joueur.boite.x+joueur.boite.w < cnv.width) {
        joueur.boite.x += joueur.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
			if (collisionTolerante(joueur,champis[i], 10))
			{
				joueur.boite.x -= joueur.vitesse*dt;
				break;
			}
				
	}
	
	if(appuiGauche && joueur.boite.x> 0) {
		joueur.boite.x -=joueur.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
			if (collisionTolerante(joueur,champis[i], 10))
			{
				joueur.boite.x += joueur.vitesse*dt;
				break;				
			}
	}

	if(appuiHaut && joueur.boite.y+joueur.boite.h > HAUT_ZONE_JOUEUR) {
		joueur.boite.y -= joueur.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
			if (collisionTolerante(joueur,champis[i], 10))
			{
				joueur.boite.y += joueur.vitesse*dt;
				break;
			}
				
	}

	if(appuiBas && joueur.boite.y+joueur.boite.h < cnv.height) {
		joueur.boite.y += joueur.vitesse*dt;
		for(var i =0 ; i < champis.length;i++)
			if (collisionTolerante(joueur,champis[i], 10))
			{
				joueur.boite.y -= joueur.vitesse*dt;
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
    nouvChampiX = Math.floor(Math.random()*LARGEUR_GRILLE)*LARGEUR_CHAMPI;
    nouvChampiY = Math.floor(Math.random()*HAUTEUR_GRILLE-1)*HAUTEUR_CHAMPI;
    duplique = false;
    for (var ch=0 ; ch<champis.length ; ch++) {
      duplique |= champis[ch].boite.x == nouvChampiX && champis[ch].boite.y == nouvChampiY;
    }
  } while (duplique);
  return {
    boite: {x: nouvChampiX, y: nouvChampiY, w: LARGEUR_CHAMPI, h: HAUTEUR_CHAMPI},
    vie: 4,
    estVeneneux: false
  };
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

function dessineBoite(obj) {
    //console.log(obj);
    //ctx.fillStyle = "#0f0";
    //ctx.fillRect(obj.boite.x, obj.boite.y, obj.boite.w, obj.boite.h);
	if (obj.boite != null) {
		if (obj.boite.img != null)
			ctx.drawImage(obj.boite.img, obj.boite.x, obj.boite.y);
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
