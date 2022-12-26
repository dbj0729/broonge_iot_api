const { distance } = require('./distance')
const { connection } = require('../config/database')

module.exports.iotProcess = async (
  checksum,
  verifyingCode,
  bike_id_from_iot,
  f_1_lat,
  f_1_lng,
  f_2_signal_strength,
  f_3_battery,
  f_4_device_status,
  gps_obj,
) => {
  if (checksum == verifyingCode) {
    // IoT 로 부터 받은 값이 모두 문제 없이 다 통과했을 때 실행
    try {
      //자전거가 보낸 통신일 경우
      //DB에 해당 자전거 ID가 등록되어 있는지 확인
      const findBikeInIotStatusQuery = `SELECT * FROM iot_status WHERE bike_id = ? limit 1`
      var [findBikeInIotStatus] = await (await connection()).query(findBikeInIotStatusQuery, [bike_id_from_iot])
      const findBikeInBikesQuery = `SELECT * FROM bikes WHERE id = ? limit 1`
      let [findBikeInBikes] = await (await connection()).query(findBikeInBikesQuery, [bike_id_from_iot])

      // if (
      //   findBikeInIotStatus.length === 0 ||
      //   findBikeInBikes.length === 0 ||
      //   findBikeInBikes[0].is_active !== 'YES'
      // ) {
      // 등록된 자전거가 없을 경우 소켓을 끊는다.
      // connectedBikeSocket.delete(socket)
      // socket.destroy()
      // }

      const partQuery =
        f_4_device_status === '03'
          ? `status = 'malfunction', is_locked = 'malfunction'`
          : f_4_device_status === '00' // 00 이 해제상태
          ? `status = 'in-use', is_locked = 'NO'`
          : f_4_device_status === '01' // 01 이 잠긴상태
          ? `status = 'stand_by', is_locked = 'YES'`
          : `status = 'stand_by', is_locked = 'NO'` // 문제가 발생했다는 의미..? @DBJ on 20221213
      const updateBikeStatusQuery = `UPDATE iot_status SET battery = ?, lat = ?, lng = ?, signal_strength = ?, point = ST_GeomFromText('POINT(? ?)'), ${partQuery} WHERE bike_id = ?`
      const result = await (
        await connection()
      ).query(updateBikeStatusQuery, [
        f_3_battery,
        f_1_lat,
        f_1_lng,
        f_2_signal_strength,
        Number(f_1_lat),
        Number(f_1_lng),
        bike_id_from_iot,
      ])
      if (f_4_device_status === '00') {
        let gps_array = []
        let gps_object = { lat: Number(f_1_lat), lng: Number(f_1_lng) }

        if (gps_obj[bike_id_from_iot]) gps_array = gps_obj[bike_id_from_iot]

        if (gps_array.length === 0) {
          gps_object = { ...gps_object, totalDist: 0 }
          gps_array.push(gps_object)
          gps_obj[bike_id_from_iot] = gps_array
        }

        const last = gps_array[gps_array.length - 1]
        console.log({ last })
        const dist = distance(f_1_lat, f_1_lng, Number(last.lat), Number(last.lng), 'K')

        const totalDist = dist + last.totalDist
        gps_object = { ...gps_object, totalDist: totalDist }

        gps_array.push(gps_object)
        gps_obj[bike_id_from_iot] = gps_array

        console.log({ gps_array })
        return gps_obj
      } else {
        const updateBikeStatusQuery2 = `UPDATE riding_data SET distance = ?, coordinates = ? WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`
        const ridingData = gps_obj[bike_id_from_iot]
        const lastIdx = ridingData.length - 1
        const dist = ridingData[lastIdx].totalDist

        await (
          await connection()
        ).query(updateBikeStatusQuery2, [dist.toFixed(3), JSON.stringify(ridingData), bike_id_from_iot])
        delete gps_obj[bike_id_from_iot]
        console.log('GPS array has been reset.')
        return gps_obj
      }
    } catch (error) {
      console.log(error)
    }
  } else {
    console.log('incoming wrong data')
  }
}
