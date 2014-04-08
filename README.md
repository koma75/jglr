jglr
========================================================================

About
------------------------------------------------------------------------

simple asynchronous batch-file processing framework

### Versions

Date        | Version   | Changes
:--         | --:       | :--
2014.04.08  | 0.1.0     | Initial release

Usage
------------------------------------------------------------------------

### Installation

~~~Shell
npm install jglr
~~~

### basic usage

~~~javascript
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
myNext = function(hasNext) {
  if (hasNext) {
    jglr.dispatchNext(myNext);
  }
};

// dispatch
jglr.dispatchNext(myNext);

~~~

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

#### reserved commands

certain commands are reserved for special purposes

##### wait

If the batch command __wait__ is called, the dispatcher will wait for all 
currently executing commands.

Useful for syncing in the middle of a batch file to make sure certain 
commands are done before proceeding

##### seq

If the batch command __seq__ is called, the dispatcher will wait for all 
currently executing commands and turn into sequential execution mode.

All following commands will be executed sequentially, until __par__ is
executed

##### par

If the batch command __par__ is called, the dispatcher will wait for all 
currently executing commands and turn into parallel execution mode.

All following commands will be executed in parallel, until __seq__ is
executed.

##### noop

Will be inserted in place of an empty line or any of the other reserved
commands mentioned above.

You can register callbacks to noop to override noops (i.e. for debug purposes)

Known issues & bugs
------------------------------------------------------------------------

* batch file is read at once.  Jglr cannot process extremely large files.
* There maybe a limit to the number of recursions if used with callbacks
  that are not asynchronous.

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

