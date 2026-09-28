import assert from "node:assert/strict"
import test from "node:test"
import { createDocumentMarkdown } from "./markdown.ts"
import { countDocumentText, getDocumentFilename } from "./content.ts"

test("counts Unicode words and visible characters without counting emoji code units separately", () => {
  assert.deepEqual(countDocumentText(""), { words: 0, characters: 0 })
  assert.deepEqual(countDocumentText("Hi 👨‍👩‍👧‍👦 café"), { words: 2, characters: 9 })
  assert.equal(getDocumentFilename("Plan: v2", "md"), "Plan- v2.md")
})

test("Markdown preserves structured editor content and excludes executable HTML", () => {
  class Element {
    constructor(tagName, childNodes = [], attributes = {}) {
      this.nodeType = 1
      this.tagName = tagName
      this.childNodes = childNodes
      this.attributes = attributes
    }
    get children() { return this.childNodes.filter(node => node.nodeType === 1) }
    get textContent() { return this.childNodes.map(node => node.textContent).join("") }
    getAttribute(name) { return this.attributes[name] ?? null }
  }
  const t = textContent => ({ nodeType: 3, textContent })
  const e = (tag, children, attributes) => new Element(tag, children, attributes)
  const body = e("BODY", [
    e("H2", [t("Heading")]),
    e("P", [e("STRONG", [t("Bold")]), t(" & "), e("EM", [t("italic")]), e("BR"), t("[literal] <tag>")]),
    e("UL", [
      e("LI", [
        e("P", [t("Parent")]),
        e("UL", [e("LI", [e("P", [t("Child")])])]),
      ]),
    ]),
    e("OL", [e("LI", [e("P", [t("Third")])])], { start: "3" }),
    e("UL", [e("LI", [e("LABEL", [e("INPUT")]), e("DIV", [e("P", [t("Done")])])], { "data-type": "taskItem", "data-checked": "true" })]),
    e("BLOCKQUOTE", [e("P", [t("Quote")])]),
    e("PRE", [e("CODE", [t("a\n```\nb")])]),
    e("P", [e("CODE", [t("a`b")])]),
    e("P", [e("A", [t("Safe")], { href: "https://example.com/a b" }), e("A", [t("Unsafe")], { href: "javascript:alert(1)" })]),
    e("SCRIPT", [t("alert(1)")]),
  ])
  const previous = { Element: globalThis.Element, DOMParser: globalThis.DOMParser, Node: globalThis.Node }
  try {
    globalThis.Element = Element
    globalThis.Node = { TEXT_NODE: 3 }
    globalThis.DOMParser = class { parseFromString() { return { body } } }
    const markdown = createDocumentMarkdown("Title *", "")
    assert.ok(markdown.startsWith("# Title \\*\n\n"))
    assert.ok(markdown.includes("## Heading"))
    assert.ok(markdown.includes("**Bold** &amp; *italic*  \n\\[literal\\] \\<tag\\>"))
    assert.match(markdown, /- Parent\n(?: *\n)* +- Child/)
    assert.ok(markdown.includes("3. Third"))
    assert.ok(markdown.includes("- [x] Done"))
    assert.ok(markdown.includes("> Quote"))
    assert.ok(markdown.includes("````\na\n```\nb\n````"))
    assert.ok(markdown.includes("`` a`b ``"))
    assert.ok(markdown.includes("[Safe](<https://example.com/a%20b>)Unsafe"))
    assert.doesNotMatch(markdown, /javascript:|alert\(1\)|<script>/)
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]
      else globalThis[key] = value
    }
  }
})
