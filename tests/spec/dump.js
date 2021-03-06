'use strict';
require('babelify/polyfill');

// TODO add mocha tests in node
//var expect = require('chai').expect;
var deepFreeze = require('deep-freeze-strict');
var D = require('../../src/dump');
var merge = require('../../src/utils').merge;

function dateSerializer (key, value) {
    if (value instanceof Date)
        return {value: value.toJSON(), '__meta__': 'date'};

    return value;
}

function dateDeserializer (key, value) {
    if (value != null && value['__meta__'] === 'date')
        return new Date(value.value);
    return value;
}

function squeeze (str) {
    return str.replace(/\s/ig, '');
}

function noop () {
}

describe('Object litearals and arrays', function () {
    describe('Empty ojbect', function () {
        it('Serialize', function () {
            var dumpedObj = squeeze(JSON.stringify({'@0': {}}));

            expect(D.dump({})).to.be.eql(dumpedObj);
        });

        it('Restore mpty object', function () {
            var obj = deepFreeze({});
            var json = D.dump(obj);

            expect(D.restore(json)).to.be.instanceOf(Object);
        });
    });

    describe('Simple ojbect', function () {
        var obj = deepFreeze({x: 1, y: 'a', z: null, g: false});

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({'@0': {x: 1, y: 'a', z: null, g: false}});

            expect(D.dump(obj)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(obj))).to.be.eql(obj);
        });
    });

    describe('Composite object (level 2)', function () {
        var obj = deepFreeze({x: 1, f: {z: 1}, c: {y: 1}});

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': {'x': 1, 'f': '@1', 'c': '@2'},
                '@1': {'z': 1},
                '@2': {'y': 1}
            });

            expect(D.dump(obj)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(obj))).to.be.eql(obj);
        });
    });

    describe('Composite object (level 3)', function () {
        var obj = deepFreeze({x: 1, f: {z: 1, c: {y: 1}}});

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': {'x': 1, 'f': '@1'},
                '@1': {'z': 1, c: '@2'},
                '@2': {'y': 1}
            });

            expect(D.dump(obj)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(obj))).to.be.eql(obj);
        });
    });

    describe('Composite object (level 5)', function () {
        var obj5 = {d: 1, k: 2};
        var obj4 = {a: 1, l: obj5};
        var obj3 = {y: 1, m: obj4};
        var obj2 = {z: 1, c: obj3};
        var obj = deepFreeze({x: 1, f: obj2});

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': {'x': 1, f: '@1'},
                '@1': {'z': 1, c: '@2'},
                '@2': {'y': 1, m: '@3'},
                '@3': {'a': 1, l: '@4'},
                '@4': {d: 1, k: 2}
            });

            expect(D.dump(obj)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(obj))).to.be.eql(obj);
        });
    });

    describe('Simple composite object', function () {
        var obj = deepFreeze({x: 1, y: 2, f: {z: 1}});

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': {x: 1, y: 2, f: '@1'},
                '@1': {z: 1}
            });
            expect(D.dump(obj)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(obj))).to.be.eql(obj);
        });
    });

    describe('Recursive object', function () {
        var obj2 = {z: 1, c: null};
        var obj = {x: 1, f: obj2};
        obj2.c = obj;
        obj.a = obj;

        deepFreeze(obj);

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': {'x': 1, 'f': '@1', a: '@0'},
                '@1': {'z': 1, c: '@0'}
            });

            expect(D.dump(obj)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(obj))).to.be.eql(obj);
        });
    });

    describe('Empty array', function () {
        var arr = deepFreeze([]);

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': []
            });

            expect(D.dump(arr)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(arr))).to.be.eql(arr);
        });
    });

    describe('Simple array', function () {
        var arr = deepFreeze([1, 2, 3, 'abc', true, null]);

        it('Serialize primitive array', function () {
            var dumpedObj = JSON.stringify({'@0': [1, 2, 3, 'abc', true, null]});

            expect(D.dump(arr)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(arr))).to.be.eql(arr);
        });
    });

    describe('Composite array', function () {
        var arr = deepFreeze([1, 2, {x: 1}, 3]);

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': [1, 2, '@1', 3],
                '@1': {x: 1}
            });

            expect(D.dump(arr)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(arr))).to.be.eql(arr);
        });
    });

    describe('Composite array with recursive object', function () {
        var obj = {x: 1, y: {z: 'a', f: {d: 1}}};
        var arr = [1, 2, obj, 3];
        obj.o = obj;
        obj.y.f.a = obj;

        deepFreeze(arr);

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': [1, 2, '@1', 3],
                '@1': {x: 1, y: '@2', o: '@1'},
                '@2': {z: 'a', f: '@3'},
                '@3': {d: 1, a: '@1'}
            });

            expect(D.dump(arr)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(arr))).to.be.eql(arr);
        });
    });

    describe('Composite array (level 2)', function () {
        var arr = deepFreeze([1, 2, [3, 4], 5, [6]]);

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': [1, 2, '@1', 5, '@2'],
                '@1': [3, 4],
                '@2': [6]
            });

            expect(D.dump(arr)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(arr))).to.be.eql(arr);
        });
    });

    describe('Composite array (level 4)', function () {
        var arr = deepFreeze([1, 2, [3, 4, [6, 7, {x: 2}]], 8, [9]]);

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': [1, 2, '@1', 8, '@2'],
                '@1': [3, 4, '@3'],
                '@2': [9],
                '@3': [6, 7, '@4'],
                '@4': {x: 2}
            });

            expect(D.dump(arr)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(arr))).to.be.eql(arr);
        });
    });

    describe('Recursive array', function () {
        var arr = [1, 2, [3, 4], 8];
        arr[2].push(arr);
        arr.push(arr);
        deepFreeze(arr);

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': [1, 2, '@1', 8, '@0'],
                '@1': [3, 4, '@0']
            });

            expect(D.dump(arr)).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            expect(D.restore(D.dump(arr))).to.be.eql(arr);
        });
    });

    describe('Object with functions', function () {
        var obj = deepFreeze({x: 1, y: noop, b: noop, c: 3});

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': {x: 1, c: 3}
            });

            expect(D.dump(obj)).to.be.eql(dumpedObj);
        });
    });

    describe('Object with date', function () {
        var obj = deepFreeze({x: 1, y: new Date(), c: 3});

        it('Serialize date to empty object by default', function () {
            var dumpedObj = JSON.stringify({
                '@0': {x: 1, y: '@1', c: 3},
                '@1': {}
            });

            expect(D.dump(obj)).to.be.eql(dumpedObj);
        });
    });

    describe('Custom serialization', function () {
        var obj = deepFreeze({x: 1, y: new Date('2015-04-26T20:39:35.208Z'), c: 3});

        it('Serialize date to string', function () {
            var dumpedObj = JSON.stringify({
                '@0': {x: 1, y: '@1', c: 3},
                '@1': {value: '2015-04-26T20:39:35.208Z', '__meta__': 'date'}
            });

            expect(D.dump(obj, {serializer: dateSerializer})).to.be.eql(dumpedObj);
        });

        it('Restore with custom deserializer', function () {
            var json = D.dump(obj, {serializer: dateSerializer});
            var restoredObj = D.restore(json, {deserializer: dateDeserializer});
            expect(restoredObj).to.be.eql(obj);
        });

        it('Ignore property if serializer return undefined', function () {
            function serializer (key, value) {
                if (key === 'y') return;

                return value;
            }

            var dumpedObj = JSON.stringify({'@0': {x: 1, c: 3}});

            expect(D.dump(obj, {serializer: serializer})).to.be.eql(dumpedObj);
        });
    });

    describe('Custom serialization with multi links', function () {
        var date = new Date('2015-04-26T20:39:35.208Z');
        var obj = {x: 1, y: date, c: 3, d: date, f: {g: date}};

        deepFreeze(obj);

        it('Serialieze', function () {
            var dumpedObj = JSON.stringify({
                '@0': {x: 1, y: '@1', c: 3, d: '@1', f: '@2'},
                '@1': {value: '2015-04-26T20:39:35.208Z', '__meta__': 'date'},
                '@2': {g: '@1'}
            });

            expect(D.dump(obj, {serializer: dateSerializer})).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            var json = D.dump(obj, {serializer: dateSerializer});
            var restore = D.restore(json, {deserializer: dateDeserializer});
            expect(restore).to.be.eql(obj);
            expect(restore.y).to.be.equals(restore.d);
        });
    });

    describe('Custom serialization 2', function () {
        function Person (firstName, lastName) {
            this.firstName = firstName;
            this.lastName = lastName;

            Object.defineProperty(this, 'fullName', {
                get: function () {
                    return this.firstName + ' ' + this.lastName;
                },
                enumerable: true
            });
        }

        Person.prototype.toJSON = function () {
            return {
                data: {
                    firstName: this.firstName,
                    lastName: this.lastName
                },
                '__meta__': 'person'
            };
        };

        function personSerializer (key, value) {
            if (value instanceof Person) return value.toJSON();

            return value;
        }

        function personDeserializer (key, value) {

            if (value && value['__meta__'] === 'person') {
                return Object.freeze(new Person(value.data.firstName, value.data.lastName));
            }

            return value;
        }

        var mikeMouse = new Person('Mike', 'Mouse');
        var johnSnow = new Person('John', 'Snow');
        var obj = deepFreeze({m: mikeMouse, j: johnSnow, j2: johnSnow});

        it('Serialize custom object', function () {
            var dumpedObj = JSON.stringify({
                '@0': {m: '@1', j: '@2', j2: '@2'},
                '@1': {data: '@3', '__meta__': 'person'},
                '@2': {data: '@4', '__meta__': 'person'},
                '@3': {firstName: 'Mike', lastName: 'Mouse'},
                '@4': {firstName: 'John', lastName: 'Snow'}
            });

            expect(D.dump(obj, {serializer: personSerializer})).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            var json = D.dump(obj, {serializer: personSerializer});
            var restore = D.restore(json, {deserializer: personDeserializer});

            expect(restore.j).to.be.equals(restore.j2);
            expect(restore).to.be.eql(obj);
        });

        // TODO add tests for frozen objects and non writable
    });

    describe('Custom serialization 3', function () {
        var Rect = function (origin, size) {
            this.origin = origin;
            this.size = size;
        };

        var Point = function (x, y) {
            this.x = x;
            this.y = y;
        };

        var Size = function (width, height) {
            this.width = width;
            this.height = height;
        };

        var aRect = new Rect(new Point(0, 0), new Size(150, 150));
        var obj = deepFreeze({rect: aRect});

        function serializer (key, value) {
            if (value instanceof Rect)
                return {data: merge({}, value), '__meta__': 'rect'};

            if (value instanceof Point)
                return {data: merge({}, value), '__meta__': 'point'};

            if (value instanceof Size)
                return {data: merge({}, value), '__meta__': 'size'};

            return value;
        }

        function deserializer (key, value) {
            var d;
            if (value != null && value.data != null) {
                d = value.data;
                if (value['__meta__'] === 'rect') return new Rect(d.origin, d.size);
                if (value['__meta__'] === 'point') return new Point(d.x, d.y);
                if (value['__meta__'] === 'size') return new Size(d.width, d.height);
            }

            return value;
        }

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': {'rect': '@1'},
                '@1': {'data': '@2', '__meta__': 'rect'},
                '@2': {'origin': '@3', 'size': '@4'},
                '@3': {'data': '@5', '__meta__': 'point'},
                '@4': {'data': '@6', '__meta__': 'size'},
                '@5': {'x': 0, 'y': 0},
                '@6': {'width': 150, 'height': 150}
            });

            expect(D.dump(obj, {serializer: serializer})).to.be.eql(dumpedObj);
        });

        it('Restore', function () {
            var json = D.dump(obj, {serializer: serializer});
            expect(D.restore(json, {deserializer: deserializer})).to.be.eql(obj);
        });
    });

    describe('Custom serialization Map', function () {
        var key1 = Object.freeze({k: 1});
        var key2 = Object.freeze({k: 2});
        var val1 = Object.freeze({v: 1});
        var val2 = Object.freeze({v: 2});
        var map2 = new Map([['a', 1], ['b', '2']]);
        var map = new Map([[key1, val1], [key2, val2], ['k3', 1], ['k4', val1], ['m', map2]]);
        var obj = deepFreeze({data: map});

        function mapToJS (map) {
            var entry, iter;
            var data = [];

            iter = map.entries();

            while ((entry = iter.next()), !entry.done)
                data.push(entry.value);

            return {entries: data, '__meta__': 'Map'};
        }

        function mapSerializer (key, value) {
            if (value instanceof Map) return mapToJS(value);

            return value;
        }

        function mapDeserealizer (key, value) {
            if (value && value['__meta__'] === 'Map') {
                value.entries.forEach(function (entry) {
                    entry.forEach(function (prop, index) {
                        if (prop && prop['__meta__'] === 'Map')
                            entry[index] = new Map(prop.entries);
                    });
                });

                return new Map(value.entries);
            }
            return value;
        }

        it('Serialize', function () {
            var dumpedObj = JSON.stringify({
                '@0': {'data': '@1'},
                '@1': {'entries': '@2', '__meta__': 'Map'},
                '@2': ['@3', '@4', '@5', '@6', '@7'],
                '@3': ['@8', '@9'],
                '@4': ['@10', '@11'],
                '@5': ['k3', 1],
                '@6': ['k4', '@9'],
                '@7': ['m', '@12'],
                '@8': {'k': 1},
                '@9': {'v': 1},
                '@10': {'k': 2},
                '@11': {'v': 2},
                '@12': {'entries': '@13', '__meta__': 'Map'},
                '@13': ['@14', '@15'],
                '@14': ['a', 1],
                '@15': ['b', '2']
            });
            expect(D.dump(obj, {serializer: mapSerializer})).to.be.eql(dumpedObj);
        });

        // TODO deep comparision doesn't support maps. Need fix
        it('Restore', function () {
            var json = D.dump(obj, {serializer: mapSerializer});
            var restore = D.restore(json, {deserializer: mapDeserealizer});

            expect(restore).to.be.eql(obj);
        });
    });
});
