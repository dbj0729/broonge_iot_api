const { distance } = require('./distance')

module.exports.updateCoords = (ridingData, lat, lng) => {
  let coordinates = []
  let dist = ridingData[0].distance ? Number(ridingData[0].distance) : 0
  console.log({ lat, lng })

  if (ridingData[0].coordinates) {
    coordinates = JSON.parse(ridingData[0].coordinates)
    const distPoints = distance(
      Number(f_1_lat),
      Number(f_1_lng),
      Number(coordinates[coordinates.length - 1].lat),
      Number(coordinates[coordinates.length - 1].lng),
      'K',
    )

    console.log({ 이동거리: distPoints })
    dist += distPoints
  }

  coordinates = [...coordinates, { lat: Number(lat), lng: Number(lng) }]
  return { coordinates, dist }
}
