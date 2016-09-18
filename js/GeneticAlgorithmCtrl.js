(function () {
  'use strict';

  angular.module('app').controller('GeneticAlgorithmCtrl', GeneticAlgorithmCtrl);

  function GeneticAlgorithmCtrl($scope, $interval, $timeout, Population, PopulationStatus, Util, _) {
    var vm = this;



    vm.population = undefined;

    // variable assignment
    vm.generationTypes = [{
      name: "Random",
      code: "RANDOM"
    }, {
        name: "Best gene selection",
        code: "BEST_SELECTION"
      }, {
        name: "Upload graph from graphviz",
        code: "UPLOAD"
      }];

    vm.crossoverTypes = [{
      name: "X from one Y from another",
      code: "X_Y"
    }, {
        name: "One node from one, another node from another",
        code: "ONE_ANOTHER"
      }, {
        name: "Region",
        code: "REGION"
      }];

    vm.mutationTypes = [{
      name: "Mutate single coordinate in whole picture",
      code: "SINGLE_WHOLE_PICTURE"
    }, {
        name: "Mutate single coordinate in sector",
        code: "SINGLE_SECTOR"
      }, {
        name: "Mutate all coordinates in sector",
        code: "ALL_SECTOR"
      }];

    vm.fitnessTypes = [{
      name: "Minimize distance between nodes",
      code: "DISTANCE"
    }, {
        name: "Separate nodes into chosen sectors",
        code: "SECTORS"
      }, {
        name: "Minimize intersections number",
        code: "INTERSECTION"
      }, {
        name: "Put nodes in specified distance range",
        code: "CLOSEST"
      }, {
        name: "Maximize distance between nodes with and without edges",
        code: "CONNECTED_NODES"
      }];

    vm.numberOfExperiments = 20;
    vm.numberOfDoneExperiments = 1;

    vm.populationConfig = {
      populationSize: 30,
      geneSize: 50,
      pictureSize: 500,
      mutationRate: 0.1,
      generationType: vm.generationTypes[0],
      crossoverType: vm.crossoverTypes[1],
      fitnessType: vm.fitnessTypes[4],
      mutationType: vm.mutationTypes[0],
      numberOfParents: 4,
      numberOfChildren: 16,
      fitnessConfig: {
        fitnessRate: 1,
        stopCriteria: 10000000000,
        horizontalTicks: 5,
        verticalTicks: 10,
        distanceFrom: 10,
        distanceTo: 50
      }
    };

    vm.populationStatus = PopulationStatus.populationStatus;
    vm.start = start;
    vm.stop = stop;
    vm.pause = pause;
    vm.applyGraph = applyGraph;
    vm.draw = draw;
    vm.handleKeyPress = handleKeyPress;

    function start(gene) {
      if (!angular.isDefined(vm.population)) {
        if (gene) {
          vm.populationConfig.geneSize = gene.nodes.length;
          vm.population = new Population(
            vm.populationConfig.populationSize - 1,
            gene.nodes.length,
            vm.populationConfig.pictureSize,
            vm.populationConfig.mutationType,
            vm.populationConfig.mutationRate,
            vm.populationConfig.generationType,
            vm.populationConfig.crossoverType,
            vm.populationConfig.fitnessType,
            vm.populationConfig.fitnessConfig,
            vm.populationConfig.numberOfParents,
            vm.populationConfig.numberOfChildren,
            gene);
        } else {
          vm.population = new Population(
            vm.populationConfig.populationSize - 1,
            vm.populationConfig.geneSize,
            vm.populationConfig.pictureSize,
            vm.populationConfig.mutationType,
            vm.populationConfig.mutationRate,
            vm.populationConfig.generationType,
            vm.populationConfig.crossoverType,
            vm.populationConfig.fitnessType,
            vm.populationConfig.fitnessConfig,
            vm.populationConfig.numberOfParents,
            vm.populationConfig.numberOfChildren,
            gene);
        }

        Util.drawInitialGraph(vm.population.genes[0].nodes, vm.population.genes[0].edges);
      }

      vm.population.calculateAllGenesFitneses();
      vm.population.sort();

      vm.currentGeneration = $interval(function () { vm.population.generation(vm.population) }, 1);

      $scope.$watch(function () {
        return PopulationStatus.populationStatus;
      }, function (newValue) {
        vm.populationStatus = newValue;
      }, true);
    }

    function stop() {
      $timeout(function () {
        $scope.$emit('stopGeneration');
      }, 20);
    }

    function pause() {
      $timeout(function () {
        $scope.$emit('pauseGeneration');
      }, 20);
    }

    function draw() {
      var gene = angular.copy(vm.population.genes[0]);
      Util.drawGraph(gene.nodes, gene.edges);
    }

    $scope.$on('stopGeneration', function () {
      $interval.cancel(vm.currentGeneration);
      if (vm.numberOfDoneExperiments == 1) {
        console.log(
          'Nr '
          + 0 + ' '
          + 10 + ' '
          + 20 + ' '
          + 30 + ' '
          + 40 + ' '
          + 50 + ' '
          + 100 + ' '
          /*+ 200 + ' '
          + 300 + ' '
          + 400 + ' '
          + 500 + ' '
          + 600 + ' '*/
        );
      }
      console.log(vm.numberOfDoneExperiments + ' '
        + vm.population.statistics[0] + ' '
        + vm.population.statistics[10] + ' '
        + vm.population.statistics[20] + ' '
        + vm.population.statistics[30] + ' '
        + vm.population.statistics[40] + ' '
        + vm.population.statistics[50] + ' '
        + vm.population.statistics[100] + ' '
            /*+ vm.population.statistics[200] + ' '
            + vm.population.statistics[300] + ' '
            + vm.population.statistics[400] + ' '
            + vm.population.statistics[500] + ' '
            + vm.population.statistics[600] + ' '*/);
      vm.population = undefined;

      var options = {
        interaction: {
          selectable: true
        }
      };

      Util.generatedGraph.setOptions(options);
      Util.initialGraph.setOptions(options);

      if (vm.numberOfExperiments != vm.numberOfDoneExperiments) {
        vm.numberOfDoneExperiments++;
        vm.start();
      } else {
        vm.numberOfDoneExperiments = 1;
      }
    });

    $scope.$on('pauseGeneration', function () {
      $interval.cancel(vm.currentGeneration);
    });

    function applyGraph() {
      var file = document.getElementById('graph-data').files[0],
        fileReader = new FileReader();
      fileReader.readAsBinaryString(file);
      fileReader.onloadend = function (e) {
        var data = e.target.result;
        var lines = data.split("\n");

        var nodes = [];
        var edges = [];

        angular.forEach(lines, function (line) {
          // create nodes
          if (~line.indexOf("node")) {
            var splittedLine = line.split(" ");
            var node = {
              id: parseInt(splittedLine[1]) - 1,
              label: "" + (parseInt(splittedLine[1]) - 1),
              x: parseFloat(splittedLine[2]),
              y: parseFloat(splittedLine[3])
            };

            nodes.push(node);
          }
          // create edges
          if (~line.indexOf("edge")) {
            var splittedLine = line.split(" ");

            var edge = {
              from: parseInt(splittedLine[1]) - 1,
              to: parseInt(splittedLine[2]) - 1
            };

            edges.push(edge);
          }
        });

        vm.start({ nodes: nodes, edges: edges });
      }
    }

    function handleKeyPress(e) {
      switch (e.keyCode) {
        // letter 'Q'
        case 113: {
          vm.start();
          break;
        }
        // letter 'W'
        case 119: {
          vm.stop();
          break;
        }
        // letter 'E'
        case 101: {
          vm.pause();
          break;
        }
        // letter 'R'
        case 114: {
          vm.draw();
          break;
        }
      }
    }
  }
})();
