const Conf = require('../models/schema/conference')
const RoomSign = require('../models/schema/roomSign')
const ChairSign = require('../models/schema/chairSign')
const Attendee = require('../models/schema/attendee')
const Minute = require('../models/schema/minute')
const Notice = require('../models/schema/notice')
const ConfRoom = require('../models/schema/conferenceRoom')
// 處理刪除會議
module.exports = async (confId) => {
    // 生成更新資料
    const updateItem = { isExist: 0 }
    
    try {
        await ConfRoom.updateOne({ _id: confId }, updateItem)
        return true // 回傳true

    } catch (error) { // 如果發生錯誤
        console.log(error)
        return false // 回傳false
    }

}