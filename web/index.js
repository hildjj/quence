/* eslint-disable node/no-missing-import */
import './registerStaticFiles.js'
import * as SvgCss from 'bundle-text:../lib/svg.css'
import * as initial from 'bundle-text:./initial.wsd'
import * as monaco from 'monaco-editor'
import {SyntaxError, draw} from 'quence'
import {config, theme, tokenizer} from './wsd_language.js'
import Store from '../test/store.js'

self.MonacoEnvironment = {
  getWorkerUrl(moduleId, label) {
    if (label === 'json') {
      return './json.worker.js'
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './css.worker.js'
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './html.worker.js'
    }
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.js'
    }
    return './editor.worker.js'
  },
}

const src = document.querySelector('#src')
const dest = document.querySelector('#dest')
const downloadWSD = document.querySelector('#downloadWSD')
const downloadSVG = document.querySelector('#downloadSVG')
const downloadPDF = document.querySelector('#downloadPDF')
const downloadPDFhidden = document.querySelector('#downloadPDFhidden')

monaco.languages.register({id: 'wsd'})
monaco.languages.setMonarchTokensProvider('wsd', tokenizer)
monaco.languages.setLanguageConfiguration('wsd', config)
monaco.editor.defineTheme('wsdTheme', theme)

const editor = monaco.editor.create(src, {
  value: initial,
  language: 'wsd',
  theme: 'wsdTheme',
  automaticLayout: true,
})
const model = editor.getModel()

function debounce(func, ms) {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, ms)
  }
}

function clear() {
  dest.innerHTML = ''
  if (downloadWSD.href) {
    URL.revokeObjectURL(downloadWSD.href)
    downloadWSD.removeAttribute('href')
  }
  downloadSVG.hidden = true
  if (downloadSVG.href) {
    URL.revokeObjectURL(downloadSVG.href)
    downloadSVG.removeAttribute('href')
  }
  downloadPDF.hidden = true
  if (downloadPDFhidden.href) {
    URL.revokeObjectURL(downloadPDFhidden.href)
    downloadPDFhidden.removeAttribute('href')
  }
}

async function drawWeb(type) {
  const text = model.getValue()
  monaco.editor.setModelMarkers(model, 'wsd', [])

  try {
    const s = await draw(text, {
      CSS: SvgCss,
      fileName: 'web',
      output: type,
    }, new Store())
    return s
  } catch (er) {
    if (er instanceof SyntaxError) {
      const marker = {
        severity: monaco.MarkerSeverity.Error,
        message: er.message,
        startLineNumber: er.location.start.line,
        startColumn: er.location.start.column,
        endLineNumber: er.location.end.line,
        endColumn: er.location.end.column,
      }
      monaco.editor.setModelMarkers(model, 'wsd', [marker])
    } else {
      dest.innerHTML = er.message
      // eslint-disable-next-line no-console
      console.log(er)
    }
    return null
  }
}

async function drawPDF() {
  const pdf = await drawWeb('pdf')
  if (pdf) {
    const b = new Blob(await pdf.readFullBuffers(), {type: 'application/pdf'})
    downloadPDFhidden.href = URL.createObjectURL(b)
    downloadPDFhidden.click()
  }
  return false
}
downloadPDF.onclick = () => {
  drawPDF()
  return false
}

async function drawSVG() {
  clear()
  downloadWSD.href = URL.createObjectURL(new Blob([model.getValue()], {
    type: 'application/wsd+text',
    endings: 'native',
  }))
  const svg = await drawWeb('svg')
  if (svg) {
    const b = new Blob(svg.bufs, {type: 'image/svg+xml'})
    downloadSVG.href = URL.createObjectURL(b)
    dest.innerHTML = await b.text()
    downloadSVG.hidden = false
    downloadPDF.hidden = false
  }
}

model.onDidChangeContent(debounce(drawSVG, 300))

drawSVG()
