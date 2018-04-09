let _timeout = null;
export default {

    start(fn, ms) {
        if (_timeout !== null) {
            this.clear();
        }

        _timeout = setTimeout(fn, ms);
    },

    clear() {
        clearTimeout(_timeout);
        _timeout = null;
    }

}