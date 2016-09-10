(function() {
    'use strict';

    angular.module('app').service('PopulationStatus', PopulationStatus);

    function PopulationStatus($rootScope) {

        // Variables declaration
        this.populationStatus = {
            initialFitness: 0,
            generationCount: 0,
            bestGeneCost: 0,
            childs: {}
        };

        this.set = function(generationCount, bestGeneCost) {
            this.populationStatus.generationCount = generationCount;
            this.populationStatus.bestGeneCost = bestGeneCost;
            if(!$rootScope.$$phase) {
                $rootScope.$apply();
            }
        };

        this.setInitialFitness = function(initialFitness) {
            this.populationStatus.initialFitness = initialFitness;
        };

        this.get = function() {
            return this.populationStatus;
        };

        this.addChild = function(child) {
            if (!this.populationStatus.childs[child.number]) {
                this.populationStatus.childs[child.number] = {generation: child.number, cost: child.cost};
            } else if (Math.abs(this.populationStatus.childs[child.number]) < Math.abs[child.cost]) {
                this.populationStatus.childs[child.number] = {generation: child.number, cost: child.cost};
            }
        }
    }
})();