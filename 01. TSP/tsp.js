

var canvasHelper = function (c) {
    var canvas = c;
    var context = canvas.getContext('2d');
    var points = [];

    return {
        drawPoints: function (p) {
            points = p;
            context.fillStyle = '#000000';
            for (var i = 0; i < points.length; i++) {
                context.fillRect(points[i].x, points[i].y, 5, 5);
            }
        },
        clean: function () {
            context.fillStyle = '#CCCCCC';
            context.fillRect(0, 0, canvas.width, canvas.height);
            points = [];
        },
        drawLine: function (line) {
            if (line.length > points.length) {
                console.error('line is too long, points: ' + points.length);
                return;
            }

            context.beginPath();
            var firstPoint = points[line[0]];
            context.moveTo(firstPoint.x, firstPoint.y);
            for (var z = 1; z < line.length; z++) {
                context.lineTo(points[line[z]].x, points[line[z]].y);
            }

            context.strokeStyle = line.color;
            context.stroke();
        }
    };
};

var swarmHelper = function (c, best) {
    var canvas = c;
    var bestCanvas = best;
    var sizeOfSwarm;
    var points = [];    //city locations X, Y
    var swarm = [];     //swarm, each swarm element is array of points
    var maxDist = 0;    //longest distance between any two cities, used for punishment   
    var timer;
    var iterations = 0;

    var drawingBoard = canvasHelper(c);
    var bestDrawingBoard = canvasHelper(bestCanvas);


    var getMousePos = function (canvas, e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left - (e.clientX - rect.left) % 5,
            y: e.clientY - rect.top - (e.clientY - rect.top) % 5
        };
    };

    canvas.addEventListener('mousedown', function (e) {
        if (document.getElementById('tspCanvas').disabled) {
            return;
        }
        var pos = getMousePos(this, e);
        points.push(pos);
        drawingBoard.drawPoints(points);
    });

    //random city selector
    var randomCity = function () {
        return random(points.length);
    };

    var random = function (max) {
        return Math.floor(Math.random() * max);
    };

    var getRandomColor = function () {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    var getDistance = function (a, b) {
        return Math.sqrt(Math.pow(points[a].x - points[b].x, 2) + Math.pow(points[a].y - points[b].y, 2));
    };

    var maxDistance = function () {
        var max = 0;
        for (var i = 0; i < points.length; i++) {
            for (var a = 0; a < points.length; a++) {
                max = Math.max(getDistance(i, a), max);
            }
        }
        return max;
    };

    var getTotalDistance = function (particle) {
        var dist = 0;
        for (var i = 0; i < points.length - 1; i++) {
            dist += getDistance(particle[i], particle[i + 1]);
        }
        return dist;
    };

    var hasDublicates = function (particle) {
        var pointsInPath = [];
        for (var i = 0; i < points.length; i++) {
            if (pointsInPath[particle[i]]) {
                return true
            }
            pointsInPath[particle[i]] = true;
        }
        return false;
    };

    var getFitness = function (particle) {
        //penalty for cheating, if same city is visited more than once
        var penalty = hasDublicates(particle) * points.length * maxDist;
        var distance = getTotalDistance(particle);
        return Math.round(distance + penalty);
    };

    var minFitness = function () {
        var min = 999999999999;
        for (var a = 0; a < swarm.length; a++) {
            min = Math.min(swarm[a].fitness, min);
        }
        return min;
    };

    //lower fitness = shorter path
    var bestParticleId = function () {
        var best = 999999999999;
        var bestId = 0;
        for (var a = 0; a < swarm.length; a++) {
            if (swarm[a].fitness < best) {
                best = swarm[a].fitness;
                bestId = a;
            }
        }
        return bestId;
    };

    var maxFitness = function () {
        var max = 0;
        for (var a = 0; a < swarm.length; a++) {
            max = Math.max(swarm[a].fitness, max);
        }
        return max;
    };

    var avgFitness = function () {
        var sum = 0;
        for (var a = 0; a < swarm.length; a++) {
            sum += swarm[a].fitness;
        }
        return Math.round(sum / swarm.length);
    };

    //---------------------------------------
    var printResults = function () {
        var table = document.createElement('TABLE');
        var tableDiv = document.getElementById('results');
        tableDiv.innerText = '';
        var tableBody = document.createElement('TBODY')

        table.border = '1'
        table.appendChild(tableBody);

        var heading = new Array();
        heading[0] = 'Particle'
        heading[1] = 'Path'
        heading[2] = 'Fitness'

        //TABLE COLUMNS
        var tr = document.createElement('TR');
        tableBody.appendChild(tr);
        for (i = 0; i < heading.length; i++) {
            var th = document.createElement('TH')
            th.width = '75';
            th.appendChild(document.createTextNode(heading[i]));
            tr.appendChild(th);
        }

        //TABLE ROWS
        for (i = 0; i < swarm.length; i++) {
            var tr = document.createElement('TR');
            var td1 = document.createElement('TD');
            td1.appendChild(document.createTextNode(i));
            tr.appendChild(td1);

            var td2 = document.createElement('TD');
            td2.appendChild(document.createTextNode(swarm[i].join(',')));
            tr.appendChild(td2);

            var td3 = document.createElement('TD');
            td3.appendChild(document.createTextNode(swarm[i].fitness));
            tr.appendChild(td3);

            tableBody.appendChild(tr);
        }

        tableDiv.appendChild(document.createTextNode('Max fitness: ' + maxFitness()));
        tableDiv.appendChild(document.createElement('br'));
        tableDiv.appendChild(document.createTextNode('Min fitness: ' + minFitness()));
        tableDiv.appendChild(document.createElement('br'));
        tableDiv.appendChild(document.createTextNode('Avg fitness: ' + avgFitness()));
        tableDiv.appendChild(document.createElement('br'));
        tableDiv.appendChild(document.createTextNode('Iteration: ' + iterations));

        tableDiv.appendChild(table);
    };

    var disableInput = function (disable) {
        document.getElementById('tspCanvas').disabled = disable;
        document.getElementById('swarmSize').disabled = disable;
        document.getElementById('cleanBtn').disabled = disable;
        document.getElementById('startBtn').disabled = disable;
        document.getElementById('stepBtn').disabled = disable;
        document.getElementById('stopBtn').disabled = !disable;
    }
    //---------------------------------------

    //create random path using all points only once
    var uniquePath = function () {
        var p = [];
        var path = [];

        for (var j = 0; j < points.length; j++) {
            p.push(j);
        }

        while (p.length > 0) {
            var element = random(p.length);
            path.push(p[element]);
            p.splice(element, 1);
        }

        return path
    };

    var initialize = function () {
        for (var i = 0; i < sizeOfSwarm; i++) {
            var particle = [];

            //get random path
            particle = uniquePath();
            //random color
            particle.color = getRandomColor();
            //calculate fitness
            particle.fitness = getFitness(particle);

            swarm.push(particle);
            drawingBoard.drawLine(particle);
        }
        maxDist = maxDistance();
    };

    //switch 20% random points from fittest to others
    var crossOver = function () {
        var bestId = bestParticleId();
        var amountToCross = Math.floor(points.length * 0.2);
        for (var i = 0; i < swarm.length; i++) {
            for (var a = 0; a < amountToCross; a++) {
                var toCross = randomCity();
                swarm[i][toCross] = swarm[bestId][toCross];
            }
        }
    };

    //20% chance to mutate (swap points), exclude fittest
    var mutate = function () {
        var bestId = bestParticleId();
        var amountToMutate = 1;
        for (var i = 0; i < swarm.length; i++) {
            var doMutation = random(5);

            if (bestId != i && doMutation == 1) {
                for (var a = 0; a < amountToMutate; a++) {
                    var from = randomCity();
                    var to = randomCity();
                    var temp = swarm[i][to];
                    swarm[i][to] = swarm[i][from];
                    swarm[i][from] = temp;
                }
            }
        }
    };

    var calculateFitness = function () {
        for (var i = 0; i < sizeOfSwarm; i++) {
            swarm[i].fitness = getFitness(swarm[i]);
            drawingBoard.drawLine(swarm[i]);
        }
        swarm.sort(function (a, b) { return a.fitness - b.fitness; });
        bestDrawingBoard.clean();
        bestDrawingBoard.drawPoints(points);
        bestDrawingBoard.drawLine(swarm[0]);
    };

    return {
        start: function () {
            if (iterations == 0) {
                sizeOfSwarm = parseInt(document.getElementById('swarmSize').value);
                swarm = [];
                initialize();
                drawingBoard.drawPoints(points);
                printResults();
            }
            disableInput(true);

            timer = setInterval(function () {
                crossOver();
                mutate();
                drawingBoard.clean();
                drawingBoard.drawPoints(points);
                calculateFitness();
                printResults();
                iterations++;
            }, 200);
        },
        stop: function () {
            clearInterval(timer);

            disableInput(false);
        },
        step: function () {
            if (iterations == 0) {
                sizeOfSwarm = parseInt(document.getElementById('swarmSize').value);
                swarm = [];
                initialize();
                drawingBoard.drawPoints(points);
                printResults();
            }
            crossOver();
            mutate();
            iterations++;
            drawingBoard.clean();
            drawingBoard.drawPoints(points);
            calculateFitness();
            printResults();
        },
        clean: function () {
            clearInterval(timer);
            drawingBoard.clean();
            bestDrawingBoard.clean();
            points = [];
            swarm = [];

            disableInput(false);

            iterations = 0;
        }
    }
};

var c = document.getElementById('tspCanvas');
var bestSolution = document.getElementById('bestSolutionCanvas');
var swarm = swarmHelper(c, bestSolution);
swarm.clean();