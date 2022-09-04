export default function() {
    let trigger = -1;
    let current = 0;
    let exploded = false;

    this.reset = function() {
        exploded = false;
        current = 0;
        trigger = Math.floor(Math.random()*6);
    }

    this.click = function() {
        if (current === trigger) {
            exploded = true;
            return true;
        } else {
            current++;
            return false;
        }
    }

    this.isExploded = function() {
        return exploded;
    }

    this.clickCount = function() {
        return current;
    }
}