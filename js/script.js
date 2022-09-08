import Deck, { Card } from './deck.js';

const CARD_VALUES = {
	A: [1, 11],
	2: [2],
	3: [3],
	4: [4],
	5: [5],
	6: [6],
	7: [7],
	8: [8],
	9: [9],
	10: [10],
	J: [10],
	Q: [10],
	K: [10],
};

const GAME_HTML = `<div class="game">
						<div class="_container">
							<div class="game__inner">
								<div class="game__title">
									<h1>Black Jack</h1>
								</div>

								<div class="game__area">
									<div class="game__cols">
										<!-- Dealer -->
										<div class="game__col playerCol-1"></div>

										<!-- Central game area -->
										<div class="game__col game__col--center">
											<div class="userMessage fn-msg">
												<div>Player goes first</div>
											</div>
											<div class="playAgain">
												<button class="btn fn-restart" style="display: none">Play again</button>
											</div>
										</div>

										<!-- Player -->
										<div class="game__col playerCol-2"></div>
									</div>
								</div>

								<div class="game__msg">
									<div class="gameMsg">
										<div class="gameMsg__title">Game info</div>
										<div class="gameMsg__content">
											<ul>
												<li>Normal Black Jack rules with no betting</li>
												<li>Cannot split cards</li>
												<li>The Dealer wins in the event of a tie</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>`;
const MAX_NUM = 21;

class BlackJack {
	constructor(gameClass = 'game', playerNames = [], deck = new Deck()) {
		this.restart(gameClass, playerNames, deck);
	}

	restart(gameClass, playerNames, deck) {
		const SELF = this;
		SELF.gameClass = gameClass;
		SELF.deck = deck;
		SELF.players = [new Player('Dealer')];

		// Create and add players to game
		playerNames.forEach((playerName) => {
			SELF.players.push(new Player(playerName));
		});

		// Add game to DOM
		$('#root').html('');
		$('#root').append(GAME_HTML);
		$(`.game__col:not(:nth-child(2))`, `.${SELF.gameClass}`).html('');

		// Deal cards
		SELF.deal();

		// Hit
		$('.fn-hit', `.${SELF.gameClass}`).click(function () {
			const parent = $(this).closest('.player');
			const playerId = parent.data('id');

			SELF.hit(playerId);
		});

		// Stand
		$('.fn-stand', `.${SELF.gameClass}`).click(function () {
			const parent = $(this).closest('.player');
			const playerId = parent.data('id');

			SELF.stand(playerId);
		});

		// Restart
		$('.fn-restart', `.${SELF.gameClass}`).click(function () {
			SELF.restart('game', playerNames, deck);
			$(this).hide();
		});
	}

	deal() {
		// Give all players 2 cards
		this.players.map((player, i) => {
			for (let i = 0; i < 2; i++) {
				const card = this.deck.removeCard();
				player.addCard(card);
			}

			// Create player div
			let gameColumnClass = 'playerCol-1';
			if ((i + 1) % 2 === 0) {
				gameColumnClass = 'playerCol-2';
			}

			// Add player HTML
			$(`.${gameColumnClass}`, `.${this.gameClass}`).append(player.getHtml());

			// Force reload on player
			player.playerStateChange();
		});

		if (this.playersFinished()) {
			this.playDealer();
		}
	}

	hit(playerId) {
		const player = this.getPlayer(playerId);

		if (player.state === 'PLAYING') {
			// Add card to player
			player.addCard(this.deck.removeCard());
			player.updatePlayerArea();
		} else {
			console.log('Error: player is not playing, so cannot HIT!');
		}

		if (player.name !== 'Dealer' && this.playersFinished()) {
			this.playDealer();
		}
	}

	stand(playerId) {
		const player = this.getPlayer(playerId);
		player.playerStateChange('STAND');
		player.updatePlayerArea();

		if (player.name !== 'Dealer' && this.playersFinished()) {
			this.playDealer();
		}
	}

	/* Get player object from players by player ID */
	getPlayer(playerId) {
		return this.players.find((player) => player.id === playerId);
	}

	/* All players finished playing? */
	playersFinished() {
		const playersCopy = [...this.players];
		playersCopy.shift(); //remove first
		return playersCopy.every((player) => player.state !== 'PLAYING');
	}

	/* All players BUST? */
	playersBust() {
		const playersCopy = [...this.players];
		playersCopy.shift(); //remove first
		return playersCopy.every((player) => player.state === 'BUST');
	}

	getWinningPlayer(players) {
		if (!players) return;

		let maxValue = 0,
			winningPlayer = null;

		players.forEach((player) => {
			const playerMax = Math.max(...player.total);
			if (playerMax > maxValue && playerMax <= MAX_NUM) {
				winningPlayer = player;
				maxValue = playerMax;
			}
		});

		return winningPlayer;
	}

	/* 
	Dealer plays automatically
		HIT until over 16 and STAND
		HIT until more than Player's hand or BUST */
	playDealer() {
		const dealer = this.players[0];
		const playersCopy = [...this.players];
		playersCopy.shift(); //remove Dealer

		// Max value from all players except dealer
		const currWinningPlayer = this.getWinningPlayer(playersCopy);

		if (!currWinningPlayer || this.playersBust()) {
			// Dealer stands if other players BUST
			this.stand(dealer.id);
		} else {
			// Dealer plays
			const maxFromPlayers = Math.max(...currWinningPlayer.total);

			while (dealer.total <= maxFromPlayers) {
				// Add card to dealer
				this.hit(dealer.id);
			}
		}

		this.gameOver();
	}

