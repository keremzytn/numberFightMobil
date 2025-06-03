class NumberFightGame {
    constructor() {
        this.round = 1;
        this.maxRounds = 7;
        this.players = [
            { hand: [1, 2, 3, 4, 5, 6, 7], used: [], lastCard: null, skipRule: false },
            { hand: [1, 2, 3, 4, 5, 6, 7], used: [], lastCard: null, skipRule: false }
        ];
        this.history = [];
    }

    canPlay(playerIndex, card) {
        const player = this.players[playerIndex];
        // Kart daha önce kullanılmış mı?
        if (player.used.includes(card)) return false;
        // Kural atlanacak mı?
        if (player.skipRule) return true;
        // Bir önceki kartın bir eksiği/fazlası kontrolü
        if (player.lastCard !== null) {
            if (card === player.lastCard - 1 || card === player.lastCard + 1) {
                return false;
            }
        }
        return true;
    }

    playCard(playerIndex, card) {
        if (!this.canPlay(playerIndex, card)) {
            throw new Error('Bu kartı oynayamazsın!');
        }
        const player = this.players[playerIndex];
        player.hand = player.hand.filter(c => c !== card);
        player.used.push(card);
        player.lastCard = card;
        this.history.push({ round: this.round, player: playerIndex, card });
        // 5. round özel kuralı
        if (this.round === 5 && player.hand.length === 3) {
            // Ortadaki kart oynandıysa (yani kalan 3 karttan ortadaki)
            const sorted = [...player.hand].sort((a, b) => a - b);
            if (card === sorted[1]) {
                player.skipRule = true; // 6. roundda kural atlanacak
            }
        }
        // 6. roundda kuralı sıfırla
        if (this.round === 6) {
            player.skipRule = false;
        }
    }

    nextRound() {
        this.round++;
    }
}

module.exports = NumberFightGame; 