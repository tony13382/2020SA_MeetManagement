const Conf = require('../models/schema/conference')
const ConfRoom = require('../models/schema/conferenceRoom')
const RoomSign = require('../models/schema/roomSign')
const ChairSign = require('../models/schema/chairSign')
const Attendee = require('../models/schema/attendee')
const User = require('../models/schema/user')

const moment = require('moment')
const express = require('express')
const {
    writeFileSync
} = require('fs')
const ics = require('ics')
const fs = require('fs')

// 處理主持人簽核
async function handleChairSign(confId, isSign) {
    if (isSign === '1') { // 核准→不可再次審核
        try {
            await Conf.updateOne({_id: confId}, {isChairSign: 1}) // 更新會議主檔
            await ChairSign.updateOne({confId: confId}, {isSign: 1}) // 更新主持人簽核檔

            const ConfDB = await Conf.findOne({_id: confId})
            const NRoomDB = await ConfRoom.findOne({_id: ConfDB.roomId})
            const ManagerDB = await User.findOne({ staffId: NRoomDB.managerId }).lean()
            let mailtitle = "[新會議等待空間簽核] "+ ConfDB.name
            let htmlInfo = "主旨：新增會議 等待空間簽核<br>您好：<br> 會議名稱：" + ConfDB.name + "<br>將在你所管理的新空間開會<br>特此告之您進行審核<br>謝謝"
            const mailinfo = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style>.primary {color: #BD2716;}.primary-bg {background-color: #BD2716;color: white;}.link {text-decoration: none;}.primary-bg:hover {background-color: #BD2716;color: white;}.container {width: 90%;margin: auto;}.mt-2 {margin-top: 20px;}.btn{display: block;width: 100%;text-align: center;padding: 10px;}.info {line-height: 30px;}.m-0 {margin: 0px;}</style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><span style="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+htmlInfo+'</p></div><a href="http://localhost:3000/confInfo?id=' + ConfDB._id + '" class="primary-bg btn link" style="color:white;">前往確認</a></div></div></div></div></body></html>'
            const maillist = []
            //console.log(maillist + "|" + mailtitle + "|" + htmlInfo)
            maillist.push(ManagerDB.email)
            mailto_info(maillist, mailtitle,mailinfo)


            return {
                isSuccess: true,
                isAllow: true
            }
        } catch (error) {
            return {
                isSuccess: false
            }
        }

    } else { // 駁回→可修改後再次審核
        try {
            await Conf.updateOne({_id: confId}, {isChairSign: 2}) // 更新會議主檔
            await ChairSign.updateOne({confId: confId}, {isSign: 2}) // 更新主持人簽核檔
            
            const ConfDB = await Conf.findOne({_id: confId})
            const ManagerDB = await User.findOne({ staffId: ConfDB.organizerId , isExist: 1 }).lean()
            let mailtitle = "[簽核駁回通知] "+ ConfDB.name
            let htmlInfo = "主旨：新增會議 審核失敗通知<br>您好：<br> 會議名稱：" + ConfDB.name + "<br>無法通過審核<br>特此告之您<br>謝謝"
            const mailinfo = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style>.primary {color: #BD2716;}.primary-bg {background-color: #BD2716;color: white;}.link {text-decoration: none;}.primary-bg:hover {background-color: #BD2716;color: white;}.container {width: 90%;margin: auto;}.mt-2 {margin-top: 20px;}.btn{display: block;width: 100%;text-align: center;padding: 10px;}.info {line-height: 30px;}.m-0 {margin: 0px;}</style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><span style="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+htmlInfo+'</p></div><a href="http://localhost:3000/confInfo?id=' + ConfDB._id + '" class="primary-bg btn link" style="color:white;">前往確認</a></div></div></div></div></body></html>'
            const maillist = []
            //console.log(maillist + "|" + mailtitle + "|" + htmlInfo)
            maillist.push(ManagerDB.email)
            mailto_info(maillist, mailtitle,mailinfo)
            
            
            return {
                isSuccess: true,
                isAllow: false
            }
        } catch (error) {
            return {
                isSuccess: false
            }
        }
    }
}



// 處理空間負責人簽核
async function handleRoomSign(confId, isSign) {

    if (isSign === '1') { // 核准→不可再次審核
        try {
            

            await Conf.updateOne({ _id: confId }, { isRoomSign: 1 }) // 更新會議主檔
            await RoomSign.updateOne({ confId: confId }, { isSign: 1 }) // 更新會議室簽核檔

            const AttendeeConf = await Attendee.find({ confId: confId , isExist: 1 }).lean()
            const userlist = []

            for (let joinperson of AttendeeConf) {
                const userInfo = await User.findOne({ staffId: joinperson.staffId , isExist: 1 }).lean()
                userlist.push(userInfo.email)
            }
            
            const LocationConf = await Conf.findOne({ _id: confId , isExist: 1 }).lean()
            const LocationRoom = await ConfRoom.findOne({ _id: LocationConf.roomId , isExist: 1 }).lean()
            const location_name = LocationRoom.name
            const location_address = LocationRoom.location
            const ics_title = LocationConf.name
            const ics_info = '議程: ' + LocationConf.topic + '\n說明: ' + LocationConf.explain + ' \n位置: ' + location_name + '\n地址: ' + location_address
            //console.log(LocationConf.startTime + "||" + LocationConf.endTime)
            let confChair = LocationConf.organizerId
            const chairuserInfo = await User.findOne({ staffId: confChair , isExist: 1 }).lean()
            const chairMail = chairuserInfo.email
            
            try{
                //  將會議時間轉成字串，擷取下來給ics用
                var start_time_str  = moment(LocationConf.startTime).format('YYYY-MM-DDTHH:mm');        // 宣告 起始時間，結束時間 字串。
                var end_time_str = moment(LocationConf.endTime).format('YYYY-MM-DDTHH:mm');          
            }catch(error){
                console.log('convert error')
                return {isSuccess: false}
            }
            var s_t_Year , s_t_Month , s_t_Day , s_t_Hour , s_t_Minite; 
            var e_t_Year , e_t_Month , e_t_Day , e_t_Hour , e_t_Minite;

            //console.log(start_time_str + " | " + end_time_str)

            //  x.substr(0,3)  x 字串中的第0個開始，擷取絕對值(3 - 0)個字元 
            //  x.substr(0,3) = x.substr(3,0)
            s_t_Year = start_time_str.substr(0,4);      //  擷取年份字串
            s_t_Month = start_time_str.substr(5,2);     //  擷取月份字串
            s_t_Day = start_time_str.substr(8,2);      //  擷取天字串
            s_t_Hour = start_time_str.substr(11,2)     //  擷取小時字串
            s_t_Minite = start_time_str.substr(14,2)   //  擷取分鐘字串
            //console.log(s_t_Year+"|"+s_t_Month+"|"+s_t_Day+"|"+s_t_Hour+"|"+s_t_Minite)
            
            e_t_Year = end_time_str.substr(0,4);        //  擷取年份字串
            e_t_Month = end_time_str.substr(5,2);       //  擷取月份字串
            e_t_Day = end_time_str.substr(8,2);        //  擷取天字串
            e_t_Hour = end_time_str.substr(11,2)       //  擷取小時字串
            e_t_Minite = end_time_str.substr(14,2)     //  擷取分鐘字串
            
            //console.log(e_t_Year+"|"+e_t_Month+"|"+e_t_Day+"|"+e_t_Hour+"|"+e_t_Minite)

            //console.log(LocationConf._id+"|"+ics_title+"|"+ics_info+"|"+location_name)
            
            //  呼叫生成ics檔方法 
            create_cal(LocationConf._id , ics_title, ics_info, location_address,
                 s_t_Year, parseInt(s_t_Month), parseInt(s_t_Day), parseInt(s_t_Hour), parseInt(s_t_Minite), 
                 e_t_Year, parseInt(e_t_Month), parseInt(e_t_Day), parseInt(e_t_Hour), parseInt(e_t_Minite)
            );    
        
            let mailtitle = '[開會通知]' + LocationConf.name
            console.log(mailtitle)

            let htmlInfo = '主旨：開會通知<br>華新麗華的同仁好<br>會議名稱:' + LocationConf.name + '<br>該次會議已經可選擇與會模式，請需要開會的同仁點選是否出席此次會議<br>謝謝<br>下方檔案為行事曆檔 按下即可新增日程至裝置<br>'
            const mailinfo = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style>.primary {color: #BD2716;}.primary-bg {background-color: #BD2716;color: white;}.link {text-decoration: none;}.primary-bg:hover {background-color: #BD2716;color: white;}.container {width: 90%;margin: auto;}.mt-2 {margin-top: 20px;}.btn{display: block;width: 100%;text-align: center;padding: 10px;}.info {line-height: 30px;}.m-0 {margin: 0px;}</style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><span style="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+htmlInfo+'</p></div><a href="http://localhost:3000/confInfo?id=' + LocationConf._id + '" class="primary-bg btn link" style="color:white;">前往確認</a></div></div></div></div></body></html>'
            //console.log(mailinfo)
            //userlist.push("noreply.testSA@gmail.com") //檢驗備份
            //console.log(userlist)
            mailto(userlist, mailtitle, mailinfo, LocationConf._id)
            
            try {
                let chairmailtitle = '[開會成功通知]' + LocationConf.name
                let chairhtmlInfo = '主旨：開會成功通知<br>華新麗華的同仁好<br>會議名稱:' + LocationConf.name + '<br>該次會議已經完成所有開會審核，已寄送開會通知給與會人員<br>謝謝<br>'
                let chairbtnurl = 'http://localhost:3000/confInfo?id=' + LocationConf._id
                let chairmailinfo = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style> .primary { color: #BD2716; } .primary-bg { background-color: #BD2716; color: white; } .link { text-decoration: none; } .primary-bg:hover { background-color: #961F12; color: white; } .container { width: 90%; margin: auto; } .mt-2 { margin-top: 20px; } .btn { display: block; text-align: center; padding: 10px; } .info { line-height: 30px; } .m-0 { margin: 0px; }</style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><spanstyle="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+chairhtmlInfo+'</p></div><table width="100%"><tr><td width="100%"><a href="'+chairbtnurl+'" class="primary-bg btn link" style="color:white;">前往查看</a></td></tr></table></div></div></div></div></body></html>'
                console.log(chairMail)
                mailto_info(chairMail,chairmailtitle,chairmailinfo)
            }
            catch (err){
                console.log(err)
            }
            

            return {
                isSuccess: true,
                isAllow: true
            }
        } catch (error) {
            return {
                isSuccess: false
            }
        }

    } else { // 駁回→可修改後再次審核
        try {
            await Conf.updateOne({_id: confId}, {isRoomSign: 2}) // 更新會議主檔
            await RoomSign.updateOne({confId: confId}, {isSign: 2}) // 更新會議室簽核檔
            
            const ConfDB = await Conf.findOne({_id: confId})
            const ManagerDB = await User.findOne({ staffId: ConfDB.organizerId }).lean()
            let mailtitle = "[新會議審核失敗通知] "+ ConfDB.name
            let htmlInfo = "主旨：新會議 空間簽核失敗<br>您好：<br> 會議名稱：" + ConfDB.name + "<br>你所選擇的新空間駁回申請<br>特此告之您進行編輯調整<br>謝謝"
            const mailinfo = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style>.primary {color: #BD2716;}.primary-bg {background-color: #BD2716;color: white;}.link {text-decoration: none;}.primary-bg:hover {background-color: #BD2716;color: white;}.container {width: 90%;margin: auto;}.mt-2 {margin-top: 20px;}.btn{display: block;width: 100%;text-align: center;padding: 10px;}.info {line-height: 30px;}.m-0 {margin: 0px;}</style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><span style="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+htmlInfo+'</p></div><a href="http://localhost:3000/confInfo?id=' + ConfDB._id + '" class="primary-bg btn link" style="color:white;">前往確認</a></div></div></div></div></body></html>'
            const maillist = []
            //console.log(maillist + "|" + mailtitle + "|" + htmlInfo)
            maillist.push(ManagerDB.email)
            mailto_info(maillist, mailtitle,mailinfo)
            
            
            
            return {
                isSuccess: true,
                isAllow: false
            }
        } catch (error) {
            return {
                isSuccess: false
            }
        }
    }
}

module.exports = {
    handleRoomSign,
    handleChairSign
}


/////////////////////////
//    以下為功能區域    //
/////////////////////////

// 生成行事曆ics檔的方法
function create_cal(ics_main_point, ics_title, ics_descript, ics_location,
    ics_year_s, ics_month_s, ics_day_s, ics_hour_s, ics_min_s,
    ics_year_e, ics_month_e, ics_day_e, ics_hour_e, ics_min_e
) {  
    ics.createEvent({
        title: ics_title, //  標題
        description: ics_descript, //  內容文字
        location: ics_location, //  會議地點 
        organizer: {
            name: '華新雲管理系統',
            email: 'noreply.testSA@gmail.com'
        }, //  主持人
        start: [ics_year_s, ics_month_s, ics_day_s, ics_hour_s, ics_min_s], //  會議開始時間(年,月,日,小時,分鐘)
        end: [ics_year_e, ics_month_e, ics_day_e, ics_hour_e, ics_min_e]    //  會議開始時間(年,月,日,小時,分鐘) 
    }, (error, value) => {
        if (error) { //  偵錯
            console.log(error)
        }
        writeFileSync(`route/icsfile/` + ics_main_point + `.ics`, value) //  在/file資料夾內生成ics行事曆檔
    })
}

// 傳送郵件的方法 WITH ICS
function mailto(getMail, title, info, filename) { //  (收信方，標題，內文，按鈕鏈結）
    let nodemailer = require('nodemailer'); //  引入寄信的套件
    //console.log(getMail +"\n" + title + "\n" + info + "\n" + filename)
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
        html: info,
        attachments: [{
            path: 'route/icsfile/'+ filename +'.ics'
        }]
    };
    transporter.sendMail(mailOptions, function (error, info) { //  偵錯
        if (error) {
            console.log(error); //  錯誤
        } else {
            console.log('Email sent: ' + info.response); //  Console顯示寄信給...
        }
    });
}

// 傳送郵件的方法 ONLY INFO
function mailto_info(getMail, title, info) {          //  (收信方，標題{可放HTML}，內文）
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

