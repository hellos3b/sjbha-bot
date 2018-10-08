export default class {

    constructor(width, height) {
        this.width = width
        this.height = height
        this.grid = this.createGrid(width, height)
    }

    createGrid(width, height) {
        let res = []
        for (var i = 0; i < height; i++) {
            res.push([])
            for (var j = 0; j < width; j++) {
                res[i].push(null)
            }
        }
        return res
    }

    get(x, y) {
        return this.grid[y][x]
    }

    set(x, y, val) {
        this.grid[y][x] = val
    }

    toString() {
        let res = ""
        for (var y = 0; y < this.grid.length; y++) {
            let row = this.grid[y]
            for (var x = 0; x < row.length; x++) {
                let val = (row[x] === null) ? ' ' : row[x]
                res += val + ' '
            }
            res += '\n'
        }
        return res
    }
}