(function() {
    'use strict';

    angular.module('app').factory('Util', Util);

    function Util(Sector) {

        // Variables declaration
        var Util = {
            pictureSize: null,
            getRandomCoordinate: getRandomCoordinate,
            setPictureSize: setPictureSize,
            drawGraph: drawGraph,
            drawInitialGraph: drawInitialGraph,
            calculateSectors: calculateSectors,
            doLinesIntersect: doLinesIntersect,
            getRandomNumber: getRandomNumber,
            getRandomFromInterval: getRandomFromInterval,
            getDistanceBetweenTwoPoints: getDistanceBetweenTwoPoints,
            isPointInCircle: isPointInCircle,
            generatedGraph: undefined,
            initialGraph: undefined
        };

        return Util;

        function setPictureSize(pictureSize) {
            Util.pictureSize = pictureSize;
        }

        function getRandomCoordinate(action, coordinate) {
            switch(action) {
                case "RANDOM": {
                    return Math.floor(Math.random() * Util.pictureSize) + 1;
                }
                case "MUTATE": {
                    /*
                     *  Very little moves away with 10%
                     *  Otherwise -+1 to current coordinate
                     */
                    var percentToGetFarAway = 1;

                    if (percentToGetFarAway > Math.random()) {
                        coordinate = Math.floor(Math.random() * Util.pictureSize) + 1;
                    } else {
                        var inRange = false;
                        var tempCoordinate = null;
                        while(!inRange) {
                            tempCoordinate = angular.copy(coordinate);
                            var positiveOrNegative = [1, -1][Math.round(Math.random())];
                            //TODO Need to implement a better way to do this
                            tempCoordinate = coordinate + positiveOrNegative * (Math.floor(Math.random() * Util.pictureSize * 0.1) + 1);

                            if (tempCoordinate > 0 && tempCoordinate < Util.pictureSize) {
                                inRange = true;
                                coordinate = tempCoordinate;
                            }
                        }
                    }
                    return coordinate;
                }
            }
        }

        function drawGraph(nodes, edges) {
            if (!angular.isDefined(Util.generatedGraph)) {
                var container = document.getElementById('generatedGraphImage');

                var data= {
                    nodes: nodes,
                    edges: edges
                };

                var options = {
                    height: '900px',
                    nodes: {
                        shape: 'circle',
                        size: 9
                    },
                    edges: {
                        color: {
                            color: '#A3C1AD'
                        },
                        smooth: {
                            enabled: false,
                            roundness: 0
                        }
                    },
                    interaction: {
                        selectable: false
                    },
                    physics: {
                        enabled: false
                    }
                };

                Util.generatedGraph = new vis.Network(container, data, options);
            } else {
                Util.generatedGraph.setData({
                    nodes: nodes,
                    edges: edges
                });

                Util.generatedGraph.setOptions({
                    interaction: {
                        selectable: false
                    },
                    physics: {
                        enabled: false
                    }
                });
            }
        }

        function drawInitialGraph(nodes, edges) {
            if (!angular.isDefined(Util.initialGraph)) {
                var container = document.getElementById('initialGraphImage');

                var data= {
                    nodes: nodes,
                    edges: edges
                };

                var options = {
                    height: '900px',
                    nodes: {
                        shape: 'circle',
                        size: 9
                    },
                    edges: {
                        color: {
                            color: '#A3C1AD'
                        },
                        smooth: {
                            enabled: false,
                            roundness: 0
                        }
                    },
                    interaction: {
                        selectable: false
                    },
                    physics: {
                        enabled: false
                    }
                };

                Util.initialGraph = new vis.Network(container, data, options);
            } else {
                Util.initialGraph.setData({
                    nodes: nodes,
                    edges: edges
                });

                Util.initialGraph.setOptions({
                    interaction: {
                        selectable: false
                    },
                    physics: {
                        enabled: false
                    }
                });
            }
        }

        function calculateSectors(xSectorsNumber, ySectorsNumber) {
            var sectors = [];
            
            var xLineAddition = this.pictureSize / xSectorsNumber;
            var yLineAddition = this.pictureSize / ySectorsNumber;
            var firstCornerX = 0;
            var firstCornerY = 0;

            for (var i = ySectorsNumber; i > 0; i--) {
                var horizontalLineSectors = [];
                //(bottomLeft, bottomRight, topLeft, topRight)
                var firstSector = new Sector(firstCornerX, firstCornerY, xLineAddition, yLineAddition);
                horizontalLineSectors.push(firstSector);

                for (var j = 0; j < xSectorsNumber - 1; j++) {
                    // Previous sector right corner
                    firstCornerX = horizontalLineSectors[j].bottomRight.x;
                    firstCornerY = horizontalLineSectors[j].bottomRight.y;
                    var sector = new Sector(firstCornerX, firstCornerY, xLineAddition, yLineAddition);
                    horizontalLineSectors.push(sector);
                }
                sectors = sectors.concat(horizontalLineSectors);
                // First line sector top left coner is first left corner of next line first sector
                firstCornerX = horizontalLineSectors[0].topLeft.x;
                firstCornerY = horizontalLineSectors[0].topLeft.y;
            }

            return sectors
        }

        /*
         * All info and explanations are here
         *
         * http://jsfiddle.net/justin_c_rounds/Gd2S2/
         */
        function doLinesIntersect(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
            // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
            var denominator, a, b, numerator1, numerator2, result = {
                x: null,
                y: null,
                onLine1: false,
                onLine2: false
            };
            denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
            if (denominator == 0) {
                return result;
            }
            a = line1StartY - line2StartY;
            b = line1StartX - line2StartX;
            numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
            numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
            a = numerator1 / denominator;
            b = numerator2 / denominator;

            // if we cast these lines infinitely in both directions, they intersect here:
            result.x = line1StartX + (a * (line1EndX - line1StartX));
            result.y = line1StartY + (a * (line1EndY - line1StartY));
            // if line1 is a segment and line2 is infinite, they intersect if:
            if (a > 0 && a < 1) {
                result.onLine1 = true;
            }
            // if line2 is a segment and line1 is infinite, they intersect if:
            if (b > 0 && b < 1) {
                result.onLine2 = true;
            }
            // if line1 and line2 are segments, they intersect if both of the above are true
            return result.onLine1 && result.onLine2;
        }

        function getRandomNumber(number) {
            return Math.floor(Math.random() * number);
        }

        function getRandomFromInterval(min, max) {
            return Math.floor( Math.random() * ( max - min + 1 ) + min);
        }

        function getDistanceBetweenTwoPoints(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        }

        // x,y is the point to test
        // cx, cy is circle center, and radius is circle radius
        function isPointInCircle(x, y, cx, cy, radius) {
            var distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
            return distancesquared <= radius * radius;
        }
    }
})();