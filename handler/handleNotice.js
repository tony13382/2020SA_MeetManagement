const moment = require('moment')
const Notice = require('../models/schema/notice')
const User = require('../models/schema/user')
const Conf = require('../models/schema/conference')

// 發送會議通知`
async function sendNotice(confId, senderStaffId, employees) {
    // console.log(employees)

    let employee
    let mailList = []
    try {
        if (typeof (employees) === 'string') { // 只有一個被通知者
        
            
            // 生成通知檔的資料
            employee = Notice({confId: confId, // 會議id
                senderStaffId, // 發送通知者的員工編號
                staffId: employees, // 被通知者的員工編號
                isCheck: 0, // 是否看過通知，預設為 0
                isExist: 1
            })
            
            // 將資料保存到通知檔
            employee.save().then((data) => {
                console.log(data)
            })

            let mailfinder = await User.findOne({ staffId: employee, isExist: 1 }).lean()
            mailList.push(mailfinder.email)

        } else { // 多被通知者
            for (let item of employees) {
                // 生成通知檔的資料
                employee = Notice({ confId: confId, senderStaffId, staffId: item, isCheck: 0, isExist: 1 })

                // 將資料保存到通知檔
                employee.save().then((data) => {
                    console.log(data)
                })
                let mailfinder = await User.findOne({ staffId: item, isExist: 1 }).lean()
                mailList.push(mailfinder.email)
            }
        }

        let confdb = await Conf.findOne({_id: confId}).lean()
        mailTitle = '[會議記錄已上傳通知]' + confdb.name
        let htmlInfo = '主旨：會議記錄<br>華新麗華的同仁好<br>會議名稱：' + confdb.name + '<br>該會議的記錄已上傳至系統<br>請各位同仁留意<br>謝謝'
        let btnurl = 'http://localhost:3000/confinfo?id=' + confdb._id
        mailInfo = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><style> .primary { color: #BD2716; } .primary-bg { background-color: #BD2716; color: white; } .link { text-decoration: none; } .primary-bg:hover { background-color: #961F12; color: white; } .container { width: 90%; margin: auto; } .mt-2 { margin-top: 20px; } .btn { display: block; text-align: center; padding: 10px; } .info { line-height: 30px; } .m-0 { margin: 0px; }</style></head><body class="m-0"><div class="row"><div id="Area_logo" style="text-align: center; background-color: #ecf4f3; padding-top: 10px; padding-bottom: 10px;" class="col-sm-12 primary"><span style="font-size: 30px; display: inline;">華新雲</span><spanstyle="font-size: 20px; display: inline;">會議管理系統</span></div></div><div class="container"><div class="row"><div class="card" style="width: 100%; max-width: 100%;"><div class="col s12 mt-2"><p class="info" style="font-size: 20px;">'+htmlInfo+'</p></div><table width="100%"><tr><td width="100%"><a href="'+btnurl+'" class="primary-bg btn link" style="color:white;">前往確認</a></td></tr></table></div></div></div></div></body></html>'
        mailto(mailList, mailTitle, mailInfo)


        return true

    } catch (error) {
        console.log(error)
        return false
    }

}

// 通知中心
async function noticeList(staffId) {

    // 取得自己收到的通知
    let notifications = await Notice.find({ staffId: staffId, isExist: 1 }).lean().sort({ 'createdAt': -1 })

    for (let [index, item] of notifications.entries()) {
        // 轉換時間格式
        notifications[index].sendTime = moment(item.createdAt).format('YYYY-MM-DD HH:mm')
        // 從員工檔中取得寄件人的資料
        notifications[index].sender = await User.findOne({ staffId: item.senderStaffId }).lean()
        // 從會議主檔中取得會議資料
        notifications[index].confInfo = await Conf.findOne({ _id: item.confId }).lean()
    }

    // console.log(notifications)

    // 回傳通知資料
    return notifications
}

// 查看通知中心的會議
function enterNoticeConf(noticeId) {
    const updateItem = { isCheck: 1 }
    // 將通知檔的 isCheck 改為 1
    return Notice.updateOne({ _id: noticeId }, updateItem)
}

module.exports = { sendNotice, noticeList, enterNoticeConf }


/////////////////////////
//    以下為功能區域    //
/////////////////////////

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