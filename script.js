// Variables (globales) du programme

var cnv = null, ctx = null;

// Touches clavier
var toucheHaut = false, toucheBas = false,
    toucheGauche = false, toucheDroite = false;
var toucheZ = false, toucheS = false,
    toucheQ = false, toucheD = false;
var appuiHaut = false, appuiBas = false,
    appuiGauche = false, appuiDroite = false;
var appuiTir = false;

init = function() {
    // instanciation de la variable globale contenant le contexte
    cnv = document.getElementById("cnv");
    ctx = cnv.getContext("2d");

    // 2 écouteurs pour le clavier (appui/relâchement d'une touche)
    document.addEventListener("keydown", captureAppuiToucheClavier)
    document.addEventListener("keyup", captureRelacheToucheClavier)
    // on associe au document un écouteur d'événements souris
    //document.addEventListener("click", captureClicSouris)

    // lancement de la boucle de jeu
    boucleDeJeu();
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

}


/**
 *  Fonction réalisant le rendu de l'état du jeu
 */
render = function() {
    // effacement de l'écran
    ctx.clearRect(0, 0, cnv.width, cnv.height);
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
        break;
      case 40:
        toucheBas = true;
        break;
      case 37:
        toucheGauche = true;
        break;
      case 39:
        toucheDroite = true;
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
