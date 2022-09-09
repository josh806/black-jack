const SUITS = ['♠', '♣', '♥', '♦'];
const VALUES = [
	'A',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'10',
	'J',
	'Q',
	'K',
];

export default class Deck {
	constructor(cards = newDeck()) {
		this.cards = cards;
	}

	get allCards() {
		return this.cards;
	}

	get numberOfCards() {
		return this.cards.length;
	}

	shuffle() {
		this.cards = shuffle([...this.allCards]);
	}

	removeCard() {
		if (this.numberOfCards > 0) {
			return this.cards.pop();
		} else {
			console.log('Error: No cards in Deck');
			return null;
		}
	}

	addCard(card) {
		this.cards.push(card);
	}
}

export class Card {
	constructor(suit, value) {
		this.suit = suit;
		this.value = value;
	}

	getHtml(version = '') {
		let extra_class = '';
		if (this.suit === '♥' || this.suit === '♦') {
			extra_class = ' red';
		}

		if (version) {
			extra_class += ` card--${version}`;
		}

		return `<div class="card${extra_class}">
					<div class="card__inner">
						<div class="card__top">
							${this.value} <span class="suit">${this.suit}</span>
						</div>
						<div class="card__center">
							<span class="suit">${this.suit}</span>
						</div>
						<div class="card__bot">
						${this.value} <span class="suit">${this.suit}</span>
						</div>
					</div>
				</div>`;
	}
}

function newDeck() {
	return SUITS.flatMap((suit) => {
		return VALUES.map((value) => {
			return new Card(suit, value);
		});
	});
}

function shuffle(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1)); //only check unshuffled cards
		const tmp = arr[i];
		arr[i] = arr[j];
		arr[j] = tmp;
	}

	return arr;
}
