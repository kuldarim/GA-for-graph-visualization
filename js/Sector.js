(function() {
    'use strict';

    angular.module('app').factory('Sector', Sector);

    function Sector() {

        // Variables declaration

        var Sector = function(bottomLeftX, bottomLeftY, xLineAddition, yLineAddition) {
            this.bottomLeft = {x: bottomLeftX, y: bottomLeftY};
            this.bottomRight = {x: bottomLeftX + xLineAddition, y: bottomLeftY};
            this.topLeft = {x: bottomLeftX, y: bottomLeftY + yLineAddition};
            this.topRight = {x: bottomLeftX + xLineAddition, y: bottomLeftY + yLineAddition};            
        };

        Sector.prototype.isNodeInside = isNodeInside;
        Sector.prototype.howManyNodesInside = howManyNodesInside;
        Sector.prototype.getNodesInside = getNodesInside;

        return Sector;

        function isNodeInside(sector, x, y) {

            var inX = x > sector.bottomLeft.x && x < sector.topRight.x;
            var inY = y > sector.bottomLeft.y && y < sector.topRight.y;

            return inX && inY;
        }

        function howManyNodesInside(nodes) {
            var numberOfNodesInside = 0;

            for (var i = 0; i < nodes.length; i++) {
                if (this.isNodeInside(this, nodes[i].x, nodes[i].y)){
                    numberOfNodesInside++;
                }
            }

            return numberOfNodesInside;
        }

        function getNodesInside(nodes) {
            var nodesInside = [];

            for (var i = 0; i < nodes.length; i++) {
                if (this.isNodeInside(this, nodes[i].x, nodes[i].y)){
                    nodesInside.push(i);
                }
            }

            return nodesInside;
        }
    }
})();