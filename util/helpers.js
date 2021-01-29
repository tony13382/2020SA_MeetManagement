// 自定義 handlebars 方法

// 判斷參與身分
function getAttendType(type) {
    if (type === 1) {
        return '出席'
    } else if (type === 2) {
        return type = '列席'
    }
    else
        return type = 'ERR'
}

// 判斷參與身分
function getAnotherType(type) {
    if (type === 1) {
        return `<option value="2">列席</option>`
    }
    return `<option value="1">出席</option>`
}

// 判斷與會模式
function getAttendMode(mode) {
    switch (mode) {
        case 0:
            return `<span class="badge badge-secondary">待確定</span>`
        case 1:
            return `<span class="badge badge-success">在場</span>`
        case 2:
            return `<span class="badge badge-info">線上</span>`
        case 3:
            return `<span class="badge badge-light">離線</span>`
    }
}

// 判斷審核狀態
function getSign(sign) {
    switch (sign) {
        case 0:
            return `<span class="badge badge-secondary">待審核</span>`
        case 1:
            return `<span class="badge badge-success">審核通過</span>`
        case 2:
            return `<span class="badge badge-danger">駁回</span>`
    }
}

function setShow(chair, location){
    if (chair == location ) {
        if(chair == 1 ) {
            return ``
        }
        else {
            return `display: none`
        }
    }
    else {
        return `display: none`
    }
}

// 判斷是否相同
function equal(a, b, options) {
    if (a == b) {
        return options.fn(this)
    } else {
        return options.inverse(this)
    }
}

// 判斷主持人是否可以簽核
function allowChairSign(isChairSign, options) {
    if (isChairSign === 0 || isChairSign === 2) {
        return options.fn()
    } else {
        return options.inverse()
    }
}

// 判斷空間負責人是否可以簽核
function allowRoomSign(isChairSign, isRoomSign, options) {
    if (isChairSign === 1 && isRoomSign !== 1) {
        return options.fn()
    } else {
        return options.inverse()
    }
}

// 判斷會議是否可以編輯
function allowEdit(isChairSign, isRoomSign, options) {
    if (((isChairSign === 0 || isChairSign === 2) && isRoomSign === 0) || (isChairSign === 1 && isRoomSign === 2)) {
        return options.fn()
    } else {
        return options.inverse()
    }
}

// 判斷空間以外的項目是否可以編輯
function allowEditOther(isChairSign, isRoomSign, options) {
    // 如果主持人已簽核，但使用空間被駁回 -> 只能編輯使用空間
    if (isChairSign === 1 && isRoomSign === 2) { // 不可編輯
        return options.inverse()
    } else { // 可編輯
        return options.fn()
    }
}

// 判斷是否可以選擇與會模式
function allowChooseMode(isChairSign, isRoomSign, options) {
    if (isChairSign === 1 && isRoomSign === 1) {
        return options.fn()
    } else {
        return options.inverse()
    }
}


module.exports = {
    getAttendType,
    getAnotherType,
    getAttendMode,
    getSign,
    equal,
    allowChairSign,
    allowRoomSign,
    allowEdit,
    allowEditOther,
    allowChooseMode,
    setShow
}