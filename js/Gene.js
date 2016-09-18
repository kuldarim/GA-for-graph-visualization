(function () {
  'use strict';

  angular.module('app').factory('Gene', Gene);

  function Gene(Util) {

    // Variables declaration

    var Gene = function (nodes, edges) {
      if (nodes) this.nodes = nodes;
      if (edges) this.edges = edges;
      this.cost = -99999999999999999999;
    };

    Gene.prototype.random = random;
    Gene.prototype.generateRandomFromItself = generateRandomFromItself;
    Gene.prototype.mutateSingleCoordinate = mutateSingleCoordinate;
    Gene.prototype.mutateSingleCoordinateInSector = mutateSingleCoordinateInSector;
    Gene.prototype.mutateAllCoordinatesInSector = mutateAllCoordinatesInSector;
    Gene.prototype.fitnessForDistance = fitnessForDistance;
    Gene.prototype.fitnessForSectors = fitnessForSectors;
    Gene.prototype.fitnessForEdgesIntersection = fitnessForEdgesIntersection;
    Gene.prototype.fitnessForClosestDistance = fitnessForClosestDistance;
    Gene.prototype.fitnessForConnectedNodes = fitnessForConnectedNodes;

    return Gene;

    function random(geneSize) {
      this.nodes = [];
      for (var i = 0; i < geneSize; i++) {
        var node = {};
        node.id = i;
        node.label = String(i);
        node.x = Util.getRandomCoordinate("RANDOM");
        node.y = Util.getRandomCoordinate("RANDOM");
        this.nodes.push(node);
      }

      this.edges = [];

      for (var i = 0; i < geneSize; i++) {
        var edge = {};
        var from = undefined;
        var to = undefined;
        while ((from == to) && !this.edges.some(function (element) {
          return element.from == from && element.to == to || element.to == from && element.from == to;
        })) {
          from = Util.getRandomNumber(geneSize);
          to = Util.getRandomNumber(geneSize);
        }
        edge.from = from;
        edge.to = to;
        this.edges.push(edge);
      }
    }

    function generateRandomFromItself() {
      var nodes = [];
      for (var i = 0; i < this.nodes.length; i++) {
        var node = {};
        node.id = i;
        node.label = String(i);
        node.x = Util.getRandomCoordinate("RANDOM");
        node.y = Util.getRandomCoordinate("RANDOM");
        nodes.push(node);
      }

      var edges = this.edges;

      return new Gene(nodes, edges);
    }

    function mutateSingleCoordinate(chance) {
      //checks if this gene should be mutated or not
      if (Math.random() > chance) return;

      //which of the node should be mutated
      var index = Math.floor(Math.random() * this.nodes.length);

      //change x coordinate to random coordinate
      this.nodes[index].x = Util.getRandomCoordinate("MUTATE", this.nodes[index].x);
      //change y coordinate to random coordinate
      this.nodes[index].y = Util.getRandomCoordinate("MUTATE", this.nodes[index].y);
    }

    function mutateSingleCoordinateInSector(chance, sectors) {
      //checks if this gene should be mutated or not
      if (Math.random() > chance) return;

      //gets random sector
      var sector = sectors[Util.getRandomNumber(sectors.length)];
      var listOfNodesInsideSector = sector.getNodesInside(this.nodes);
      // checks if there are any nodes in sector
      if (listOfNodesInsideSector.length === 0) return;

      // gets random node in sector
      var randomNodeIndex = listOfNodesInsideSector[Util.getRandomNumber(listOfNodesInsideSector.length)];

      var node = this.nodes[randomNodeIndex];

      // assigns new coordinates within the sector
      node.x = Util.getRandomFromInterval(sector.bottomLeft.x, sector.topRight.x);
      node.y = Util.getRandomFromInterval(sector.bottomLeft.y, sector.topRight.y);
    }

    function mutateAllCoordinatesInSector(chance, sectors) {
      //checks if this gene should be mutated or not
      if (Math.random() > chance) return;

      //gets random sector
      var sector = sectors[Util.getRandomNumber(sectors.length)];
      var listOfNodesInsideSector = sector.getNodesInside(this.nodes);
      // checks if there are any nodes in sector
      if (listOfNodesInsideSector.length === 0) return;

      // gets random node in sector
      for (var i = 0; i < listOfNodesInsideSector.length; i++) {
        var node = this.nodes[listOfNodesInsideSector[i]];
        // assigns new coordinates within the sector
        node.x = Util.getRandomFromInterval(sector.bottomLeft.x, sector.topRight.x);
        node.y = Util.getRandomFromInterval(sector.bottomLeft.y, sector.topRight.y);
      }
    }

    function fitnessForDistance(compareTo) {
      var idealDistancePairs = {};

      for (var i = 0; i < this.nodes.length; i++) {
        var comparatorNode = this.nodes[i];

        for (var j = 0; j < this.nodes.length; j++) {
          if (i === j) continue;

          var nodeToCompare = this.nodes[j];

          if (idealDistancePairs[i] === j || idealDistancePairs[j] === i) continue;

          var distance = Math.sqrt(Math.pow(comparatorNode.x - nodeToCompare.x, 2)
            + Math.pow(comparatorNode.y - nodeToCompare.y, 2));

          if (distance <= compareTo) {
            idealDistancePairs[i] = j;
          }
        }
      }

      this.cost = Object.keys(idealDistancePairs).length;
    }

    function fitnessForClosestDistance(distanceFrom, distanceTo) {

      var idealDistancePairs = {};

      for (var i = 0; i < this.nodes.length; i++) {
        var comparatorNode = this.nodes[i];

        for (var j = 0; j < this.nodes.length; j++) {
          if (i === j) continue;

          var nodeToCompare = this.nodes[j];

          if (idealDistancePairs[i] === j || idealDistancePairs[j] === i) continue;

          var distance = Math.sqrt(Math.pow(comparatorNode.x - nodeToCompare.x, 2)
            + Math.pow(comparatorNode.y - nodeToCompare.y, 2));

          if (distance >= distanceFrom && distance <= distanceTo) {
            idealDistancePairs[i] = j;
          }
        }
      }

      this.cost = Object.keys(idealDistancePairs).length;
    }

    function fitnessForSectors(sectors, shouldBeInOneSector) {
      var total = 0;
      for (var i = 0; i < sectors.length; i++) {
        var nodesInside = sectors[i].howManyNodesInside(this.nodes);

        if (shouldBeInOneSector > nodesInside) {
          total += nodesInside - shouldBeInOneSector;
        } else if (shouldBeInOneSector < nodesInside) {
          total += (shouldBeInOneSector - nodesInside);
        }
      }

      this.cost = total;
    }

    function fitnessForEdgesIntersection() {
      var intersectingPairs = {};
      for (var i = 0; i < this.edges.length; i++) {
        var iEdgeFrom = this.edges[i].from;
        var iEdgeTo = this.edges[i].to;
        var iNodeFrom = this.nodes[iEdgeFrom];
        var iNodeTo = this.nodes[iEdgeTo];

        for (var j = 0; j < this.edges.length; j++) {
          var jEdgeFrom = this.edges[j].from;
          var jEdgeTo = this.edges[j].to;
          var jNodeFrom = this.nodes[jEdgeFrom];
          var jNodeTo = this.nodes[jEdgeTo];

          if (i === j) continue;
          if (intersectingPairs['' + iEdgeFrom + iEdgeTo] == '' + jEdgeFrom + jEdgeTo || intersectingPairs['' + jEdgeFrom + jEdgeTo] == '' + iEdgeFrom + iEdgeTo) continue;

          if (Util.doLinesIntersect(iNodeTo.x, iNodeTo.y, iNodeFrom.x, iNodeFrom.y, jNodeTo.x, jNodeTo.y, jNodeFrom.x, jNodeFrom.y)) {
            intersectingPairs['' + iEdgeFrom + iEdgeTo] = '' + jEdgeFrom + jEdgeTo;
          }
        }
      }

      this.cost = Object.keys(intersectingPairs).length * -1;
    }

    function fitnessForConnectedNodes() {
      // distance between nodes with edges should be for example 50px
      var totalDistanceBetweenNodesFits = 0;
      var nodesAreNotInEachOtherCircles = 0;
      var nodesWithoutEdgesAreFarAway = 0;
      var intersectionsNumber;

      // Calculate all distance between nodes with edges
      for (var i = 0; i < this.edges.length; i++) {
        var nodeFrom = this.nodes[this.edges[i].from];
        var nodeTo = this.nodes[this.edges[i].to];
        var distance = Util.getDistanceBetweenTwoPoints(nodeFrom.x, nodeFrom.y, nodeTo.x, nodeTo.y);

        if (distance == 50) totalDistanceBetweenNodesFits++;
      }



      // TODO Calculate if there are nodes on each other
      for (var i = 0; i < this.nodes.length; i++) {
        var node = this.nodes[i];
        for (var j = 0; j < this.nodes.length; j++) {
          if (i === j) continue;
          var nodeToTest = this.nodes[j];
          if (!Util.isPointInCircle(nodeToTest.x, nodeToTest.y, node.x, node.y, 30)) {
            nodesAreNotInEachOtherCircles++;
          }
        }
      }

      // TODO Calculate if single nodes(nodes without edges) are far away from nodes with edges
      var allNodesIds = [];
      for (var i = 0; i < this.nodes.length; i++) {
        allNodesIds.push(i);
      }

      var nodesWithEdges = [];
      for (var i = 0; i < this.edges.length; i++) {
        nodesWithEdges.push(this.edges[i].from);
        nodesWithEdges.push(this.edges[i].to);
      }

      var uniqueNodesWithEdges = nodesWithEdges.filter(function (value, index, self) {
        return self.indexOf(value) === index;
      });

      var nodesWihtoutEdges = allNodesIds.filter(function (x) {
        return uniqueNodesWithEdges.indexOf(x) == -1;
      });

      for (var i = 0; i < nodesWihtoutEdges.length; i++) {
        var nodeWithoutEdge = this.nodes[nodesWihtoutEdges[i]];
        for (var j = 0; j < uniqueNodesWithEdges.length; j++) {
          var nodeWithEdge = this.nodes[uniqueNodesWithEdges[j]];

          if (!Util.isPointInCircle(nodeWithoutEdge.x, nodeWithoutEdge.y, nodeWithEdge.x, nodeWithEdge.y, 60)) {
            nodesWithoutEdgesAreFarAway++;
          }
        }
      }

      // TODO calculate intesections number to minimize it
      var intersectingPairs = {};
      for (var i = 0; i < this.edges.length; i++) {
        var iEdgeFrom = this.edges[i].from;
        var iEdgeTo = this.edges[i].to;
        var iNodeFrom = this.nodes[iEdgeFrom];
        var iNodeTo = this.nodes[iEdgeTo];

        for (var j = 0; j < this.edges.length; j++) {
          var jEdgeFrom = this.edges[j].from;
          var jEdgeTo = this.edges[j].to;
          var jNodeFrom = this.nodes[jEdgeFrom];
          var jNodeTo = this.nodes[jEdgeTo];

          if (i === j) continue;
          if (intersectingPairs['' + iEdgeFrom + iEdgeTo] == '' + jEdgeFrom + jEdgeTo || intersectingPairs['' + jEdgeFrom + jEdgeTo] == '' + iEdgeFrom + iEdgeTo) continue;

          if (Util.doLinesIntersect(iNodeTo.x, iNodeTo.y, iNodeFrom.x, iNodeFrom.y, jNodeTo.x, jNodeTo.y, jNodeFrom.x, jNodeFrom.y)) {
            intersectingPairs['' + iEdgeFrom + iEdgeTo] = '' + jEdgeFrom + jEdgeTo;
          }
        }
      }

      intersectionsNumber = Object.keys(intersectingPairs).length * -1;

      this.cost = totalDistanceBetweenNodesFits + nodesAreNotInEachOtherCircles + nodesWithoutEdgesAreFarAway + intersectionsNumber;
    }
  }
})();
