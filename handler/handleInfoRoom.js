const ConfRoom = require('../models/schema/conferenceRoom')

async function handleInfoRoom(user, getId) {
    // 從新空間資料表中取得自己的會議
    const createConfs = await ConfRoom.find({_id: getId , isExist: 1 }).lean()

    const confsData = []
    let userConf

    for (let conf of createConfs) {

        let confInfo = await ConfRoom.findOne({ _id: conf._id }).lean() // 取得新空間的詳細資料

        // 將主持資料、會議詳細資料與會議室資料放入物件
        userConf = {
            roomData: conf,
            confData: confInfo,
        }
        confsData.push(userConf) // 將物件加到陣列中
    }

    // 回傳空間資料
    return confsData
}

module.exports = { handleInfoRoom }