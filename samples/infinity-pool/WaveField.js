
/* author: @oceanos */
// implements a wave 'field'
// http://www.mtnmath.com/whatrh/node66.html

var WaveField = function (options) {
    var gridx = options.gridx || 0;
    var gridy = options.gridy || 0;
    var waveSpeed = options.waveSpeed || 0.2;
    var damping = options.damping || 0.01;
    var heightField = [2];
    var oscillators = [];
    var page = 0;

    // init heigh field
    // two pages, for current and previous state of the wavefield
    for (var p = 1; p >= 0; p--) {
        heightField[p] = new Array(gridx);
        for (var x = gridx-1; x >= 0; x--) {
                heightField[p][x] = new Array(gridy);
            for (var y = gridy-1; y >= 0; y--) {
                heightField[p][x][y] = 0.0;
            }
        }
    };

    // an oscillator is just a way to create a perturbation in the wave field
    var Oscillator = function (options) {
        var phase = Math.PI;

        return {
            ox: options.ox || gridx/2,
            oy: options.oy || gridy/2,
            step: options.step || Math.PI/8,
            ttl: options.ttl || 0,
            dead: false,
            tick: function () {
                heightField[page][this.ox][this.oy] = Math.sin(phase);
                heightField[page^1][this.ox][this.oy] = 0;
                phase += this.step;
                this.dead = this.ttl != 0 ? ((phase/Math.PI*2) > this.ttl ? true : false) : false;
            }
        }
    };

    return {
        update: function() {
            // we just tick the oscilators, and remove them if they're dead
            var i = oscillators.length;
            while (i--) {
                if (!oscillators[i].dead) oscillators[i].tick();
                else oscillators.splice(i,1);
            } 
            var currentField = heightField[page];
            var previousField = heightField[page^1];
            for(var x = gridx-2; x >=1; x--) {
                for(var y = gridy-2; y >= 1; y--) {
                    var current = currentField[x][y];
                    var previous = previousField[x][y];
                    var dx = currentField[x-1][y] + currentField[x+1][y];
                    var dy = currentField[x][y-1] + currentField[x][y+1];
                    var value = 2 * current - previous + waveSpeed * (dx+dy-4*current);
                    // we put the new value in the previous field and switch pages
                    previousField[x][y] = value - value*damping;
                }
            }
            page ^= 1;
        },
        get: function (x,y) {
            return heightField[page][x][y];
        },
        addOscillator: function (options) {
            oscillators.push(new Oscillator(options));
        },
        dump: function() {
            var i = j = 0;
            heightField.forEach(function (xarr) {
                var i = 0;
                xarr.forEach(function (yarr) {
                    var s="".concat(i++);
                    yarr.forEach(function (x) {
                        s = s.concat(":",Math.floor(100*x));
                    });
                    console.log(s);
                });
            });
        }
    };
};