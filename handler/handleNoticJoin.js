const Conf = require('../models/schema/conference')
const Attendee = require('../models/schema/attendee')
const ConfRoom = require('../models/schema/conferenceRoom')
const RoomSign = require('../models/schema/roomSign')
const ChairSign = require('../models/schema/chairSign')
const User = require('../models/schema/user')
// 處理新增會議
module.exports = async (id , user) => {
    // 取得輸入的資料
    
    // 保存到資料庫
    try {
        //  設定欲收信人的陣列，將所有信箱寫入陣列
        const maillist = []

        const AttendeeConf = await Attendee.find({ confId: id, isExist: 1 }).lean()
        const LocationConf = await Conf.findOne({ _id: id , isExist: 1 }).lean()
        const userlist = []

        for (let joinperson of AttendeeConf) {
            const userInfo = await User.findOne({ staffId: joinperson.staffId, isExist: 1 }).lean()
            userlist.push(userInfo.email)
        }
        let mailtitle = '[開會通知]' + LocationConf.name
        //console.log(mailtitle)
        
        let htmlInfo = '主旨：開會通知<br>華新麗華的同仁好<br>會議名稱:' + LocationConf.name + '<br>該次會議已經開啟線上會議，請需要線上開會的同仁點選加入此次會議<br>謝謝'
        let btnurl = 'http:localhost:3000/joinmeet?id='+ id
        let btnurlapp = 'https://meet.jit.si/com.org.cycu.'+id
        const mailinfo = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style> .primary {color: #BD2716;} .primary-bg {background-color: #BD2716; color: white; } .gray-bg {background-color: #939597; color: white; } .gray-bg:hover { background-color: #575758; color: white; } .link { text-decoration: none; } .primary-bg:hover { background-color: #961F12; color: white; } .container { width: 90%; margin: auto; } .mt-2 { margin-top: 20px; } .btn { display: block; text-align: center; padding: 10px; } .info { line-height: 30px; } .m-0 { margin: 0px; } </style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><span style="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+htmlInfo+'</p></div><table width="100%"><tr><td width="50%"><p style="text-align: center;">PC 網頁版<br>具有語音辨識功能</p><a href="'+btnurl+'" class="primary-bg btn link" style="color:white;">前往加入</a></td><td width="50%"><p style="text-align: center;">APP 版本<br>(需要先下載Jisti Meet)</p><a href="'+btnurlapp+'" class="primary-bg btn link" style="color:white;">前往加入</a></td></tr></table><br> </div> <div class="card" style="width: 100%; max-width: 100%;"><br> <hr> <p style="text-align: center;">未安裝APP 按下方下載</p> <a href="https://apps.apple.com/us/app/jitsi-meet/id1165103905" class="gray-bg btn link" style="color:white;">Apple</a><br><a href="https://play.google.com/store/apps/details?id=org.jitsi.meet&hl=en&gl=US"class="gray-bg btn link" style="color:white;">Android</a></div></div></div></div></body></html>'    
        userlist.push("ttsmcpe@gmail.com") //檢驗備份
        
        //  呼叫mailto方法 
        mailto(userlist, mailtitle, mailinfo)


        return true // 回傳true

    } catch (error) { // 發生錯誤
        console.log(error)
        return false // 回傳false
    }

}


// 傳送郵件的方法
function mailto(getMail, title, info) { //  (收信方，標題{可放HTML}，內文）
    let nodemailer = require('nodemailer'); //  引入寄信的套件

    let transporter = nodemailer.createTransport({
        service: 'gmail', //  設定寄信服務端
        auth: { //  帳號認證
            user: 'noreply.testSA@gmail.com', //  寄信方帳號
            pass: 'fionnqixfrmadczs' //  寄信方密碼（需在安全性設置裡，生成應用程式密碼）
        }
    });
    let mailOptions = { //  信件資訊
        from: 'noreply.testSA@gmail.com', //  寄信方
        to: getMail, //  收信方（抓呼叫方法時給的參數）
        subject: title, //  寄件標題
        text: info, //  給定內容(文字和html只能選一個)
        html: info
    };

    transporter.sendMail(mailOptions, function (error, info) { //  偵錯
        if (error) {
            console.log(error); //  錯誤
        } else {
            console.log('Email sent: ' + info.response); //  Console顯示寄信給...
        }
    });
}