const Conf = require('../models/schema/conference')
const ConfRoom = require('../models/schema/conferenceRoom')

// 處理新增新空間
module.exports = async (confData, user) => {
    // 取得輸入的資料
    const { name, location, managerId,accommodate, price } = confData

    // 生成新空間的資料
    const conf = ConfRoom({ name, location, managerId, accommodate, price, isExist: 1 })

    // 保存到資料庫
    try {
        // 將會議資料保存到會議主檔
        conf.save().then((data) => {
            console.log(data)
        })

        return true // 回傳true

    } catch (error) { // 發生錯誤
        console.log(error)
        return false // 回傳false
    }

}