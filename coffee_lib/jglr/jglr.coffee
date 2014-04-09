###
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
###

async = require 'async'

jglogger =
  trace: (msg) ->
    return
  debug: (msg) ->
    return
  info: (msg) ->
    return
  warn: (msg) ->
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
      retArr.push(line.trim().split(","))
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
    jglogger.trace "jglr.registerCmd #{cmd}"
    if typeof @cmds[cmd] != 'undefined'
      jglogger.debug "replacing #{cmd} #{@cmds[cmd]}"
    @cmds[cmd] = callback

  _getNextBatch: () ->
    jglogger.trace 'jglr._getNextBatch'
    retArr = []

    while @batch.length > 0
      if(
        typeof @batch[0][0] == 'string' &&
        (
          @batch[0][0] == 'seq' ||
          @batch[0][0] == 'par' ||
          @batch[0][0] == 'wait'
        )
      )
        if @batch[0][0] != 'wait'
          @mode = @batch[0][0]
        jglogger.debug "ignore: #{@batch.splice(0,1)}"
        retArr.push(['noop'])
        break
      else if (@batch[0][0] == '')
        jglogger.debug "ignore: #{@batch.splice(0,1)}"
        retArr.push(['noop'])
      else
        nextline = @batch.splice(0,1)
        jglogger.debug "pushing: #{JSON.stringify(nextline[0])}"
        retArr.push(nextline[0])
      if @mode != 'par'
        break
    return retArr

  _doBatch: (bat, next) ->
    jglogger.trace "jglr._doBatch"
    async.each(
      bat,
      (command, done) =>
        if typeof @cmds[command[0]] == 'function'
          jglogger.info "jglr._doBatch: dispatch #{JSON.stringify(command)}"
          @cmds[command[0]](command, done)
        else
          jglogger.info "jglr._doBatch: no callback for #{command[0]}"
          done()
        return
      , (err) =>
        if err
          jglogger.debug err.message
        next(@batch.length > 0)
        return
    )
    return

  # next(hasNext): callback that gets called once all the commands finish
  #   hasNext [boolean]: true if there is still commands left in the batch
  dispatchNext: (next) ->
    jglogger.trace '-------- jglr.dispatchNext'
    nextBatch = @_getNextBatch()
    jglogger.debug "nextBatch = \n#{JSON.stringify(nextBatch,null,2)}"
    if !nextBatch
      next(false)
    else
      @_doBatch(nextBatch, next)
    return

  # done(err): callback when all batch process is done.
  #
  dispatch: (done) ->
    doNext = (hasNext) =>
      if hasNext
        @dispatchNext(doNext)
      else
        done()
    @dispatchNext(doNext)
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

