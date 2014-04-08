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
(function(){var a,b,c;b=require("async"),c={trace:function(){},debug:function(){},info:function(){},warn:function(){},error:function(a){console.log(a)},fatal:function(a){console.log(a)}},a=function(){function a(a){this.filename="",this.mode="seq",this.cmds={},this.batch=[],"object"==typeof a&&("string"==typeof a.filename&&(this.filename=a.filename),"object"==typeof a.logger&&(c=a.logger),"string"==typeof a.mode&&(this.mode=a.mode)),c.trace("jglr.new")}return a.prototype._loadFile=function(a){var b,d,e,f,g,h;for(c.trace("jglr._loadFile"),f=[],d=require("fs"),b=d.readFileSync(a,"utf-8"),b=b.split("\n"),g=0,h=b.length;h>g;g++)e=b[g],f.push(e.trim().split(","));return f},a.prototype.load=function(a){c.trace("jglr.load"),"string"==typeof a&&(this.filename=a),"string"==typeof this.filename?(c.debug("opening "+this.filename),this.batch=this._loadFile(this.filename)):c.error("no filename is passed")},a.prototype.registerCmd=function(a,b){return c.trace("jglr.registerCmd "+a),"undefined"!=typeof this.cmds[a]&&c.debug("replacing "+a+" "+this.cmds[a]),this.cmds[a]=b},a.prototype._getNextBatch=function(){var a,b;for(c.trace("jglr._getNextBatch"),b=[];this.batch.length>0;){if("string"==typeof this.batch[0][0]&&("seq"===this.batch[0][0]||"par"===this.batch[0][0]||"wait"===this.batch[0][0])){"wait"!==this.batch[0][0]&&(this.mode=this.batch[0][0]),c.debug("ignore: "+this.batch.splice(0,1)),b.push(["noop"]);break}if(""===this.batch[0][0]?(c.debug("ignore: "+this.batch.splice(0,1)),b.push(["noop"])):(a=this.batch.splice(0,1),c.debug("pushing: "+JSON.stringify(a[0])),b.push(a[0])),"seq"===this.mode)break}return b},a.prototype._doBatch=function(a,d){var e;c.trace("jglr._doBatch"),e=this,b.each(a,function(a,b){"function"==typeof e.cmds[a[0]]?(c.info("jglr._doBatch: dispatch "+JSON.stringify(a)),e.cmds[a[0]](a,b)):(c.info("jglr._doBatch: no callback for "+a[0]),b())},function(a){a&&c.debug(a.message),d(e.batch.length>0)})},a.prototype.dispatchNext=function(a){var b;c.trace("-------- jglr.dispatchNext"),b=this._getNextBatch(),c.debug("nextBatch = \n"+JSON.stringify(b,null,2)),b?this._doBatch(b,a):a(!1)},a}(),exports.Jglr=a}).call(this);