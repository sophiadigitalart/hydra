/* eslint-disable no-eval */
var CodeMirror = require('codemirror/lib/codemirror')
require('codemirror/mode/javascript/javascript')
require('codemirror/addon/hint/javascript-hint')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/selection/mark-selection')

var isShowing = true

var EditorClass = function () {
  var self = this

  this.cm = CodeMirror.fromTextArea(document.getElementById('code'), {
    theme: 'tomorrow-night-eighties',
    value: 'hello',
    mode: {name: 'javascript', globalVars: true},
    lineWrapping: true,
    styleSelectedText: true,
    extraKeys: {
      'Shift-Ctrl-Enter': function (instance) {
          self.evalAll((code, error) => {
            console.log('evaluated', code, error)
            // if(!error){
            //   self.saveSketch(code)
            // }
          })
      },
      'Shift-Ctrl-G': function (instance) {
        self.shareSketch()
      },
      'Shift-Ctrl-H': function (instance) {
        var l = document.getElementsByClassName('CodeMirror-scroll')[0]
        var m = document.getElementById('modal-header')
        if (isShowing) {
          l.style.opacity = 0
          self.logElement.style.opacity  = 0
          m.style.opacity = 0
          isShowing = false
        } else {
          l.style.opacity= 1
          m.style.opacity = 1
          self.logElement.style.opacity  = 1
          isShowing = true
        }
      },
      'Ctrl-Enter': function (instance) {
        var c = instance.getCursor()
        var s = instance.getLine(c.line)
        self.eval(s)
      },
      'Shift-Ctrl-W': function (instance) {

      },
      'Ctrl-Space': function (instance) {
        var text = self.autoComplete(instance)
        console.log('autocomp', text)
      },
      'Shift-Ctrl-S': function (instance) {
        screencap()
      },
      'Alt-E': function (instance) {
        wssend()
      },
      'Alt-S': function (instance) {
        webrtcsend()
      },
      'Alt-M': (instance) => {
        self.midi()
      },
      'Alt-Enter': (instance) => {
        var text = self.selectCurrentBlock(instance)
        console.log('text', text)
        self.eval(text.text)
      }
    }
  })
  // midi begin
  EditorClass.prototype.midi = function () {
    console.log(`midi setup`)
    // register WebMIDI
    navigator.requestMIDIAccess()
    .then(onMIDISuccess, onMIDIFailure);
    
    function onMIDISuccess(midiAccess) {
      console.log(`midiAccess: ${JSON.stringify(midiAccess)}`)
      var inputs = midiAccess.inputs;
      var outputs = midiAccess.outputs;
      for (var input of midiAccess.inputs.values()){
          input.onmidimessage = getMIDIMessage;
      }
    }
    
    function onMIDIFailure() {
      console.log('Could not access your MIDI devices.');
    }
    
    //create an array to hold our cc values and init to a normalized value
    window.cc=Array(128).fill(0.5)
    
    getMIDIMessage = function(midiMessage) {
      var arr = midiMessage.data    
      var index = arr[1]
      var val = (arr[2]+1)/128.0  // normalize CC values to 0.0 - 1.0
      console.log('Midi received on cc#' + index + ' value:' + val)    // uncomment to monitor incoming Midi
      window.cc[index]=val
    }
  }
  // midi end
  this.cm.markText({line: 0, ch: 0}, {line: 6, ch: 42}, {className: 'styled-background'})
  this.cm.refresh()
  this.logElement = document.createElement('div')
  this.logElement.className = "console cm-s-tomorrow-night-eighties"
  document.body.appendChild(this.logElement)
  this.log("hi")


  // TO DO: add show code param
  let searchParams = new URLSearchParams(window.location.search)
  let showCode = searchParams.get('show-code')

    if(showCode == "false") {
      console.log("not showing code")
      var l = document.getElementsByClassName('CodeMirror-scroll')[0]
      l.style.display = 'none'
      self.logElement.style.display = 'none'
      isShowing = false
    }
  //}
}

EditorClass.prototype.clear = function () {
  this.cm.setValue('\n \n // Type some code on a new line (such as "osc().out()"), and press CTRL+shift+enter')
}

EditorClass.prototype.saveSketch = function(code) {
  console.log('no function for save sketch has been implemented')
}

EditorClass.prototype.shareSketch = function(code) {
  console.log('no function for share sketch has been implemented')
}

// EditorClass.prototype.saveExample = function(code) {
//   console.log('no function for save example has been implemented')
// }

EditorClass.prototype.evalAll = function (callback) {
  this.eval(this.cm.getValue(), function (code, error){
    if(callback) callback(code, error)
  })
}

EditorClass.prototype.eval = function (arg, callback) {
  var self = this
  var jsString = arg
  var isError = false
  try {
    eval(jsString)
    //self.log(jsString)
    self.log("Compiles Ok!")
  } catch (e) {
    isError = true
  //  console.log("logging", e.message)
    self.log(e.message, "log-error")
    //console.log('ERROR', JSON.stringify(e))
  }
//  console.log('callback is', callback)
  if(callback) callback(jsString, isError)

}

EditorClass.prototype.log = function(msg, className = "") {
  this.logElement.innerHTML =` >> <span class=${className}> ${msg} </span> `
}

