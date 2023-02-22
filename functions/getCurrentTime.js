module.exports.getCurrentTime = function () {
  var adjust_time_manual = 9 * 60 * 60 * 1000
  const datetime_in_number = Number(new Date()) + adjust_time_manual
  const datetime = new Date(datetime_in_number).toLocaleString('ko-KR')
  const result = String(datetime)
  return result
}
