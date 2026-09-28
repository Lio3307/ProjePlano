import assert from "node:assert/strict"
import test from "node:test"
import { createDocumentHtml, escapeDocumentText, getDocumentFilename, matchesDocumentSearch } from "./content.ts"

test("search matches saved titles or decoded text regardless of case and surrounding spaces", () => {
  assert.equal(matchesDocumentSearch("Release plan", "Budget & scope", " PLAN "), true)
  assert.equal(matchesDocumentSearch("Release plan", "Budget & scope", "budget & scope"), true)
  assert.equal(matchesDocumentSearch("Release plan", "Budget & scope", "missing"), false)
  assert.equal(matchesDocumentSearch("Release plan", "Budget & scope", "  "), true)
})

test("export escapes text and uses portable filenames", () => {
  assert.equal(escapeDocumentText('<script a="x">&\'</script>'), "&lt;script a=&quot;x&quot;&gt;&amp;&#39;&lt;/script&gt;")
  assert.equal(getDocumentFilename("Plan: API/v2?"), "Plan- API-v2-.html")
  assert.equal(getDocumentFilename("..."), "document.html")
  assert.equal(getDocumentFilename("CON"), "document-CON.html")
})

test("HTML export serializes parsed nodes without executable elements or attributes", () => {
  // The platform owns HTML parsing; this fixture exercises the export allowlist.
  class Element {
    constructor(tagName, attributes = {}, childNodes = []) {
      this.nodeType = 1
      this.tagName = tagName
      this.attributes = attributes
      this.childNodes = childNodes
    }
    getAttribute(name) { return this.attributes[name] ?? null }
    hasAttribute(name) { return Object.hasOwn(this.attributes, name) }
  }
  const text = textContent => ({ nodeType: 3, textContent })
  const body = { childNodes: [
    new Element("P", { onclick: "alert(1)" }, [text("A & B < C")]),
    new Element("SCRIPT", {}, [text("alert(1)")]),
    new Element("A", { href: "javascript:alert(1)" }, [text("Unsafe")]),
    new Element("A", { href: 'https://example.com/?a=1&b="2"', target: "_blank" }, [text("Safe")]),
    new Element("INPUT", { type: "checkbox", checked: "", onclick: "alert(1)" }),
    new Element("IFRAME", { src: "https://example.com" }),
  ] }
  const previous = { DOMParser: globalThis.DOMParser, Element: globalThis.Element, Node: globalThis.Node }
  try {
    globalThis.Element = Element
    globalThis.Node = { TEXT_NODE: 3 }
    globalThis.DOMParser = class { parseFromString() { return { body } } }
    const html = createDocumentHtml("</title><script>bad()</script>", "")
    assert.ok(html.includes("<p>A &amp; B &lt; C</p>"))
    assert.ok(html.includes("<a>Unsafe</a>"))
    assert.ok(html.includes('href="https://example.com/?a=1&amp;b=&quot;2&quot;"'))
    assert.ok(html.includes('<input type="checkbox" disabled checked>'))
    assert.ok(html.includes("Content-Security-Policy"))
    assert.doesNotMatch(html, /<script|<iframe|onclick=|javascript:|alert\(1\)/i)
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[name]
      else globalThis[name] = value
    }
  }
})
