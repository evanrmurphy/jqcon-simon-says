define([
  'flight/component',
  'game-board',
  'alert'
],
function (
  defineComponent,
  GameBoard,
  Alert
) {
  'use strict';

  function Game() {
    this.defaultAttrs({
      gameBoardSelector: '.game-board',
      startButtonSelector: '.game-controls .start',
      levelSelector: '.game-controls .level',
      colors: ['red', 'blue', 'yellow', 'green'],
      level: 1,
      levelDelta: 2,
      sequenceDelay: 1000
    });

    this.after('initialize', function () {
      var level = this.attr.level;

      GameBoard.attachTo(this.$node.find(this.attr.gameBoardSelector), {
        colors: this.attr.colors.slice()
      });
      Alert.attachTo('.alert');

      var startClicks =
        this.$node.find(this.attr.startButtonSelector).
        asEventStream('click').
        map('start');
      startClicks.log('startClicks');

      var activations =
        $(document).asEventStream('activation', function (e, data) {
          return e.target !== this.node ? data.color : null;
        }.bind(this)).
        filter(function (val) {
          return val !== null;
        });
      activations.log('activations');

      function randomSample(count, source) {
        var result = [];

        for (var i = 0; i < count; i++) {
          result.push(source[Math.floor(Math.random() * source.length)]);
        }

        return result;
      }

      var gameOngoing = false;

      startClicks.onValue(function () {
        if (!gameOngoing) startGame();
      })

      function startGame() {
        gameOngoing = true;

        var seqLength = level + this.attr.levelDelta;
        var simonSays = randomSample(seqLength, this.attr.colors);

        function concat(a, b) { return a.concat(b); }
        playerSaysProperty = activations.scan([], concat);

        function evaluatePlay(playerSays) {
          var expected = simonSays.slice(0, playerSays.length);
          var isCorrect = _.isEqual(playerSays, expected);
          var doneSaying = playerSays.length === simonSays.length;

          if (!isCorrect) lose();
          if (isCorrect && doneSaying) win();
        }

        playerSaysProperty.onValue(evaluatePlay);
      }

      function bumpLevel() {
        level++;
        this.$node.find(this.attr.levelSelector).text('Level ' + level);
      }

      function win() {
        gameOngoing = false;
        bumpLevel();
        // show "Correct!" message
      }

      function lose() {
        gameOngoing = false;
        // show "Wrong" message
      }
    });
  }

  return defineComponent(Game);
});
