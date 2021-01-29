const Conf = require('../models/schema/conference')
const ConfRoom = require('../models/schema/conferenceRoom')
const RoomSign = require('../models/schema/roomSign')
const ChairSign = require('../models/schema/chairSign')
const Attendee = require('../models/schema/attendee')
const User = require('../models/schema/user')

// 處理新增會議
module.exports = async (confData, user) => {
    // 取得輸入的資料
    const { name, startTime, endTime, chairId, topic, explain, roomId, attendees, attendTypes } = confData
    const organizerId = user.staffId // 取得建立者(目前登入的user)的員工編號

    // 查詢新空間的資料
    const roomData = await ConfRoom.findOne({ _id: roomId })

    /*
    * 計算人事成本
    * 假設每個參與者(包括主持人)的成本都是500
    */
    let laborCost = 0
    if (typeof (attendees) === 'string') { // 只有一個參與者
        laborCost = 500 * 2
    } else {
        laborCost = (attendees.length + 1) * 500
    }

    const cost = {
        laborCost, // 人事成本
        roomCost: roomData.price // 新空間成本
    }

    // 生成會議主檔的資料
    const conf = Conf({ name, organizerId, topic, explain, startTime, endTime, chairId, roomId, isChairSign: 0, isRoomSign: 0, cost, isExist: 1 })

    // 生成主持人簽核檔的資料
    const chairSign = ChairSign({ confId: conf._id, chairId, isSign: 0, isExist: 1 })

    // 生成使用空間簽核檔的資料
    const roomSign = RoomSign({ confId: conf._id, roomId, managerId: roomData.managerId, isSign: 0, isExist: 1 })

    // 生成出席人員檔的資料
    let attendee

    if (typeof (attendees) === 'string') { // 只有一個參與者
        attendee = Attendee({
            confId: conf._id,
            staffId: attendees,
            attendType: parseInt(attendTypes, 10),
            attendMode: 0,
            isExist: 1
        })
        // 將出席人員資料保存到出席人員檔
        attendee.save().then((data) => {
            console.log(data)
        }).catch((error) => {
            console.log(error)
            return false
        })

    } else { // 多個參與者
        for (let [inedx, item] of attendees.entries()) { 
            attendee = Attendee({
                confId: conf._id,
                staffId: item,
                attendType: parseInt(attendTypes[inedx], 10),
                attendMode: 0,
                isExist: 1
            })

            // 將出席人員資料保存到出席人員檔
            attendee.save().then((data) => {
                console.log(data)
            }).catch((error) => {
                console.log(error)
                return false
            })

        }
    }

    // 保存到資料庫
    try {
        // 將主持人簽核資料保存到主持人簽核檔
        chairSign.save().then((data) => {
            console.log(data)
        })

        // 將使用空間資料保存到使用空間簽核檔
        roomSign.save().then((data) => {
            console.log(data)
        })

        // 將會議資料保存到會議主檔
        conf.save().then((data) => {
            console.log(data)
        })

        try{
            let mailList = []
            let mailfinder = await User.findOne({ staffId: chairId, isExist: 1 }).lean()
            mailList.push(mailfinder.email)
            mailTitle = '[開會簽核申請]' + name
            let htmlInfo = '主旨：會議記錄<br>華新麗華的同仁好<br>會議名稱：' + name + '<br>該會議的待您審核<br>請同仁留意<br>謝謝'
            let btnurl = 'http://localhost:3000/sign'
            mailInfo = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style> .primary { color: #BD2716; } .primary-bg { background-color: #BD2716; color: white; } .link { text-decoration: none; } .primary-bg:hover { background-color: #961F12; color: white; } .container { width: 90%; margin: auto; } .mt-2 { margin-top: 20px; } .btn { display: block; text-align: center; padding: 10px; } .info { line-height: 30px; } .m-0 { margin: 0px; }</style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><spanstyle="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+htmlInfo+'</p></div><table width="100%"><tr><td width="100%"><a href="'+btnurl+'" class="primary-bg btn link" style="color:white;">前往確認</a></td></tr></table></div></div></div></div></body></html>'
            mailto(mailList, mailTitle, mailInfo)
        
        } catch (err) {
            console.log(err)
        }

        return true // 回傳true

    } catch (error) { // 發生錯誤
        console.log(error)
        return false // 回傳false
    }

}


// 傳送郵件的方法
function mailto(getMail, title, info) {      //  (收信方，標題，內文）
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