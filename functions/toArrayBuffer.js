module.exports.toArrayBuffer = function (buffer) {
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; i++) {
    view[i] = buf[i]
  }
  return view
}
