const express = require('express')
const {
    ensureAuthenticated
} = require('../config/auth')
const {
    handleIndex,
    handleChairIndex,
    handleCreateIndex,
    handleRoomIndex,
    handleUserIndex,
    handleRoomFilterIndex,
    handleUserFilterIndex
} = require('../handler/handleIndex')
const handleCreate = require('../handler/handleCreate')
const handleNoticJoin = require('../handler/handleNoticJoin')
const handleCreateRoom = require('../handler/handleCreateRoom')
const handleInfo = require('../handler/handleInfo')
const {handleInfoRoom} = require('../handler/handleInfoRoom')
const handleUpdate = require('../handler/handleUpdate')
const handleDelete = require('../handler/handleDelete')
const handleDeleteRoom = require('../handler/handleDeleteRoom')
const handleRoomUpdate = require('../handler/handleRoomUpdate')
const {
    noticeList,
    enterNoticeConf
} = require('../handler/handleNotice')
const {
    getUnCheckNoti,
    getUsersRooms
} = require('../handler/getUsual')
const handleUpdateRoom = require('../handler/handleUpdateRoom')

const router = express.Router()


// 會議列表
router.get('/', ensureAuthenticated, async (req, res) => {

    console.log(req.session)
    console.log('User', req.user)

    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    const confsData = await handleIndex(req.user)

    res.render('index', {
        name: req.user.name,
        title: '會議列表',
        confsData,
        users,
        noticeNum,
        confRooms
    })
})

// 主持會議列表
router.get('/chair', ensureAuthenticated, async (req, res) => {

    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    const confsData = await handleChairIndex(req.user)

    res.render('chairIndex', {
        name: req.user.name,
        title: '我主持的會議列表',
        confsData,
        users,
        noticeNum,
        confRooms
    })
})

// 承辦會議列表
router.get('/mycreate', ensureAuthenticated, async (req, res) => {

    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    const confsData = await handleCreateIndex(req.user)

    res.render('mycreate', {
        name: req.user.name,
        title: '我創建的會議列表',
        confsData,
        users,
        noticeNum,
        confRooms
    })
})

// 新空間列表
router.get('/roomlist', ensureAuthenticated, async (req, res) => {

    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    const confsData = await handleRoomIndex(req.user)
    const confsDataFilter = await handleRoomFilterIndex(req.user)

    res.render('roomindex', {
        name: req.user.name,
        title: '新空間列表',
        confsData,
        confsDataFilter,
        users,
        noticeNum,
        confRooms,
    })
})

// 用戶列表
router.get('/usermanage', ensureAuthenticated, async (req, res) => {

    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    const confsData = await handleUserIndex(req.user)
    const confsFilter = await handleUserFilterIndex(req.user)

    res.render('userList', {
        name: req.user.name,
        title: '用戶列表',
        confsData,
        confsFilter,
        users,
        noticeNum,
        confRooms
    })
})

// 會議資訊
router.get('/startmeeting', ensureAuthenticated, async (req, res) => {
    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    const {
        confInfo,
        roomInfo,
        attendeeList,
        minutes,
        organizer,
        explain,
        chairSign,
        roomSign,
        identity
    } = await handleInfo(req.query.id, req.user, users, confRooms)
    /*
    const {
        confInfo
    } = await handleConfId(req.query.id)
    */
    res.render('meetingChair', {
        name: req.user.name,
        title: '會議視窗',
        viewid: req.query.id,
        confInfo,
        roomInfo,
        explain,
        attendeeList,
        minutes,
        organizer: organizer.name,
        chairSign,
        roomSign,
        identity,
        users,
        confRooms,
        noticeNum
    })
    //console.log(confInfo)
})

router.get('/joinmeet', ensureAuthenticated, async (req, res) => {
    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    const {
        confInfo,
        roomInfo,
        attendeeList,
        minutes,
        organizer,
        explain,
        chairSign,
        roomSign,
        identity
    } = await handleInfo(req.query.id, req.user, users, confRooms)
    /*
    const {
        confInfo
    } = await handleConfId(req.query.id)
    */
    res.render('meetingUser', {
        name: req.user.name,
        title: '會議視窗',
        viewid: req.query.id,
        confInfo,
        roomInfo,
        explain,
        attendeeList,
        minutes,
        organizer: organizer.name,
        chairSign,
        roomSign,
        identity,
        users,
        confRooms,
        noticeNum
    })
    //console.log(confInfo)
})

