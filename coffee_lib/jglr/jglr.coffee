###
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
###

async = require 'async'

jglogger =
  trace: (msg) ->
    console.log msg
    return
  debug: (msg) ->
    console.log msg
    return
  info: (msg) ->
    console.log msg
    return
  warn: (msg) ->
    console.log msg
    return
  error: (msg) ->
    console.log msg
    return
  fatal: (msg) ->
    console.log msg
    return

class Jglr
  _loadFile: (fn) ->
    jglogger.trace 'jglr._loadFile'
    retArr = []
    fs = require 'fs'
    content = fs.readFileSync(fn, 'utf-8')
    content = content.split("\n")
    for line in content
      retArr.push(line.split(","))
    return retArr

  # load the file specified by the constructor, or this command
  load: (filename) ->
    jglogger.trace 'jglr.load'
    # replace filename if given
    if typeof filename == 'string'
      @filename = filename

    # Open the file
    if typeof @filename == 'string'
      jglogger.debug "opening #{@filename}"
      @batch = @_loadFile(@filename)
    else
      jglogger.error 'no filename is passed'
    return

  # cmd [String]: command name to parse
  # callback(command, done)
  #   command [Array]: array of argument strings
  #   done() [Func]: needs to be called once the command is done
  registerCmd: (cmd, callback) ->
    jglogger.trace 'jglr.registerCmd'
    if typeof @cmds[cmd] != 'undefined'
      jglogger.debug "replacing #{cmd} #{@cmds[cmd]}"
    @cmds[cmd] = callback

  _getNextBatch: () ->
    jglogger.trace 'jglr._getNextBatch'
    next = true
    retArr = []
    if @batch.length == 0
      return null

    if @mode == 'seq'
      retArr.push(@batch.pop())
    else
      while @batch.length > 0
        if(
          typeof @batch[0][0] == string &&
          (
            @batch[0][0] == 'seq' ||
            @batch[0][0] == 'par' ||
            @batch[0][0] == 'wait'
          )
        )
          if @batch[0][0] != 'wait'
            @mode = @batch[0][0]
          @batch.pop()
          break
        else
          retArr.push(@batch.pop())
    return retArr

  _doBatch: (bat, next) ->
    jglogger.trace "jglr._doBatch"
    self = @
    async.each(
      bat,
      (command, done) ->
        jglogger.debug command
        jglogger.debug(JSON.stringify(self.cmds, null, 2))
        if typeof self.cmds[command[0]] == 'function'
          self.cmds[command[0]](command, done)
        else
          jglogger.warn "no callback for #{command[0]}"
          done()
        return
      , (err) ->
        if err
          jglogger.debug err.message
        next(self.batch.length > 0)
        return
    )
    return

  # next(hasNext): callback that gets called once all the commands finish
  #   hasNext [boolean]: true if there is still commands left in the batch
  dispatchNext: (next) ->
    jglogger.trace 'jglr.dispatchNext'
    nextBatch = @_getNextBatch()
    if !nextBatch
      next(false)
    else
      @_doBatch(nextBatch, next)
    return

  # Jglr constructor
  constructor: (opts) ->
    # default values
    @filename = ""
    @mode = 'seq'
    @cmds = {}
    @batch = []
    if typeof opts == 'object'
      if typeof opts.filename == 'string'
        @filename = opts.filename
      if typeof opts.logger == 'object'
        jglogger = opts.logger
      if typeof opts.mode == 'string'
        @mode = opts.mode
    jglogger.trace 'jglr.new'
    return

exports.Jglr = Jglr

###
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

###