	/* Game over so update game message and show 'Play again' button */
	gameOver() {
		const winner = this.getWinningPlayer(this.players);
		const msg = `${winner.name} has won with ${Math.max(...winner.total)}!`;

		$('.fn-msg', `.${this.gameClass}`).html(`<div class="green">${msg}</div>`);
		$('.fn-restart', `.${this.gameClass}`).show();
	}
}

let player_count = 0;
class Player {
	constructor(name) {
		this.reset(name);
	}

	reset(name) {
		this.id = player_count++;
		this.name = name;
		this.cards = [];
		this._total = [0];
		this._state = 'PLAYING';
	}

	setTotal(newValue) {
		this._total = [...newValue];
	}

	setState(newState) {
		const playerStates = ['PLAYING', 'STAND', 'BUST'];
		if (playerStates.includes(newState)) {
			this._state = newState;

			$(`.player[data-id="${this.id}"]`).attr(
				'data-state',
				this.state.toLowerCase()
			);
		} else {
			console.log(`Error: state '${this.state}' not valid`);
		}
	}

	get state() {
		return this._state;
	}

	get total() {
		return this._total;
	}

	getPlayerInfoHtml() {
		let playerMessage = '';

		switch (this.state) {
			case 'PLAYING':
				playerMessage = `${this.name} has ${this._total.join(' or ')}`;
				break;
			case 'STAND':
				const finalTotals = [...this._total];
				let maxTotal = -1;

				while (finalTotals.length) {
					maxTotal = Math.max(...finalTotals);
					if (maxTotal > MAX_NUM) {
						finalTotals.splice(finalTotals.indexOf(maxTotal), 1);
					} else break;
				}

				playerMessage = `${this.name} standing on ${maxTotal}`;
				break;
			case 'BUST':
				playerMessage = `${this.name} has ${Math.min(...this._total)}. ${
					this.name
				} is bust!`;
				break;
			default:
				break;
		}

		return `<div class="player__info">${playerMessage}</div>`;
	}

	// First 2 cards
	getPrimaryCardsHtml() {
		let primaryCardsHtml = '';
		if (this.cards && this.cards.length >= 2) {
			for (let i = 0; i < 2; i++) {
				primaryCardsHtml += this.cards[i].getHtml();
			}
		}
		return primaryCardsHtml;
	}

	// Cards from HIT
	getExtraCardsHtml() {
		let extraCardsHtml = '';
		if (this.cards && this.cards.length > 2) {
			for (let i = 2; i < this.cards.length; i++) {
				extraCardsHtml += this.cards[i].getHtml('small');
			}
		}
		return extraCardsHtml;
	}

	getHtml() {
		// Player buttons
		let playerButtons = '';
		if (this.name !== 'Dealer') {
			playerButtons = `<div class="player__btns">
									<div class="player__btns__btn">
										<button class="player__hit btn btn--full fn-hit">
											Hit
										</button>
									</div>
									<div class="player__btns__btn">
										<button
											class="player__stand btn btn--full btn--red fn-stand"
										>
											Stand
										</button>
									</div>
								</div>`;
		}

		let playerHtml = `<div class="player" data-id="${
			this.id
		}" data-state="playing">
								<div class="player__name">${this.name}</div>
								${this.getPlayerAreaHtml()}
								${playerButtons}
							</div>`;

		return playerHtml;
	}

	getPlayerAreaHtml() {
		return `<div class="player__area">
					<div class="player__cards">${this.getPrimaryCardsHtml()}</div>
					<div class="player__extras">${this.getExtraCardsHtml()}</div>
					${this.getPlayerInfoHtml()}
				</div>`;
	}

	/* Update player area in DOM */
	updatePlayerArea() {
		const playerEl = $(`.player[data-id="${this.id}"]`);

		// Update player Area HTML
		$('.player__area', playerEl).replaceWith(this.getPlayerAreaHtml());
	}

	/* Update object's state and total */
	playerStateChange(newState = null) {
		const currTotal = this._total;

		if (newState) {
			this.setState(newState);
		} else if (currTotal.every((value) => value > MAX_NUM)) {
			// BUST
			this.setState('BUST');
		} else if (currTotal.some((value) => value === MAX_NUM)) {
			// STAND
			this.setState('STAND');
		} else {
			// PLAYING
			const newTotal = currTotal.filter((value) => value <= MAX_NUM); //remove values more than MAX_NUM

			this.setState('PLAYING');
			this.setTotal(newTotal);
		}
	}

	addCard(card) {
		if (this.state !== 'PLAYING') {
			console.log('Error: Player->addCard - player is not currently playing');
			console.log(`Player state: ${this.state}`);
			return false;
		}

		// Add card to players hand
		this.cards.push(card);

		// Update player total
		const cardValues = CARD_VALUES[card.value];
		const newTotal = [];

		this._total.forEach((playerValue) => {
			cardValues.forEach((cardValue) => {
				const tmpTotal = parseInt(playerValue) + parseInt(cardValue);
				if (!newTotal.includes(tmpTotal)) {
					newTotal.push(tmpTotal);
				}
			});
		});
		this.setTotal(newTotal);

		this.playerStateChange();

		return true;
	}
}

$(function () {
	/*--- Game setup ---*/

	// Deck
	const deck = new Deck();
	deck.shuffle();

	// Players
	const playerNames = ['Player'];

	// Create game
	const blackJack = new BlackJack('game', playerNames, deck);
});
