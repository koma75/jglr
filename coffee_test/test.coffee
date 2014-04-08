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

Jglr = require '../lib/jglr/jglr'
log4js = require 'log4js'

initLogger = () ->
  logConfig =
    appenders: [
      {
        type: 'file'
        filename: './jglrtest.log'
        maxLogSize: 204800
        backups: 2
        category: 'jglrtest'
      }
      {
        type: 'console'
        category: 'jglrtest'
      }
    ]
    replaceConsole: true

  log4js.configure(logConfig)
  global.logger = log4js.getLogger('jglrtest')
  logger.setLevel('TRACE')
  logger.debug "logger : #{logger.constructor}"
  return

test001 = (callback) ->
  jglr = new Jglr.Jglr({
    'logger': global.logger
  })
  jglr.load('./test/test001.jgl')
  logger.debug jglr

  # setup commands
  jglr.registerCmd(
    'cmd1',
    (command, done) ->
      logger.info "test001: running #{JSON.stringify(command)}"
      setTimeout(
        () ->
          logger.info "---test001: cmd1 DONE"
          done()
        ,0
      )
  )

  # run!
  myNext = (hasNext) ->
    if hasNext
      jglr.dispatchNext(myNext)
    else if typeof callback == 'function'
      callback()
    return
  jglr.dispatchNext(myNext)

test002 = (callback) ->
  jglr = new Jglr.Jglr({
    'logger': global.logger
  })
  jglr.load('./test/test002.jgl')
  logger.debug jglr

  resultArr = []

  # setup commands
  jglr.registerCmd(
    'cmd1',
    (command, done) ->
      logger.info "test001: running #{JSON.stringify(command)}"
      setTimeout(
        () ->
          logger.info "---test001: cmd1 DONE"
          resultArr.push(1)
          done()
        ,500
      )
  )
  jglr.registerCmd(
    'cmd2',
    (command, done) ->
      logger.info "test001: running #{JSON.stringify(command)}"
      setTimeout(
        () ->
          logger.info "---test001: cmd2 DONE"
          resultArr.push(2)
          done()
        ,400
      )
  )
  jglr.registerCmd(
    'cmd3',
    (command, done) ->
      logger.info "test001: running #{JSON.stringify(command)}"
      setTimeout(
        () ->
          logger.info "---test001: cmd3 DONE"
          resultArr.push(3)
          done()
        ,300
      )
  )
  jglr.registerCmd(
    'cmd4',
    (command, done) ->
      logger.info "test001: running #{JSON.stringify(command)}"
      setTimeout(
        () ->
          logger.info "---test001: cmd4 DONE"
          resultArr.push(4)
          done()
        ,200
      )
  )
  jglr.registerCmd(
    'cmd5',
    (command, done) ->
      logger.info "test001: running #{JSON.stringify(command)}"
      setTimeout(
        () ->
          logger.info "---test001: cmd5 DONE"
          resultArr.push(5)
          done()
        ,100
      )
  )
  
  answer = [ 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 1, 2, 3 ]

  # run!
  myNext = (hasNext) ->
    if hasNext
      jglr.dispatchNext(myNext)
    else if typeof callback == 'function'
      logger.info JSON.stringify(resultArr)
      if JSON.stringify(resultArr) != JSON.stringify(answer)
        throw new Error "execution order not correct!"
      callback()
    return
  jglr.dispatchNext(myNext)

start = () ->
  initLogger()
  logger.info "==================test start======================"
  logger.info "start test: test001"
  stack = [
    test001,
    test002
  ]

  logger.debug "stack = \n#{stack}"

  count = 0

  doNext = () ->
    if stack.length <= count
      logger.info "TEST DONE"
    else
      stack[count](doNext)
      count++
    return

  doNext()

start()

