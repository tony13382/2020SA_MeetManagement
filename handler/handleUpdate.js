const Conf = require('../models/schema/conference')
const ConfRoom = require('../models/schema/conferenceRoom')
const RoomSign = require('../models/schema/roomSign')
const ChairSign = require('../models/schema/chairSign')
const Attendee = require('../models/schema/attendee')
const User = require('../models/schema/user')

// 處理編輯會議
module.exports = async (confId, confData) => {

    let successNum = 0

    console.log(confData)

    // 取得輸入的資料
    const { name, startTime, endTime, chairId, topic, roomId,explain, attendees, attendTypes } = confData

    // 從新空間檔中查詢新空間的資料
    const roomData = await ConfRoom.findOne({ _id: roomId })

    // 假設每個參與者(包括主持人)的成本都是500
    let laborCost = 0
    if (typeof (attendees) === 'string') { // 只有一個參與者
        laborCost = 500 * 2
    } else {
        laborCost = (attendees.length + 1) * 500
    }

    // 計算成本
    const cost = {
        laborCost, // 人事成本
        roomCost: roomData.price // 新空間成本
    }

    /* 
     * 檢查主持人是否更動
     * 有更動→修改
     * 沒更動→不改
     */
    const chair = await ChairSign.find({ confId: confId }).lean() // 從主持人簽核檔中取得主持人的資料

    // 判斷主持人是否改變
    if (chair.chairId !== chairId) { // 主持人有改變
        // 生成主持人簽核檔要修改的資料
        const updateItem = { chairId }

        // 在主持人簽核檔中用 confId 找到這筆資料，並更新
        await ChairSign.updateOne({ confId: confId }, updateItem, (error, data) => { 
            if (error) { // 更新失敗
                return console.log(error)
            }
            // console.log('成功修改主持人：', data)
            successNum++
        })
    }

    //Send Mail to Chair
    const userdb = await User.findOne({staffId: chairId})
    let mailList = []
    mailList.push(userdb.email)
    mailList.push('ttsmcpe@gmail.com')
    mailTitle = '[會議資料更新通知] ' + name
    htmlInfo ='主旨：會議資料更新通知<br>會議名稱：'+name+'<br>有些資料已經被更改<br>建議同仁前往確認'
    btnurl = 'http:localhost:3000/confinfo?id=' + confId
    mailInfo ='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style> .primary { color: #BD2716; } .primary-bg { background-color: #BD2716; color: white; } .link { text-decoration: none; } .primary-bg:hover { background-color: #961F12; color: white; } .container { width: 90%; margin: auto; } .mt-2 { margin-top: 20px; } .btn { display: block; text-align: center; padding: 10px; } .info { line-height: 30px; } .m-0 { margin: 0px; }</style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><spanstyle="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+htmlInfo+'</p></div><table width="100%"><tr><td width="100%"><a href="'+btnurl+'" class="primary-bg btn link" style="color:white;">前往查看</a></td></tr></table></div></div></div></div></body></html>'
    
    //  呼叫mailto方法 
    mailto(mailList, mailTitle, mailInfo)



    /* 
     * 檢查使用空間是否更動
     * 有更動→修改
     * 沒更動→不改
     */
    const roomSign = await RoomSign.find({ confId: confId }).lean() //  從使用空間簽核檔中取得原本的新空間資料

    // 判斷使用空間是否改變
    if (roomSign.roomId !== roomId) { // 新空間有改變

        // 生成使用空間簽核檔要修改的資料
        const updateItem = { roomId: roomId, managerId: roomData.managerId }

        // 在使用空間簽核檔中用 confId 找到這筆會議，並更新
        await RoomSign.updateOne({ confId: confId }, updateItem, (error, data) => { 
            if (error) { // 更新失敗
                return console.log(error)
            }
            // console.log('成功修改地點：', data)
            successNum++
        })
    }


    /* 
     * 檢查參與者是原有的還是新增的
     * 原有的但沒被刪除→更新
     * 新增的→新增
     */

    // 先把會議的所有參與者的 isExist 改為 0
    const updateExist = { isExist: 0 }
    // 從出席人員檔中找到會議的所有參與者，並更新
    await Attendee.updateMany({ confId: confId }, updateExist, (error, data) => {
        if (error) { // 更新失敗
            return console.log(error)
        }
    })

    // 生成出席人員檔的資料
    let attendee

    if (typeof (attendees) === 'string') { // 只有一個參與者

        // 從出席人員檔中尋找這個員工
        const atdData = await Attendee.find({ confId: confId, staffId: attendees })

        if (atdData === []) { // 找不到→代表是新的參與者
            // 生成出席人員檔的資料
            attendee = Attendee({
                confId: confId,
                staffId: attendees,
                attendType: parseInt(attendTypes, 10),
                attendMode: 0,
                isExist: 1
            })
            // 保存出席人員資料
            await attendee.save().then((data) => {
                // console.log(data)
                successNum++

            }).catch((error) => {
                console.log(error)
                return false
            })


        } else { // 找到→是原本就有的參與者

            // 生成要更新的資料
            const updateItem = { attendType: attendTypes, isExist: 1 }

            // 從出席人員檔中找到這筆出席資料，並更新
            await Attendee.updateOne({ confId: confId, staffId: attendees }, updateItem, (error, data) => {
                if (error) { // 更新失敗
                    return console.log(error)
                }
                // console.log('成功更新與會者', data)
                successNum++
            })
        }

    } else { // 多個參與者
        for (let [inedx, item] of attendees.entries()) {

            // console.log(item)

            // 從出席人員檔中尋找這個員工
            const atdData = await Attendee.find({ confId: confId, staffId: item })
            // console.log(atdData)

            if (atdData.length === 0) { // 找不到→代表是新的參與者
                // 生成出席人員檔的資料
                attendee = Attendee({
                    confId: confId,
                    staffId: item,
                    attendType: parseInt(attendTypes[inedx], 10),
                    attendMode: 0,
                    isExist: 1
                })

                // 保存出席人員資料
                await attendee.save().then((data) => {
                    // console.log(`新增成功 ${data}`)
                    successNum++
                }).catch((error) => {
                    console.log(error)
                    return false
                })

            } else { // 找到→是原本就有的參與者

                // 生成要更新的資料
                const updateItem = { attendType: parseInt(attendTypes[inedx], 10), isExist: 1 }

                // 從出席人員檔中找到這筆出席資料，並更新
                await Attendee.updateOne({ confId: confId, staffId: item }, updateItem, (error, data) => {
                    if (error) { // 更新失敗
                        return console.log(error)
                    }
                    // console.log('成功更新與會者', data)
                    successNum++
                })
            }
        }
    }

    // 生成會議主檔要修改的資料
    const confUpdate = { name, topic, startTime, endTime, chairId, roomId, cost, explain }

    // 修改會議主檔的資料
    await Conf.updateOne({ _id: confId }, confUpdate, (error, data) => { 
        if (error) { // 更新失敗
            return console.log(error)
        }
        // console.log('成功更新會議', data)
        successNum++
    })


    

    // console.log(successNum)

    // 檢查上述的資料庫動作是否都成功
    if (typeof (attendees) === 'string') { // 如果只有一個與會者
        if (successNum === 4) { // successNum 是4->代表都成功
            return true
        } else { // 失敗
            return false // 返回false
        }
    } else { // 如果有多個與會者
        if (successNum === (3 + attendees.length)) { // successNum 是3+出席者的人數 -> 代表都成功
            return true
        } else { // 失敗
            return false // 返回false
        }
    }

}

// 傳送郵件的方法
function mailto(getMail, title, info) {          //  (收信方，標題{可放HTML}，內文）
let nodemailer = require('nodemailer');          //  引入寄信的套件

let transporter = nodemailer.createTransport({
    service: 'gmail',                            //  設定寄信服務端
    auth: {                                      //  帳號認證
        user: 'noreply.testSA@gmail.com',        //  寄信方帳號
        pass: 'fionnqixfrmadczs'                 //  寄信方密碼（需在安全性設置裡，生成應用程式密碼）
    }
});
let mailOptions = {                              //  信件資訊
    from: 'noreply.testSA@gmail.com',            //  寄信方
    to: getMail,                                 //  收信方（抓呼叫方法時給的參數）
    subject: title,                              //  寄件標題
    text: info,                                  //  給定內容(文字和html只能選一個)
    html: info
};

transporter.sendMail(mailOptions, function (error, info) {          //  偵錯
    if (error) {   
        console.log(error);                                         //  錯誤
    } else {
        console.log('Email sent: ' + info.response);                //  Console顯示寄信給...
    }
});
}