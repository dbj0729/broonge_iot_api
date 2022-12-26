module.exports = {
  convertData: data_elements => {
    // IoT 에서 받는 Header byte size
    let size_1 = 4 // Sig.
    let size_2 = 4 // Group
    let size_3 = 1 // OP Code
    let size_4 = 10 // ID
    let size_5 = 5 // Version
    let size_6 = 2 // MSG Length
    let size_7 = 23 // GPS
    let size_8 = 1 // Signal Strength
    let size_9 = 2 // Battery
    let size_10 = 2 // Device Status
    let size_11 = 2 // Error Info
    let size_12 = 4 // Checksum
    let error_report_size = 2 //Error Report: “01”:Sig error “02”:Group error “03”:OP code error “04”:ID error “05”:chksum error

    // Slice 로 진행하기에 그에 따른 글자 수에 따라 다음 단계를 불러오는 방식
    let sig_1 = size_1
    let sig_2 = sig_1 + size_2
    let sig_3 = sig_2 + size_3
    let sig_4 = sig_3 + size_4
    let sig_5 = sig_4 + size_5
    let sig_6 = sig_5 + size_6
    let sig_7 = sig_6 + size_7
    let sig_8 = sig_7 + size_8
    let sig_9 = sig_8 + size_9
    let sig_10 = sig_9 + size_10
    let sig_11 = sig_10 + size_11
    let sig_12 = sig_11 + size_12
    let sig_error_report = sig_6 + error_report_size

    const sig = data_elements.slice(0, sig_1)
    const group = data_elements.slice(sig_1, sig_2)
    const op_code = data_elements.slice(sig_2, sig_3)
    const bikeId = data_elements.slice(sig_3, sig_4)
    const version = data_elements.slice(sig_4, sig_5) // version 을 넣으니까 if 문에서 막힌다.
    const message_length = data_elements.slice(sig_5, sig_6)

    const f_1_gps = data_elements.slice(sig_6, sig_7)
    const f_2_signal_strength = data_elements.slice(sig_7, sig_8)
    const f_3_battery = data_elements.slice(sig_8, sig_9)
    const f_4_device_status = data_elements.slice(sig_9, sig_10)
    const f_5_err_info = data_elements.slice(sig_10, sig_11)
    const gps_reformatted = f_1_gps.split('N') // 이 부분이 IoT 좌표에서 넘어올 때 구분되어 지는 값이다.
    const f_1_lat = gps_reformatted[0].slice(0, 10) // 딱 10자리만 가져온다.
    const f_1_lng = gps_reformatted[1] ? gps_reformatted[1].slice(0, 11) : undefined

    const checksum = data_elements.slice(sig_11, sig_12)

    const error_report_code = data_elements.slice(sig_6, sig_error_report)

    // 변경되는 값; 이 부분을 저장해야 한다.
    let manual_codes = f_1_gps + f_2_signal_strength + f_3_battery + f_4_device_status + f_5_err_info

    const verifyingCode =
      '0' +
      manual_codes
        .split('')
        .map(item => item.charCodeAt())
        .reduce((acc, curr) => acc + curr)
        .toString(16)

    return {
      sig,
      group,
      op_code,
      bikeId,
      version,
      message_length,
      f_1_gps,
      f_1_lat,
      f_1_lng,
      f_2_signal_strength,
      f_3_battery,
      f_4_device_status,
      f_5_err_info,
      checksum,
      manual_codes,
      verifyingCode,
      error_report_code,
    }
  },
  sendingCode: (send_code, send_default_data_preparation) => {
    let combined_send_codes = send_code.split('')
    let send_codes_value = combined_send_codes.map(item => item.charCodeAt()).reduce((acc, curr) => acc + curr)
    let send_codes_value_verification = send_codes_value.toString(16)
    let send_codes_manually_added_0x = '00' + send_codes_value_verification
    let final_send_codes = send_default_data_preparation + send_code + send_codes_manually_added_0x
    return final_send_codes
  },
}
