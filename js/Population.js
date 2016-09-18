(function () {
  'use strict';
  angular.module('app').factory('Population', Population);

  function Population($rootScope, Gene, Util, PopulationStatus) {

    // Variables declaration

    var Population = function (populationSize, geneSize, pictureSize,
      mutationType, mutateRate, generationType,
      crossoverType, fitnessType, fitnessConfig,
      numberOfParents, numberOfChildren, gene) {
      Util.setPictureSize(pictureSize);
      this.genes = [];
      this.mutationType = mutationType;
      this.mutateRate = mutateRate;
      this.generationNumber = 0;
      this.crossoverType = crossoverType;
      this.fitnessType = fitnessType.code;
      this.fitnessConfig = fitnessConfig;
      this.numberOfParents = numberOfParents;
      this.numberOfChildren = numberOfChildren;
      this.statistics = {};

      switch (generationType.code) {
        case "RANDOM": {
          var gene = new Gene();
          gene.random(geneSize, pictureSize);
          this.genes.push(gene);

          for (var i = 0; i < populationSize - 1; i++) {
            var newGene = gene.generateRandomFromItself();
            this.genes.push(newGene);


          }
          break;
        }
        case "BEST_SELECTION": {
          var tempGenes = [];
          for (var i = 0; i < populationSize * 10; i++) {
            var gene = new Gene();

            gene.random(geneSize, pictureSize);
            tempGenes.push(gene);
          }

          tempGenes.sort(function (a, b) {
            return a.cost - b.cost;
          });
          tempGenes.reverse();
          this.genes = tempGenes.slice(0, populationSize);

          break;
        }
        case "UPLOAD": {
          var gene = new Gene(gene.nodes, gene.edges);
          this.genes.push(gene);
          for (var i = 0; i < populationSize - 1; i++) {
            var _gene = gene.generateRandomFromItself();
            this.genes.push(_gene);
          }
          break;
        }
      }

      switch (this.fitnessType) {
        case "SECTORS": {
          this.sectors = Util.calculateSectors(
            fitnessConfig.horizontalTicks,
            fitnessConfig.verticalTicks
          );
          break;
        }
      }

      switch (this.crossoverType.code) {
        case "REGION": {
          this.regions = Util.calculateSectors(
            20,
            20
          );
          break;
        }
      }
    };

    // Sorts nodes by cost descending
    Population.prototype.sort = sort;
    // Mates two best parents taking x coords from parent1 and y coords from parent2
    Population.prototype.crossoverXFromOneYFromAnother = crossoverXFromOneYFromAnother;
    // Takes one node from one parent another node from another parent randomly
    Population.prototype.crossoverRandomNodeFromOneRandomNodeFromAnother = crossoverRandomNodeFromOneRandomNodeFromAnother;
    Population.prototype.crossoverRegions = crossoverRegions;
    Population.prototype.generation = generation;
    Population.prototype.calculateGeneFitness = calculateGeneFitness;
    Population.prototype.calculateAllGenesFitneses = calculateAllGenesFitneses;

    return Population;

    function sort() {
      this.genes.sort(function (a, b) {
        return a.cost - b.cost;
      });

      this.genes.reverse();
    }

    function calculateGeneFitness(gene) {
      switch (this.fitnessType) {
        case "DISTANCE": {
          gene.fitnessForDistance(this.fitnessConfig.fitnessRate);
          break;
        }
        case "SECTORS": {
          gene.fitnessForSectors(this.sectors, this.fitnessConfig.fitnessRate);
          break;
        }
        case "INTERSECTION": {
          gene.fitnessForEdgesIntersection();
          break;
        }
        case "CLOSEST": {
          gene.fitnessForClosestDistance(this.fitnessConfig.distanceFrom, this.fitnessConfig.distanceTo);
          break;
        }
        case "CONNECTED_NODES": {
          gene.fitnessForConnectedNodes();
          break;
        }
      }
    }

    function crossoverXFromOneYFromAnother(parent1, parent2) {
      var nodes = [];
      // Takes x from parent1 and y from parent2
      for (var i = parent1.nodes.length - 1; i >= 0; i--) {
        var node = {
          id: i,
          label: String(i),
          x: angular.copy(parent1.nodes[i].x),
          y: angular.copy(parent2.nodes[i].y)
        };

        nodes.push(node);
      }

      return new Gene(nodes, parent1.edges);
    }

    function crossoverRandomNodeFromOneRandomNodeFromAnother(parent1, parent2) {
      var nodes = [];

      for (var i = 0; i < parent1.nodes.length; i++) {
        var random = Math.random();
        var node = {
          id: i,
          label: String(i),
          x: random > 0.5 ? angular.copy(parent1.nodes[i].x) : angular.copy(parent2.nodes[i].x),
          y: random > 0.5 ? angular.copy(parent1.nodes[i].y) : angular.copy(parent2.nodes[i].y)
        };
        nodes.push(node);
      }

      return new Gene(nodes, parent1.edges);
    }

    function crossoverRegions(parent1, parent2) {
      var nodesInsideRegion = [];

      while (nodesInsideRegion.length === 0) {
        var region = this.regions[Math.floor(Math.random() * this.regions.length)];
        nodesInsideRegion = region.getNodesInside(parent1.nodes);
      }

      var nodes = [];

      for (var i = 0; i < parent2.nodes.length; i++) {
        // check if we need to take node from one parent or from another
        var node = {
          id: i,
          label: String(i)
        };

        if (nodesInsideRegion.indexOf(i) > -1) {
          node.x = angular.copy(parent1.nodes[i].x);
          node.y = angular.copy(parent1.nodes[i].y);
        } else {
          node.x = angular.copy(parent2.nodes[i].x);
          node.y = angular.copy(parent2.nodes[i].y);
        }
        nodes.push(node);
      }

      return new Gene(nodes, parent1.edges);
    }

    function calculateAllGenesFitneses() {
      for (var i = 0; i < this.genes.length; i++) {
        this.calculateGeneFitness(this.genes[i]);
      }
    }

    function getChildrenAfterCrossOver(population) {
      var children = [];
      // Need to make a deep copy here with new references
      // Otherwise changing child nodes will affect parent nodes
      var parents = population.genes.slice(0, population.numberOfParents);

      while (children.length != population.numberOfChildren) {
        var parent1Number = null;
        var parent2Number = null;
        // Parent1 and Parent2 cannot be equal, so we need to hedge against that
        while (angular.equals(parent1Number, parent2Number)) {
          parent1Number = Math.floor(Math.random() * parents.length);
          parent2Number = Math.floor(Math.random() * parents.length);
        }
        var parent1 = parents[parent1Number];
        var parent2 = parents[parent2Number];

        var child = null;
        switch (population.crossoverType.code) {
          case "X_Y": {
            child = population.crossoverXFromOneYFromAnother(parent1, parent2);
            break;
          }
          case "ONE_ANOTHER": {
            child = population.crossoverRandomNodeFromOneRandomNodeFromAnother(parent1, parent2);
            break;
          }
          case "REGION": {
            child = population.crossoverRegions(parent1, parent2);
            break;
          }
        }

        switch (population.mutationType.code) {
          case "SINGLE_WHOLE_PICTURE": {
            child.mutateSingleCoordinate(population.mutateRate);
            break;
          }
          case "SINGLE_SECTOR": {
            child.mutateSingleCoordinateInSector(population.mutateRate, Util.calculateSectors(10, 10));
            break;
          }
          case "ALL_SECTOR": {
            child.mutateAllCoordinatesInSector(population.mutateRate, Util.calculateSectors(10, 10));
            break;
          }
        }

        population.calculateGeneFitness(child);

        if (child.cost > population.genes[0].cost) {
          //PopulationStatus.addChild({number: population.generationNumber, cost: child.cost});
          //console.log(population.generationNumber + ' ' + child.cost);
        }

        children.push(child);
      }

      return children;
    }

    function generation(population) {
      if (population.generationNumber == 0) {
        PopulationStatus.setInitialFitness(population.genes[0].cost);
      }

      // Create new child using crossover function which is chosen by the user
      var children = getChildrenAfterCrossOver(population);

      population.genes = population.genes.concat(children);
      // Sort population
      population.sort();

      // Remove last element from the population
      population.genes = population.genes.splice(0, population.genes.length - population.numberOfChildren);

      if (population.generationNumber == 0
        || population.generationNumber == 10
        || population.generationNumber == 20
        || population.generationNumber == 30
        || population.generationNumber == 40
        || population.generationNumber == 50
        || population.generationNumber == 100
                /*|| population.generationNumber == 200
                || population.generationNumber == 300
                || population.generationNumber == 400
                || population.generationNumber == 500
                || population.generationNumber == 600*/) {
        population.statistics[population.generationNumber] = population.genes[0].cost;
      }

      if (population.genes[0].cost >= population.fitnessConfig.stopCriteria || population.generationNumber == 100) {
        //console.log(population.generationNumber + ' ' + population.genes[0].cost);

        population.calculateGeneFitness(population.genes[0]);
        PopulationStatus.set(population.generationNumber, population.genes[0].cost);

        Util.drawGraph(population.genes[0].nodes, population.genes[0].edges);

        $rootScope.$broadcast("stopGeneration");
        return true;
      } else {
        PopulationStatus.set(population.generationNumber, population.genes[0].cost);

        Util.drawGraph(population.genes[0].nodes, population.genes[0].edges);
        population.generationNumber++;
      }
    }
  }
})();