router.get('/notic_join', ensureAuthenticated, async (req, res) => {
    handleNoticJoin(req.query.id, req.user).then((data) => {
        if (data) {
            req.flash('success', '您已成功舉發送')
        } else {
            req.flash('warning', '發送失敗，請再試一次')
        }
        res.redirect('/startmeeting?id='+req.query.id)
    })
})


/////////////////////////
//   以下為資料庫變更   //
/////////////////////////

// 新增會議
router.post('/create', ensureAuthenticated, (req, res) => {
    handleCreate(req.body, req.user).then((data) => {
        if (data) {
            req.flash('success', '您已成功舉辦一個會議')
        } else {
            req.flash('warning', '舉辦會議失敗，請再試一次')
        }
        res.redirect('/')
    })
})

// 會議資訊
router.get('/confInfo', ensureAuthenticated, async (req, res) => {

    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    const {
        confInfo,
        roomInfo,
        attendeeList,
        minutes,
        organizer,
        explain,
        chairSign,
        roomSign,
        identity
    } = await handleInfo(req.query.id, req.user, users, confRooms)

    res.render('info', {
        name: req.user.name,
        title: '會議資訊',
        confInfo,
        roomInfo,
        explain,
        attendeeList,
        minutes,
        organizer: organizer.name,
        chairSign,
        roomSign,
        identity,
        users,
        confRooms,
        noticeNum
    })
})

// 編輯會議
router.post('/confInfo', ensureAuthenticated, (req, res) => {
    // console.log(req.body)

    if (Object.keys(req.body).length === 1) { // 表單只有傳回一個元素(只有roomId) -> 會議處於只能編輯地點的狀態(場地被駁回)
        handleRoomUpdate(req.query.id, req.body).then((data) => {
            if (data) {
                req.flash('success', '您已成功修改使用空間')
            } else {
                req.flash('warning', '修改失敗，請再試一次')
            }
            res.redirect(`/confInfo?id=${req.query.id}`)
        })
    } else {
        handleUpdate(req.query.id, req.body).then((data) => {
            if (data) {
                req.flash('success', '您已成功修改會議資料')
            } else {
                req.flash('warning', '修改失敗，請再試一次')
            }
            res.redirect(`/confInfo?id=${req.query.id}`)
        })
    }
})

// 刪除會議
router.get('/delete', ensureAuthenticated, (req, res) => {
    handleDelete(req.query.id).then((data) => {
        if (data) {
            req.flash('success', '您已刪除一個會議')
        } else {
            req.flash('warning', '刪除失敗，請再試一次')
        }
        res.redirect('/')
    })

})

//展示空間
router.get('/roominfo', ensureAuthenticated, async (req, res) => {

    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const {
        users,
        confRooms
    } = await getUsersRooms()
    
    const confsData = await handleInfoRoom(req.user, req.query.id)
    
    res.render('roominfo', {
        name: req.user.name,
        title: '新空間編輯',
        confsData,
        users,
        noticeNum,
        confRooms
    })
})
//修改新空間
router.post('/roominfo', ensureAuthenticated, async (req, res) => {
    handleUpdateRoom(req.query.id, req.body).then((data) => {
        if (!data) {
            req.flash('success', '您已成功修改新空間資料')
        } else {
            req.flash('warning', '修改失敗，請再試一次')
        }
        res.redirect(`/roomlist`)
    })

})
//刪除新空間
router.get('/deleteRoom', ensureAuthenticated, (req, res) => {
    handleDeleteRoom(req.query.id).then((data) => {
        if (data) {
            req.flash('success', '您已刪除一個新空間')
        } else {
            req.flash('warning', '刪除失敗，請再試一次')
        }
        res.redirect('/roomlist')
    })

})
// 新增空間
router.post('/createRoomFunc', ensureAuthenticated, (req, res) => {
    handleCreateRoom(req.body, req.user).then((data) => {
        if (data) {
            req.flash('success', '您已成功建立一個新空間')
        } else {
            req.flash('warning', '新空間建立失敗，請再試一次')
        }
        res.redirect('/roomlist')
    })
})


// 通知中心
router.get('/notice', ensureAuthenticated, async (req, res) => {

    const noticeNum = await getUnCheckNoti(req.user.staffId)
    const notifications = await noticeList(req.user.staffId)

    res.render('notification', {
        name: req.user.name,
        title: '通知中心',
        notice: notifications,
        noticeNum
    })

})

// 點擊通知中心的會議
router.get('/notice/:noticeId', ensureAuthenticated, (req, res) => {

    enterNoticeConf(req.params.noticeId).then((result) => {
        return res.redirect(`/confInfo?id=${req.query.confId}`)
    }).catch((error => {
        return console.log(error)
    }))
})

module.exports = router
