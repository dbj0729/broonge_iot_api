module.exports.toArrayBuffer = function (buffer) {
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; i++) {
    view[i] = buffer[i]
  }
  return view
}

// 0,  0,  0, 68, 149,  8, 2, 4,  6, 8, 84, 21,  0,  32, 16, 0, 0, 32, 16,  0,  0, 32,   0,  0, 0, 0, 97, 100, 57, 52