EditorClass.prototype.selectCurrentBlock = function (editor) { // thanks to graham wakefield + gibber
  var pos = editor.getCursor()
  var startline = pos.line
  var endline = pos.line
  while (startline > 0 && editor.getLine(startline) !== '') {
    startline--
  }
  while (endline < editor.lineCount() && editor.getLine(endline) !== '') {
    endline++
  }
  var pos1 = {
    line: startline,
    ch: 0
  }
  var pos2 = {
    line: endline,
    ch: 0
  }
  var str = editor.getRange(pos1, pos2)
  return {
    start: pos1,
    end: pos2,
    text: str
  }
}

EditorClass.prototype.autoComplete = function (editor) { // thanks to graham wakefield + gibber
  var pos = editor.getCursor()
  var startline = pos.line
  var pos1 = {
    line: pos.line,
    ch: pos.ch - 1
  }
  var pos2 = {
    line: pos.line,
    ch: pos.ch
  }
  var str = editor.getRange(pos1, pos2)
  switch (str) {
    case '2':
      editor.replaceRange('vec2 vv = vec2(0.0, 0.0);', pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 6;
      editor.setSelection(pos1, pos2)
      break;
    case '3':
      editor.replaceRange('vec3 vvv = vec3(0.0, 0.0, 0.0);', pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    case '4':
      editor.replaceRange('vec4 vvvv = vec4(0.0, 0.0, 0.0, 0.0);', pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 8;
      editor.setSelection(pos1, pos2)
      break;
    case '1':
      editor.replaceRange('float f = 0.0;', pos1, pos2)
      pos1.ch += 6;
      pos2.ch += 6;
      editor.setSelection(pos1, pos2)
      break;
    case '{':
      editor.replaceRange(`{;}`, pos1, pos2)
      break;
    case '(':
      editor.replaceRange(`()`, pos1, pos2)
      break;
    // functions
    case 'f':
      editor.replaceRange(`float fcf(in vec3 pos) {float f = 0.0;return f;}`, pos1, pos2)
      pos1.ch += 6;
      pos2.ch += 8;
      editor.setSelection(pos1, pos2)
      break;
    case 'g':
      editor.replaceRange(`vec2 fc2(in vec3 pos) {vec2 vv = vec2(0.0, 0.0);return vv;}`, pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    case 'h':
      editor.replaceRange(`vec3 fc3(in vec3 pos) {vec3 vvv = vec3(0.0, 0.0, 0.0);return vvv;}`, pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    case 'j':
      editor.replaceRange(`vec4 fc4(in vec3 pos) {vec4 vvvv = vec4(0.0, 0.0, 0.0, 0.0);return vvvv;}`, pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    // hydra functions
    case 't':
      editor.replaceRange(`() => Math.sin(time) * 1.0`, pos1, pos2)
      pos1.ch += 23;
      pos2.ch += 23;
      editor.setSelection(pos1, pos2)
      break;
    case 'a':
      editor.replaceRange(`() => a.fft[1] * 1.0`, pos1, pos2)
      pos1.ch += 12;
      pos2.ch += 12;
      editor.setSelection(pos1, pos2)
      break;
    case 'm':
      editor.replaceRange(`() => cc[11] * 1.0`, pos1, pos2)
      pos1.ch += 10;
      pos2.ch += 10;
      editor.setSelection(pos1, pos2)
      break;
    // main
    case 'n':
      editor.replaceRange(`void main () {vec2 st = (2.0*gl_FragCoord.xy-resolution.xy)/resolution.xy; gl_FragColor = vec4(st.x,st.y,0.0,1.0);}`, pos1, pos2)
      pos1.ch += 74;
      pos2.ch += 74;
      editor.setSelection(pos1, pos2)
      break;
    // for
    case 'r':
      editor.replaceRange('for (int i=0; i<2 ;i++) { }', pos1, pos2)
      pos1.ch += 25;
      pos2.ch += 25;
      editor.setSelection(pos1, pos2)
      break;
    case 's':
      editor.replaceRange('sin(time)', pos1, pos2)
      pos1.ch += 4;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    case 'c':
      editor.replaceRange('cos(time)', pos1, pos2)
      pos1.ch += 4;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    // if   
    case '=':
      editor.replaceRange('if (i==0.0) { } else { }', pos1, pos2)
      pos1.ch += 13;
      pos2.ch += 13;
      editor.setSelection(pos1, pos2)
      break;
    case '>':
      editor.replaceRange('if (i>0.0) { } else { }', pos1, pos2)
      pos1.ch += 12;
      pos2.ch += 12;
      editor.setSelection(pos1, pos2)
      break;
    case '<':
      editor.replaceRange('if (i<0.0) { } else { }', pos1, pos2)
      pos1.ch += 12;
      pos2.ch += 12;
      editor.setSelection(pos1, pos2)
      break;
      /*case 't':
          editor.replaceRange('vec4 t0 = texture2D(tex0, st);', pos1, pos2)
          pos1.ch += 10;
          pos2.ch += 10;
          editor.setSelection(pos1, pos2)
          break; */
    
    case '#':
      editor.replaceRange(`#if V==1
      #else
      #endif`, pos1, pos2)
      pos1.ch += 4;
      pos2.ch += 4;
      editor.setSelection(pos1, pos2)
      break;

    default:
      break;
  }
  return {
    start: pos1,
    end: pos2,
    text: str
  }
}
module.exports = EditorClass
