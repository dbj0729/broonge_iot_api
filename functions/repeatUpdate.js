const { connection } = require('./config/database')
const { distance } = require('./functions/distance')

module.exports.repeatUpdate = async data_elements => {
  let size_1 = 2 // Sig.
  let size_2 = 2 // Group
  let size_3 = 1 // OP Code

  let sig_1 = size_1
  let sig_2 = sig_1 + size_2
  let sig_3 = sig_2 + size_3

  let size_5 = 3 // Version
  let size_6 = 2 // MSG Length
  let size_7 = 23 // GPS
  let size_8 = 1 // Signal Strength
  let size_9 = 2 // Battery
  let size_10 = 2 // Device Status
  let size_11 = 2 // Error Info
  let size_12 = 4 // Checksum
  let error_report_size = 2 //Error Report: “01”:Sig error “02”:Group error “03”:OP code error “04”:ID error “05”:chksum error

  // Slice 로 진행하기에 그에 따른 글자 수에 따라 다음 단계를 불러오는 방식
  let sig_4 = sig_3 + size_4
  let sig_5 = sig_4 + size_5
  let sig_6 = sig_5 + size_6 //20
  let sig_7 = sig_6 + size_7 //43
  let sig_8 = sig_7 + size_8
  let sig_9 = sig_8 + size_9
  let sig_10 = sig_9 + size_10
  let sig_11 = sig_10 + size_11
  let sig_12 = sig_11 + size_12
  let sig_error_report = sig_6 + error_report_size

  const bike_id_from_iot = data_elements.slice(sig_3, sig_4)
  const version = data_elements.slice(sig_4, sig_5) // version 을 넣으니까 if 문에서 막힌다.
  const message_length = data_elements.slice(sig_5, sig_6)

  const f_1_gps = data_elements.slice(sig_6, sig_7)

  const f_2_signal_strength = data_elements.slice(sig_7, sig_8)
  const f_3_battery = data_elements.slice(sig_8, sig_9)
  const f_4_device_status = data_elements.slice(sig_9, sig_10)
  const f_5_err_info = data_elements.slice(sig_10, sig_11)
  const gps_reformatted = f_1_gps.split('N') // 이 부분이 IoT 좌표에서 넘어올 때 구분되어 지는 값이다.
  let f_1_lat = gps_reformatted[0].slice(0, 10) // 딱 10자리만 가져온다.
  let f_1_lng = gps_reformatted[1] ? gps_reformatted[1].slice(0, 11) : undefined
  sig == process.env.IOT_SIG &&
    group == process.env.IOT_GROUP &&
    op_code == process.env.IOT_OP_CODE &&
    manual_codes.length !== 0

  if (
    sig == process.env.IOT_SIG &&
    group == process.env.IOT_GROUP &&
    op_code == process.env.IOT_OP_CODE &&
    manual_codes.length !== 0
  ) {
    const combined_manual_codes = manual_codes.split('') // data 에서 온 raw 값을 글자 단위로 쪼갠 결과
    const manual_codes_value = combined_manual_codes.map(item => item.charCodeAt()).reduce((acc, curr) => acc + curr) // 쪼갠 결과를 하나씩 분배

    let manual_codes_value_verification = manual_codes_value.toString(16) // 분배된 값을 16진수로 변경

    let manually_added_0x = '0' + manual_codes_value_verification

    if (checksum == manually_added_0x) {
      try {
        const [convertToBikeId] = await (
          await connection()
        ).query(`SELECT bike_id FROM iot_status WHERE usim = ?`, [bike_id_from_iot])

        if (convertToBikeId.length === 0) {
          console.log('등록되지 않은 자전거입니다.')
          return
        }

        const bike_id_imei = convertToBikeId[0].bike_id

        const [bike_version] = await (
          await connection()
        ).query(`SELECT iot_version FROM bikes WHERE id = ?`, [bike_id_imei])

        const findBikeInIotStatusQuery = `SELECT lng, lat FROM iot_status WHERE bike_id = ? limit 1`
        const [findBikeInIotStatus] = await (await connection()).query(findBikeInIotStatusQuery, [bike_id_imei])

        if (findBikeInIotStatus.length === 0) {
          console.log('등록되지 않은 자전거입니다.')
          return
        }

        if (!bike_version[0].iot_version || bike_version[0].iot_version !== version) {
          await (
            await connection()
          ).query(`UPDATE bikes SET iot_version = ?, is_updated_to_the_latest = 'YES' WHERE id = ?`, [
            version,
            bike_id_imei,
          ])
        }

        if (gps_reformatted.length === 1) {
          f_1_lng = findBikeInIotStatus[0].lng
          f_1_lat = findBikeInIotStatus[0].lat
        }

        if (!f_1_lng && f_1_lat === '??????????') {
          f_1_lng = 127.0895133
          f_1_lat = 37.2115683
        }

        const partQuery =
          f_4_device_status === '03'
            ? `status = 'malfunctioning', is_locked = 'malfunctioning'`
            : f_4_device_status === '00' // 00 이 해제상태
            ? `status = 'in_use', is_locked = 'NO'`
            : f_4_device_status === '01' // 01 이 잠긴상태
            ? `status = 'stand_by', is_locked = 'YES'`
            : `status = 'malfunctioning', is_locked = 'malfunctioning'` // 문제가 발생했다는 의미..? @DBJ on 20221213
        const updateBikeStatusQuery = `UPDATE iot_status SET battery = ?, lat = ?, lng = ?, signal_strength = ?, point = ST_GeomFromText('POINT(? ?)'), ${partQuery} WHERE bike_id = ?`
        const [result] = await (
          await connection()
        ).query(updateBikeStatusQuery, [
          f_3_battery,
          f_1_lat,
          f_1_lng,
          f_2_signal_strength,
          Number(f_1_lng),
          Number(f_1_lat),
          bike_id_imei,
        ])

        if (f_4_device_status === '00') {
          const selectBikeRiding = `SELECT distance, coordinates FROM riding_data WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`
          const [selectResult] = await (await connection()).query(selectBikeRiding, [bike_id_imei])

          let coordinates = []
          let dist = selectResult[0].distance ? Number(selectResult[0].distance) : 0

          if (selectResult[0].coordinates) {
            coordinates = JSON.parse(selectResult[0].coordinates)
            const distPoints = distance(
              Number(f_1_lat),
              Number(f_1_lng),
              Number(coordinates[coordinates.length - 1].lat),
              Number(coordinates[coordinates.length - 1].lng),
              'K',
            )

            if (distPoints === 0) return
            else dist += distPoints
          }

          coordinates = [...coordinates, { lat: Number(f_1_lat), lng: Number(f_1_lng) }]

          const updateBikeRiding = `UPDATE riding_data set coordinates = ?, distance = ? WHERE bike_id = ? AND start_datetime IS NOT NULL AND end_datetime IS NULL ORDER BY id DESC LIMIT 1`
          await (
            await connection()
          ).query(updateBikeRiding, [JSON.stringify(coordinates), dist.toFixed(1), bike_id_imei])
        }
        console.log('업데이트 성공!!!!')
      } catch (error) {
        console.log('업데이트 실패')
        console.log(error)
      }
    }
  }
}
