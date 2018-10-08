const pointTypes = {
    start: "X",
    unknown: "0",
    exit: "E"
}

export default function(grid, maxTunnels, maxLength) {
    let x = Math.floor(Math.random()*grid.width)
    let y = Math.floor(Math.random()*grid.height)
    let tunnels = maxTunnels
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    let lastDirection = []
    let randomDirection = null

    grid.set(x, y, pointTypes.start)

    let points = []
    points.push([x,y])

    while (tunnels) {
        // Get random direction
        do {
            randomDirection = directions[Math.floor(Math.random() * directions.length)];
        } while ((randomDirection[0] === -lastDirection[0] && randomDirection[1] === -lastDirection[1]) || (randomDirection[0] === lastDirection[0] && randomDirection[1] === lastDirection[1]));

        const randomLength = Math.ceil(Math.random() * maxLength) + 2
        let tunnelLength = 0
        console.log("direction: ", randomDirection, " length: ", randomLength)
        while (tunnelLength < randomLength) {
            if (((x === 0) && (randomDirection[0] === -1)) ||
                ((y === 0) && (randomDirection[1] === -1)) ||
                ((x === grid.width - 1) && (randomDirection[0] === 1)) ||
                ((y === grid.height - 1) && (randomDirection[1] === 1))) {
                break;
            }

            x += randomDirection[0]
            y += randomDirection[1]
            tunnelLength++
            if (grid.get(x,y) === null) {
                grid.set(x, y, pointTypes.unknown)
                points.push([x,y])
            }
        }

        lastDirection = randomDirection
        tunnels--
    }

    let exit = Math.floor(Math.random()*points.length)
    let [ex, ey] = points[exit]
    grid.set(ex, ey, pointTypes.exit)

    return grid
}