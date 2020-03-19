(function() {
  const ZAVI_ID = '395275539444793344';

  const infectionData = infections.map( n => ({
    id: n.userID,
    label: n.user,
    shape: 'circle',
    color: n.infectedBy ? "#5df5a8" : "#fd264e",
    title: n.message,
    infectedBy: n.infectedByID
  }))

  const edgeData = infections
    .filter(n => n.infectedBy)
    .map( n => ({
      from: n.infectedByID,
      to: n.userID
    }))

    console.log(edgeData)
  // create an array with nodes
  var nodes = new vis.DataSet(infectionData);
  // create an array with edges
  var edges = new vis.DataSet(edgeData);

  // create a network
  var container = document.getElementById("topology");
  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {};
  var network = new vis.Network(container, data, options);

  let coloredNodes = []
  network.on("selectNode", node => {
    let chain = node.nodes[0]
    // let chain = nodes.get(node.nodes[0])
    while (chain) {
      const node = nodes.get(chain)
      if (node.id !== ZAVI_ID) {
        node.color = "#1e6da5"
        nodes.update(node)
        coloredNodes.push(node)
      }
      chain = node.infectedBy
    }

    // nodes.update(source)
    // console.log("NODE", source)
  })

  network.on("deselectNode", node => {
    for (var i = 0; i < coloredNodes.length; i++) {
      coloredNodes[i].color = '#5df5a8'
      nodes.update(coloredNodes[i])
    }
  })
})()