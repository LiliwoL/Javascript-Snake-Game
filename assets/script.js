/*
	Fonction qui sera exécutée au chargement de la page
 */
window.onload = function()
{
	// Variables globales
	let canvasWidth 		= 900;
	let canvasHeight 		= 600;
	let blockSize 			= 30;
	let canvas, ctx;
	let delay 				= 300; 					// Delai en millisecondes
	let snake;
	let apple;
	let score 				= 0;


	// Définition de la largeur en terme de block et non en pixel
	let widthInBlock 		= canvasWidth / blockSize;
	let heightInBlock 		= canvasHeight / blockSize;

	// ====================================================================================================
	/**
	 * Définition d'une classe Serpent
	 * https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Classes
	 *
	 * Le constructeur attend les paramètres :
	 * @param body
	 * @param direction
	 * @constructor
	 */
	class Snake
	{
		// Attributs
		body;
		direction;
		ateApple;


		// Constructeur
		constructor(body, direction)
		{
			this.body 				= body;
			this.direction 			= direction
			this.ateApple 			= false;		// Au cas où le serpent viet de manger une pomme
		}

		/**
		 * Méthode pour dessiner le serpent
		 */
		draw()
		{
			// Sauvegarde du contexte
			ctx.save();

			// Couleur de remplissage
			ctx.fillStyle = "#ff0000";

			// Boucle
			// Le corps du serpent sera un ensemble de petits rectangles
			for (let i=0; i < this.body.length; i++)
			{
				drawBlock(ctx, this.body[i]);
			}
			ctx.restore();
		}


		/**
		 * Méthode pour faire avancer le serpent
		 */
		move()
		{
			// Récupération de la position de la tête du serpent
			var nextHeadPosition = this.body[0].slice();

			// Quelle direction?
			switch (this.direction)
			{
				case "left":
					// Avancement de -1 de la tête sur l'axe X
					nextHeadPosition[0] -= 1;
					break;
				case "right":
					// Avancement de 1 de la tête sur l'axe X
					nextHeadPosition[0] += 1;
					break;
				case "up":
					// Avancement de -1 de la tête sur l'axe Y
					nextHeadPosition[1] -= 1;
					break;
				case "down":
					// Avancement de 1 de la tête sur l'axe Y
					nextHeadPosition[1] += 1;
					break;
				default:
					throw("Invalid direction");
			}

			// On ajoute cette nouvelle position au corps du serpent
			// unshift ajoute en première case
			this.body.unshift( nextHeadPosition );

			// Retrait de la queue du serpent UNIQUEMENT si une pomme n'a pas été mangée
			if (!this.ateApple)
			{
				this.body.pop();
			}else{
				console.log("Allongement du serpent");
				// Réinitialisation
				this.ateApple = false;
			}
		}


		/**
		 * Méthode pour changer la direction
		 *
		 * @param newDirection
		 */
		setDirection( newDirection )
		{
			let allowedDirections;
			// Quelles directions sont permises ?
			switch (this.direction)
			{
				case "left":
				case "right":
					allowedDirections = ["up", "down"];
					break;
				case "up":
				case "down":
					allowedDirections = ["left", "right"];
					break;
				default:
					throw("Invalid direction");
			}

			// Avant de changer la direction, on regarde le contenu du tableau allowedDirections avec la fonction indexOf
			if (allowedDirections.indexOf( newDirection ) > -1)
			{
				this.direction = newDirection;
			}
		}


		/**
		 * Méthode pour vérifier les collisions
		 *
		 * @returns {boolean}
		 */
		checkCollision()
		{
			// Collision sur un mur
			let wallCollision = false;

			// collision sur lui-même
			let selfCollision = false;

			// On a besoin de tester uniquement la tête, c'est la tête qui entre en collision!
			let headSnake = this.body[0]; // headSnake est donc un tableau de coordonnées
			let bodySnake = this.body.slice(1); // On coupe à partir de la case 1

			// en ES6, on aurait pu écrire ça avec le destructuring en:
			//let [headSnake, ...bodySnake] = this.body;

			// Test de la collision avec un mur
			if (
				// Mur de droite
				headSnake[0] >= widthInBlock ||
				// Mur de gauche
				headSnake[0] < 0 ||
				// Mur du haut
				headSnake[1] < 0 ||
				// Mur du bas
				headSnake[1] >= heightInBlock
			)
			{
				console.log("Game Over (Wall)");
				wallCollision = true;

				// Fonction gameOver
				gameOver();
			}

			// Test de la collision avec son propre corps
			for ( let i=0; i < bodySnake.length; i++ )
			{
				if (
					headSnake[0] === bodySnake[i][0] &&
					headSnake[1] === bodySnake[i][1]
				)
				{
					selfCollision = true;
				}
			}

			return wallCollision || selfCollision;
		}


		/**
		 * Méthode pour détecter si le serpent vient de manger une pomme
		 *
		 * @param apple
		 * @returns {boolean}
		 */
		isEatingApple( apple )
		{
			// Récupération de la tête du serpent
			let headSnake = this.body[0];

			// Test de correspondance des coordonnées de la pomme et de la tête
			if ( headSnake[0] === apple.position[0] // Coordonnées X
				&&
				headSnake[1] === apple.position[1] // Coordonnées Y
			){
				// On définit cette propriété à true pour indiquer que le serpent vient de manger une pomme
				this.ateApple = true;
				return true;
			}else{
				return false;
			}
		}
	}


	/**
	 * Définition d'une classe Pomme
	 * https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Classes
	 *
	 * Le constructeur attend le paramètre position:
	 * 		La position doit etre le milieu d'un bloc!
	 * @param position
	 * @constructor
	 */
	class Apple
	{
		// Attributs
		position;

		// Constructeur
		constructor(position)
		{
			this.position = position;
		}

		/**
		 * Méthode pour dessiner la pomme
		 */
		draw()
		{
			// Sauvegarde du contexte
			ctx.save();

			// Couleur de remplissage
			ctx.fillStyle = "#33cc33";

			ctx.beginPath();
			// Le rayon correspond à la moitié d'un bloc
			let radius = blockSize / 2;

			// La position doit etre le milieu d'un bloc!
			let x = this.position[0] * blockSize + radius;
			let y = this.position[1] * blockSize + radius;

			// Fonction qui va dessiner le cercle
			ctx.arc(x, y, radius, 0, Math.PI *2, true);

			ctx.fill();

			ctx.restore();
		}



		/**
		 * Méthode pour déplacer la pomme
		 */
		setNewPosition()
		{
			// Nombre ENTIER au hasard entre 0 et widthInBlock -1, soit 29
			let newX = Math.round(Math.random() * (widthInBlock -1));
			let newY = Math.round(Math.random() * (heightInBlock -1));

			// Modification de la position de la pomme
			this.position = [newX, newY];
		}


		/**
		 * Méthode pour vérifier que la pomme n'a pas été placée sur le corps du serpent
		 * @param snake
		 * @returns {boolean}
		 */
		isOnSnake( snake )
		{
			// Par défaut, à non
			let isOnSnake = false;

			// Parcours du corps du serpent
			for (let i=0; i<snake.body.length; i++) // En ES6 on pourrait passer à for.. of
			{
				// Test des positions
				if (
					this.position[0] === snake.body[i][0] // Test du X
					&&
					this.position[1] === snake.body[i][1] // Test du Y
				)
				{
					isOnSnake = true;
				}
			}

			return isOnSnake;
		}
	}
	// ====================================================================================================

	// Appel de la fonction init
	init();


	// Initialisation du canvas et des objets
	function init()
	{
		// Création du canvas
		canvas = document.createElement('canvas');

		// Dimensions
		canvas.width 				= canvasWidth;
		canvas.height 				= canvasHeight;
		// Style encadré
		canvas.style.border 		= "1px solid";

		// Ajout du canvas au body
		document.body.appendChild(canvas);

		// ******** Dessiner dans le canvas

		// Récupération du contexte
		ctx	 						= canvas.getContext('2d');

		// Construction du serpent avec son body, et maintenant sa direction
		createSnakeAndApple();

		// Appel de la fonction de refresh
		refreshCanvas();
	}


	// Création du serpent et d'une pomme
	function createSnakeAndApple()
	{
		// Construction du serpent avec son body, et maintenant sa direction
		snake = new Snake([ [9, 3], [8, 3], [7, 3], [6, 3],	[5, 3], [4, 3], [4,3], [4,3], [1,3] ], "right");

		apple = new Apple([10,10]);
	}

	// Refresh du canvas
	function refreshCanvas()
	{
		// Avancement du serpent
		snake.move();

		// On vérifie la collision
		if ( snake.checkCollision() )
		{
			// Game over
			console.log("gameover");
			gameOver();

		}else{
			// Pomme mangée?
			if ( snake.isEatingApple(apple) ){
				// La pomme est mangée!
				console.log("Pomme mangée");

				// Augmentation du score
				score++;

				// On replace la pomme si elle est par hasard sur le corps du serpent
				do{
					// Déplacement de la pomme
					apple.setNewPosition();
				}
				while( apple.isOnSnake(snake) );

				// En fonction du score, on accélère tous les 5 points
				if(score % 5 === 0){
                    speedUp();
                }
			}

			// Nettoyage du canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Dessin du serpent
			snake.draw();

			// Dessin de la pomme
			apple.draw();

			// Affichage du score
			drawScore();

			// ******* Mise en place d'un timer
			setTimeout(refreshCanvas, delay);
		}
	}

	function drawBlock (ctx, position)
	{
		// Détermination en pixels de la position
		var x = position[0] * blockSize;
		var y = position[1] * blockSize;

		// Remplissage du block avec les coordonnées calculées
		ctx.fillRect(x, y, blockSize, blockSize);
	}

	// Fonction d'affichage de fin de jeu
	function gameOver()
	{
		ctx.save();

        ctx.font = "bold 70px sans-serif";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 5;

        ctx.strokeText("Game Over", canvasWidth /2, canvasHeight /2 - 180);
        ctx.fillText("Game Over", canvasWidth /2, canvasHeight /2 - 180);

        ctx.font = "bold 30px sans-serif";
        ctx.strokeText("Appuyer sur la touche Espace pour rejouer", canvasWidth /2, canvasHeight /2 - 120);
        ctx.fillText("Appuyer sur la touche Espace pour rejouer", canvasWidth /2, canvasHeight /2 - 120);

        ctx.restore();
	}

	// Fonction relance le jeu appelée quand on appuie sur espace
	function resetGame()
	{
		// Recrée les objets serpent et pomme
		createSnakeAndApple();

		// Appel de la fonction de refresh
		refreshCanvas();
	}

	// Fonction d'affichage du score
	function drawScore () {
        ctx.save();
        ctx.font = "bold 200px sans-serif";
        ctx.fillStyle = "gray";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(score.toString(), canvasWidth /2, canvasHeight /2);
        ctx.restore();
    }

	// Fonction d'accélération du délai
	function speedUp() {
        delay /= 2;
    }

	// ====================================================================================================
	// ********** Gestion des événements clavier
	// ====================================================================================================

	// Touche pressée (n'importe laquelle)
	document.addEventListener('keydown', handleKeydown);
	function handleKeydown( ev )
	{
		let key = ev.keyCode;

		//console.log(key);

		let newDirection;
		// https://keyevents.netlify.app/
		switch (key)
		{
			case 37:
				newDirection = "left";
				break;
			case 38:
				newDirection = "up";
				break;
			case 39:
				newDirection = "right";
				break;
			case 40:
				newDirection = "down";
				break;
			case 32:
				resetGame();
				break;
			default:
				throw("Invalid code");
		}

		// On applique le mouvement au serpent
		snake.setDirection(newDirection);
	}
}