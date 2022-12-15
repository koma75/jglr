jglr 
========================================================================

**NO LONGER MAINTAINED**

About
------------------------------------------------------------------------

jglr /ˈdʒʌɡlər/

simple asynchronous batch-file processing framework

### Versions

Date        | Version   | Changes
:--         | --:       | :--
2014.04.12  | 0.3.1     | Fix Documentation
2014.04.12  | 0.3.0     | Added Jglr.setLimit() and parallel execution limit
            |           | Added Error handling support
2014.04.08  | 0.2.0     | Added Jglr.dispatch()
            |           | fix for README.
2014.04.08  | 0.1.1     | maintenance fix release
            |           | fix for README.
2014.04.08  | 0.1.0     | Initial release

Usage
------------------------------------------------------------------------

### Installation

~~~Shell
npm install jglr
~~~

### basic usage

~~~javascript
var Jglr = require('jglr');
var jglr, myNext;

jglr = new Jglr.Jglr();

// load the batch file (csv format)
jglr.load('path/to/batch/batch.csv');

// register 
jglr.registerCmd('cmd1', function(command, done) {
  // callback to execute when cmd1 is dispatched
  return setTimeout(function() {
    // done() callback MUST BE called once this command has finished
    return done();
  }, 500);
});
jglr.registerCmd('cmd2', function(command, done) {
  // callback to execute when cmd2 is dispatched
  return setTimeout(function() {
    return done();
  }, 400);
});

// setup the callback for NEXT
myNext = function(hasNext, err) {
  if (err) {
    // do whatever with error. i.e. stop execution.
    console.log("error: " + err.message());
  }
  if (hasNext) {
    jglr.dispatchNext(myNext);
  }
};

// dispatch
jglr.dispatchNext(myNext);

~~~

#### new Jglr(opts)

* description
    * create jglr instance
* params
    * opts [Object]: hash object to initialize with.
        * filename [String], (null): path to batch file.
        * logger [Object], (null): log4js logger object to use. if ommitted, 
          console will be used for error reports.
        * mode [String], ("seq"): initial mode of either "seq" or "par"
        * parLimit [Integer], (10): initial parallel execution limit

#### jglr.load(filename)

* description
    * load the batch file into memory and create a batch dispatch queue.
* params
    * filename [String]: path to batch file to load
        * if ommited, it will try to use whatever path that was
          previousely loaded, or path passed through the constructor

#### jglr.registerCmd(cmdname, callback)

* description
    * register callbacks to commands
* params
    * cmdname [String]: command name to hook to
    * callback [Function]: function(params, done)
        * params is an array of parameters written in the batch including
          the command name itself.
        * done(err) is the callback to call when the command is done.
            * if Error object is passed to err, the err will be propagated
              to the next callback of jglr.dispatchNext.  If jglr.dispatch
              was used, and haltOnErr was set, the batch execution will
              halt and done callback of jglr.dispatch will be called.
              In that case, the rest of the batch file will not be executed.
            * You can choose to continue the execution of the batch file
              by calling jglr.dispatchNext.

#### jglr.dispatchNext(next)

* description
    * dispatch the next set of commands in the batch file
* params
    * next [Function]: function(hasNext, err)
        * hasNext [Boolean]: true if there are still commands left to execute.
          false if it has reached end of batch file.
        * err [Error]: error object passed from the last batch execution

#### jglr.dispatch(done, haltOnErr)

* description
    * dispatch the batch and recieve done callback when all batch is done.
* params
    * done [Function]: function(err)
        * err [Object]: null if successful. Error object if there was an
          error
    * haltOnErr [Boolean]: if true, the execution will halt as error
      is set on error.

~~~javascript
var isDone = function(err) {
  if(err) {
    console.log("halted execution: " + err.message);
  } else {
    console.log("finished my batch!");
  }
};

// dispatch.  Halt on any error encountered in a batch.
jglr.dispatch(isDone, true);
~~~

#### jglr.setLimit(limit)

* description
    * set the number of maximum dispatch at any time in parallel mode.
* params
    * limit [number], (10): number to set in string format or an integer.
        * if the value is invalid, it will be ignored.

### batch file format

Batch file is a csv where the first collum is the command name to execute
and all following collums are parameters passed to the command.

Jglr will dispatch commands in the order it is written.  If the mode is 
set to parallel mode, dispatcher will dispatch all the commands in parallel
until it encounters one of the reserved commands (except noop), or reach
the end of file.

Each time the execution is interrupted by the reserved command or end of file,
the next(hasNext) callback will be called.  If hasNext is true, you can
call dispatchNext(next) again recursively to dispatch the next set of 
commands.

~~~
seq
<cmd1>,<param1>,<param2>,<param3>
<cmd2>,<param1>,<param2>,<param3>
<cmd3>,<param1>,<param2>,<param3>
par
<cmd4>,<param1>,<param2>,<param3>
<cmd5>,<param1>,<param2>,<param3>
<cmd6>,<param1>,<param2>,<param3>
wait
<cmd7>,<param1>,<param2>,<param3>
<cmd8>,<param1>,<param2>,<param3>
~~~

With the above example, cmd1 ~ cmd3 will be executed sequentially, then 
cmd4 through cmd6 will be dispatched all at once.  After cmd4 through cmd6
is finished, cmd7 and cmd8 will be dispatched at once. After all commands
are executed, next callback will be called with hasNext = false.

#### reserved commands

certain commands are reserved for special purposes

##### wait

If the batch command __wait__ is called, the dispatcher will wait for all 
currently executing commands.

Useful for syncing in the middle of a batch file to make sure certain 
commands are done before proceeding

Any callbacks to this command name will be ignored.

##### seq

If the batch command __seq__ is called, the dispatcher will wait for all 
currently executing commands and turn into sequential execution mode.

All following commands will be executed sequentially, until __par__ is
executed

Any callbacks to this command name will be ignored.

##### par

If the batch command __par__ is called, the dispatcher will wait for all 
currently executing commands and turn into parallel execution mode.

All following commands will be executed in parallel, until __seq__ is
executed.

par can take a second argument to set the maximum number of parallel
executions at any time.  The default is 10. (same as setLimit method)

Any callbacks to this command name will be ignored.

~~~
par,3
cmd1
cmd2
cmd3
cmd4
cmd5
cmd6
~~~

With the above example, first three commands cmd1, cmd2, cmd3 will be
dispatched immediately, and all following commands will be dispatched
as previouse commands finish execution, and maintain the parallelism
of command to 3.

##### noop

Will be inserted in place of an empty line or any of the other reserved
commands mentioned above.  Also will be executed once at the end of file.

You can register callbacks to noop to override noops (i.e. debug purposes).
Although you cannot intentionally pass parameters to noop via the reserved
commands (reserved commands will be called as noop with no parameters).

Known issues & bugs
------------------------------------------------------------------------

* batch file is read at once.  Jglr cannot process extremely large files.
* There is a limit to the number of recursions if used with callbacks
  that are not asynchronous.
    * when calling the done() callback, make sure that it is not directly 
      called back from the command callback.
    * if necessary, use setTimeout() with 0 millisecond timeout to call the
      done callback to avoid over-recursion. i.e. setTimeout(done,0)

~~~javascript
jglr.registerCmd('cmd1', function(command, done) {
  if(!paramCheck(command)) {
    // Parameter Error.  
    // make sure done is called asynchronousely
    setTimeout(function() {
      done(new Error("invalid command parameter!"));
    }, 0);
  } else {
    // execute the command and call done()
  }
});
~~~

License
------------------------------------------------------------------------

Copyright (c) 2014, Yasuhiro Okuno (Koma)
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

