
/*
  @license
  crowdutil
  Copyright (c) 2014, Yasuhiro Okuno (Koma)
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.

  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
  var Jglr, async, jglogger;

  async = require('async');

  jglogger = {
    trace: function(msg) {},
    debug: function(msg) {},
    info: function(msg) {},
    warn: function(msg) {},
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
        retArr.push(line.trim().split(","));
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
      jglogger.trace("jglr.registerCmd " + cmd);
      if (typeof this.cmds[cmd] !== 'undefined') {
        jglogger.debug("replacing " + cmd + " " + this.cmds[cmd]);
      }
      return this.cmds[cmd] = callback;
    };

    Jglr.prototype._getNextBatch = function() {
      var nextline, retArr;
      jglogger.trace('jglr._getNextBatch');
      retArr = [];
      while (this.batch.length > 0) {
        if (typeof this.batch[0][0] === 'string' && (this.batch[0][0] === 'seq' || this.batch[0][0] === 'par' || this.batch[0][0] === 'wait')) {
          if (this.batch[0][0] !== 'wait') {
            this.mode = this.batch[0][0];
          }
          jglogger.debug("ignore: " + (this.batch.splice(0, 1)));
          retArr.push(['noop']);
          break;
        } else if (this.batch[0][0] === '') {
          jglogger.debug("ignore: " + (this.batch.splice(0, 1)));
          retArr.push(['noop']);
        } else {
          nextline = this.batch.splice(0, 1);
          jglogger.debug("pushing: " + (JSON.stringify(nextline[0])));
          retArr.push(nextline[0]);
        }
        if (this.mode !== 'par') {
          break;
        }
      }
      return retArr;
    };

    Jglr.prototype._doBatch = function(bat, next) {
      jglogger.trace("jglr._doBatch");
      async.each(bat, (function(_this) {
        return function(command, done) {
          if (typeof _this.cmds[command[0]] === 'function') {
            jglogger.info("jglr._doBatch: dispatch " + (JSON.stringify(command)));
            _this.cmds[command[0]](command, done);
          } else {
            jglogger.info("jglr._doBatch: no callback for " + command[0]);
            done();
          }
        };
      })(this), (function(_this) {
        return function(err) {
          if (err) {
            next(_this.batch.length > 0, err);
          } else {
            next(_this.batch.length > 0);
          }
        };
      })(this));
    };

    Jglr.prototype.dispatchNext = function(next) {
      var nextBatch;
      jglogger.trace('-------- jglr.dispatchNext');
      nextBatch = this._getNextBatch();
      jglogger.debug("nextBatch = \n" + (JSON.stringify(nextBatch, null, 2)));
      if (!nextBatch) {
        next(false);
      } else {
        this._doBatch(nextBatch, next);
      }
    };

    Jglr.prototype.dispatch = function(done, haltOnErr) {
      var doNext;
      doNext = (function(_this) {
        return function(hasNext, err) {
          if (err) {
            jglogger.error("jglr.dispatch: error!");
            if (haltOnErr) {
              done(err);
              return;
            } else {
              jglogger.error("jglr.dispatch: " + err.message);
            }
          }
          if (hasNext) {
            return _this.dispatchNext(doNext);
          } else {
            return done();
          }
        };
      })(this);
      this.dispatchNext(doNext);
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
