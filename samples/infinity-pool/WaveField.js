
/* author: @oceanos */
// implements a wave 'field'
// http://www.mtnmath.com/whatrh/node66.html

var WaveField = function (options) {
    var gridx = options.gridx || 0;
    var gridy = options.gridy || 0;
    var waveSpeed = options.waveSpeed || 0.2;
    var damping = options.damping || 0.01;
    var heightMap = [2];
    var oscilators = [];
    var page = 0;

    // init heigh map
    // two pages, for current and previous state of the wavefield
    for (var p = 1; p >= 0; p--) {
        heightMap[p] = new Array(gridx);
        for (var x = gridx-1; x >= 0; x--) {
                heightMap[p][x] = new Array(gridy);
            for (var y = gridy-1; y >= 0; y--) {
                heightMap[p][x][y] = 0.0;
            }
        }
    };

    // an oscilator is just a way to create a perturbation in the wave field
    var Oscilator = function (options) {
        var phase = Math.PI;

        return {
            ox: options.ox || gridx/2,
            oy: options.oy || gridy/2,
            step: options.step || Math.PI/8,
            ttl: options.ttl || 0,
            dead: false,
            tick: function () {
                heightMap[page][this.ox][this.oy] = Math.sin(phase);
                heightMap[page^1][this.ox][this.oy] = 0;
                phase += this.step;
                this.dead = this.ttl != 0 ? ((phase/Math.PI*2) > this.ttl ? true : false) : false;
            }
        }
    };

    return {
        update: function() {
            // we just tick the oscilators, and remove them if they're dead
            oscilators.forEach(function(item) {
                if (!item.dead) item.tick();
                else oscilators.splice(oscilators.indexOf(item),1);
            });
            // http://www.mtnmath.com/whatrh/node66.html
            for(var x = gridx-2; x >=1; x--) {
                for(var y = gridy-2; y >= 1; y--) {
                    var current = heightMap[page][x][y];
                    var previous = heightMap[page^1][x][y];
                    var dx = heightMap[page][x-1][y] + heightMap[page][x+1][y];
                    var dy = heightMap[page][x][y-1] + heightMap[page][x][y+1];
                    var value = 2 * current - previous + waveSpeed * (dx+dy-4*current);
                    heightMap[page^1][x][y] = value - value*damping;
                }
            }
            page ^= 1;
        },
        get: function (x,y) {
            return heightMap[page][x][y];
        },
        addOscilator: function (options) {
            oscilators.push(new Oscilator(options));
        },
        dump: function() {
            var i = j = 0;
            heightMap.forEach(function (xarr) {
                var i = 0;
                xarr.forEach(function (yarr) {
                    var s=""+i++;
                    yarr.forEach(function (x) {
                        s += ":"+Math.floor(100*x);
                    });
                    console.log(s);
                });
            });
        }
    };
};