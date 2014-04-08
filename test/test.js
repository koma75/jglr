
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
  var Jglr, initLogger, log4js, start, test001;

  Jglr = require('../lib/jglr/jglr');

  log4js = require('log4js');

  initLogger = function() {
    var logConfig;
    logConfig = {
      appenders: [
        {
          type: 'file',
          filename: './jglrtest.log',
          maxLogSize: 204800,
          backups: 2,
          category: 'jglrtest'
        }, {
          type: 'console',
          category: 'jglrtest'
        }
      ],
      replaceConsole: true
    };
    log4js.configure(logConfig);
    global.logger = log4js.getLogger('jglrtest');
    logger.setLevel('TRACE');
    logger.debug("logger : " + logger.constructor);
  };

  test001 = function() {
    var jglr, myNext;
    jglr = new Jglr.Jglr({
      'logger': global.logger
    });
    jglr.load('./test/test001.jgl');
    logger.debug(jglr);
    jglr.registerCmd('cmd1', function(command, done) {
      logger.info("test001: running " + (JSON.stringify(command)));
      return setTimeout(function() {
        logger.info("---test001: cmd1 DONE");
        return done();
      }, 500);
    });
    jglr.registerCmd('cmd2', function(command, done) {
      logger.info("test001: running " + (JSON.stringify(command)));
      return setTimeout(function() {
        logger.info("---test001: cmd2 DONE");
        return done();
      }, 400);
    });
    jglr.registerCmd('cmd3', function(command, done) {
      logger.info("test001: running " + (JSON.stringify(command)));
      return setTimeout(function() {
        logger.info("---test001: cmd3 DONE");
        return done();
      }, 300);
    });
    jglr.registerCmd('cmd4', function(command, done) {
      logger.info("test001: running " + (JSON.stringify(command)));
      return setTimeout(function() {
        logger.info("---test001: cmd4 DONE");
        return done();
      }, 200);
    });
    jglr.registerCmd('cmd5', function(command, done) {
      logger.info("test001: running " + (JSON.stringify(command)));
      return setTimeout(function() {
        logger.info("---test001: cmd5 DONE");
        return done();
      }, 100);
    });
    myNext = function(hasNext) {
      if (hasNext) {
        jglr.dispatchNext(myNext);
      }
    };
    return jglr.dispatchNext(myNext);
  };

  start = function() {
    initLogger();
    logger.info("==================test start======================");
    logger.info("start test: test001");
    return test001();
  };

  start();

}).call(this);
