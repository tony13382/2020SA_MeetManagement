const ConfRoom = require('../models/schema/conferenceRoom')

// 處理編輯新空間
module.exports = async (confId, confData) => {

    console.log(confData)

    // 取得輸入的資料
    const { name, location, managerId, accommodate,price } = confData

    // 生成會議主檔要修改的資料
    const confUpdate = { name, location , managerId, accommodate, price }

    // 修改會議主檔的資料
    await ConfRoom.updateOne({ _id: confId }, confUpdate, (error, data) => { 
        if (error) { // 更新失敗
            return false
        }
        else{
            return true
        }
        // console.log('成功更新會議', data)
        
    })
}