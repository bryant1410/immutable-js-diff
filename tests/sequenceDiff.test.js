'use strict';

var diff = require('../src/diff');
var Immutable = require('Immutable');
var JSC = require('jscheck');
var assert = require('assert');

describe('Sequence diff', function() {
  var failure = null;

  before(function () {
    JSC.on_report(function (report) {
      console.log(report);
    });

    JSC.on_fail(function (jsc_failure) {
      failure = jsc_failure;
    });
  });

  afterEach(function () {
    if(failure){
      console.error(failure);
      throw failure;
    }
  });

  it('check properties', function () {
    JSC.test(
      'returns [] when equal',
      function(veredict, array){
        var list1 = Immutable.fromJS(array);
        var list2 = Immutable.fromJS(array);

        var result = diff(list1, list2);

        return veredict(result.count() === 0);
      },
      [
        JSC.array(5, JSC.integer())
      ]
    );
  });

  it('returns add operation', function () {
    var list1 = Immutable.fromJS([1,2,3,4]);
    var list2 = Immutable.fromJS([1,2,3,4,5]);

    var result = diff(list1, list2);
    var expected = Immutable.fromJS([{op: 'add', path: '/4', value: 5}]);

    assert.ok(Immutable.is(result, expected));
  });

  it('returns remove operation', function () {
    var list1 = Immutable.fromJS([1,2,3,4]);
    var list2 = Immutable.fromJS([1,2,4]);

    var result = diff(list1, list2);
    var expected = Immutable.fromJS([{op: 'remove', path: '/2'}]);

    assert.ok(Immutable.is(result, expected));
  });

  it('returns add/remove operations', function () {
    var list1 = Immutable.fromJS([1,2,3,4]);
    var list2 = Immutable.fromJS([1,2,4,5]);

    var result = diff(list1, list2);
    var expected = Immutable.fromJS([
      {op: 'replace', path: '/2', value: 4},
      {op: 'replace', path: '/3', value: 5}
    ]);

    assert.ok(Immutable.is(result, expected));
  });

  it('JSCheck', function () {
    JSC.test(
      'returns add when value is inserted in the middle of sequence',
      function(veredict, array, addIdx, newValue){
        var list1 = Immutable.fromJS(array);
        var list2 = Immutable.fromJS(array);
        var modifiedList = list2.splice(addIdx, 0, newValue);

        var result = diff(list1, modifiedList);
        var expected = Immutable.fromJS([
          {op: 'add', path: '/'+addIdx, value: newValue}
        ]);

        return veredict(Immutable.is(result, expected));
      },
      [
        JSC.array(10, JSC.integer()),
        JSC.integer(0, 9),
        JSC.integer()
      ]
    );

    JSC.test(
      'returns remove',
      function(veredict, array, removeIdx){
        var list1 = Immutable.fromJS(array);
        var list2 = Immutable.fromJS(array);
        var modifiedList = list2.splice(removeIdx, 1);

        var result = diff(list1, modifiedList);
        var expected = Immutable.fromJS([
          {op: 'remove', path: '/'+removeIdx}
        ]);

        return veredict(Immutable.is(result, expected));
      },
      [
        JSC.array(10, JSC.integer()),
        JSC.integer(0, 9)
      ]
    );

    JSC.test(
      'returns sequential removes',
      function(veredict, array, nRemoves){
        var list1 = Immutable.fromJS(array);
        var list2 = Immutable.fromJS(array);
        var modifiedList = list2.skip(nRemoves);

        var result = diff(list1, modifiedList);
        var expected = Immutable.Repeat(Immutable.Map({op: 'remove', path: '/0'}), nRemoves);

        return veredict(Immutable.is(result, expected));
      },
      [
        JSC.array(10, JSC.integer()),
        JSC.integer(1, 5)
      ]
    );

    JSC.test(
      'returns replace operations',
      function(veredict, array, replaceIdx, newValue){
        var list1 = Immutable.fromJS(array);
        var list2 = Immutable.fromJS(array);
        var modifiedList = list2.set(replaceIdx, newValue);

        var result = diff(list1, modifiedList);
        var expected = Immutable.fromJS([
          {op: 'replace', path: '/'+replaceIdx, value: newValue}
        ]);

        return veredict(Immutable.is(result, expected));
      },
      [
        JSC.array(10, JSC.integer()),
        JSC.integer(0, 9),
        JSC.integer()
      ]
    );
  });
});