module.exports.convertBattery = value => {
  let realNumber = Number(value.replace(/\B(?=(\d{2})+(?!\d))/g, '.'))

  if (realNumber > 54.2) realNumber = 54.2
  else if (realNumber < 42.2) realNumber = 42.2

  const ratio = (realNumber - 42.2) / (54.2 - 42.2)
  const percentage = Math.round(ratio * 100)

  return percentage
}
