
/*
  @license
  crowdutil

  The MIT License (MIT)

  Copyright (c) 2014 Yasuhiro Okuno

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN crowdECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
 */

(function() {
  var Jglr, async, jglogger;

  async = require('async');

  jglogger = {
    trace: function(msg) {
      console.log(msg);
    },
    debug: function(msg) {
      console.log(msg);
    },
    info: function(msg) {
      console.log(msg);
    },
    warn: function(msg) {
      console.log(msg);
    },
    error: function(msg) {
      console.log(msg);
    },
    fatal: function(msg) {
      console.log(msg);
    }
  };

  Jglr = (function() {
    Jglr.prototype._loadFile = function(fn) {
      var content, fs, line, retArr, _i, _len;
      jglogger.trace('jglr._loadFile');
      retArr = [];
      fs = require('fs');
      content = fs.readFileSync(fn, 'utf-8');
      content = content.split("\n");
      for (_i = 0, _len = content.length; _i < _len; _i++) {
        line = content[_i];
        retArr.push(line.split(","));
      }
      return retArr;
    };

    Jglr.prototype.load = function(filename) {
      jglogger.trace('jglr.load');
      if (typeof filename === 'string') {
        this.filename = filename;
      }
      if (typeof this.filename === 'string') {
        jglogger.debug("opening " + this.filename);
        this.batch = this._loadFile(this.filename);
      } else {
        jglogger.error('no filename is passed');
      }
    };

    Jglr.prototype.registerCmd = function(cmd, callback) {
      jglogger.trace('jglr.registerCmd');
      if (typeof this.cmds[cmd] !== 'undefined') {
        jglogger.debug("replacing " + cmd + " " + this.cmds[cmd]);
      }
      return this.cmds[cmd] = callback;
    };

    Jglr.prototype._getNextBatch = function() {
      var next, retArr;
      jglogger.trace('jglr._getNextBatch');
      next = true;
      retArr = [];
      if (this.batch.length === 0) {
        return null;
      }
      if (this.mode === 'seq') {
        retArr.push(this.batch.pop());
      } else {
        while (this.batch.length > 0) {
          if (typeof this.batch[0][0] === string && (this.batch[0][0] === 'seq' || this.batch[0][0] === 'par' || this.batch[0][0] === 'wait')) {
            if (this.batch[0][0] !== 'wait') {
              this.mode = this.batch[0][0];
            }
            this.batch.pop();
            break;
          } else {
            retArr.push(this.batch.pop());
          }
        }
      }
      return retArr;
    };

    Jglr.prototype._doBatch = function(bat, next) {
      var self;
      jglogger.trace("jglr._doBatch");
      self = this;
      async.each(bat, function(command, done) {
        jglogger.debug(command);
        jglogger.debug(JSON.stringify(self.cmds, null, 2));
        if (typeof self.cmds[command[0]] === 'function') {
          self.cmds[command[0]](command, done);
        } else {
          jglogger.warn("no callback for " + command[0]);
          done();
        }
      }, function(err) {
        if (err) {
          jglogger.debug(err.message);
        }
        next(self.batch.length > 0);
      });
    };

    Jglr.prototype.dispatchNext = function(next) {
      var nextBatch;
      jglogger.trace('jglr.dispatchNext');
      nextBatch = this._getNextBatch();
      if (!nextBatch) {
        next(false);
      } else {
        this._doBatch(nextBatch, next);
      }
    };

    function Jglr(opts) {
      this.filename = "";
      this.mode = 'seq';
      this.cmds = {};
      this.batch = [];
      if (typeof opts === 'object') {
        if (typeof opts.filename === 'string') {
          this.filename = opts.filename;
        }
        if (typeof opts.logger === 'object') {
          jglogger = opts.logger;
        }
        if (typeof opts.mode === 'string') {
          this.mode = opts.mode;
        }
      }
      jglogger.trace('jglr.new');
      return;
    }

    return Jglr;

  })();

  exports.Jglr = Jglr;


  /*
  Jglr = require 'Jglr'
  
  jglr = new Jglr.Jglr(filename)
  
  jglr.load()
  
  jglr.registerCmd(
    'run',
    (argv, done) ->
      console.log argv
      setTimeout(() ->
        done()
      , 100
      )
      return
  )
  
  myNext = (hasNext) ->
    if hasNext
      jglr.dispatchNext(myNext)
  
  jglr.dispatchNext(myNext)
   */

}).call(this);
