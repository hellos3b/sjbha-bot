import Game from "./Game"

let _game = null;

export default {

    get Game() {
        return _game
    },

    get exists() {
        return _game !== null;
    },

    get active() {
        if (_game === null) {
            return false;
        }

        return _game.isActive();
    },

    Start(userID, buyin) {
        if (!_game) {
            _game = new Game(userID, buyin);
        }
    },

    End() {
        _game = null;
    }
    
}