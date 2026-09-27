import type { FileAttachment } from "./model"

export async function encodeAttachment(file: File): Promise<FileAttachment> {
  if (file.size > 2 * 1024 * 1024) throw new Error("Each file must be 2 MB or smaller.")
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ""
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
  }
  return {
    id: crypto.randomUUID(), name: file.name, type: file.type, kind: "file",
    // Download as a file instead of executing imported HTML or SVG as a page.
    url: "data:application/octet-stream;base64," + btoa(binary),
  }
}
