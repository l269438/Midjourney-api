import cloud from '@lafjs/cloud'
import { Midjourney, MJMessage } from "midjourney";
const uuid = require('uuid');
const fetch = cloud.fetch
const db = cloud.database()
const Message = db.collection('midjourney_task')
const client = new Midjourney({
    ServerId: <string>process.env.SERVER_ID,
    ChannelId: <string>process.env.CHANNEL_ID,
    SalaiToken: <string>process.env.SALAI_TOKEN,
    Debug: true,
});

const Action = {
    IMAGINE: 'IMAGINE',
    UPSCALE: 'UPSCALE',
    VARIATION: 'VARIATION',
    RESET: 'RESET',
};

const TaskStatus = {
    NOT_START: 'NOT_START',
    IN_PROGRESS: 'IN_PROGRESS',
    FAILURE: 'FAILURE',
    SUCCESS: 'SUCCESS',
};


function getActionIndex(input) {
    const regex = /^[uUvV]([1-4])$/;  // 正则表达式，匹配 "u" 或 "U" 后面跟着 1 到 4 的数字
    const match = input.match(regex);
    if (match) {
        return parseInt(match[1]);  // 如果匹配成功，返回该数字
    }
    return null;
}

async function upscale(taskId, index, hash) {
    client.UpscaleApi(index, taskId, hash)
}

async function variation(taskId, index, hash) {
    client.VariationApi(index, taskId, hash)
}


export default async function (ctx: FunctionContext) {
    let { webhook, state, action, button, taskId } = ctx.body;
    console.log(JSON.stringify(ctx.body))
    if (!webhook || !button || !taskId || !action) {
        return { code: 400, error: '缺少必要的参数：taskId 或 webhook,button,action' };
    }
    const lastMessage = await Message.where({
        status: TaskStatus.NOT_START,
    }).get()
    console.log(lastMessage.data)

    const id = uuid.v4()
    console.log(taskId)
    const message = await Message.where({
        messageId: taskId
    }).getOne()
    if (!message.data) {
        return { code: 401, error: '任务不存在' };
    }
    console.log(JSON.stringify(message))
    const index = await getActionIndex(button)
    switch (action) {
        case Action.UPSCALE:
            upscale(taskId, index, message.data.hash)
            break;
        case Action.VARIATION:
            variation(taskId, index, message.data.hash)
            break;
    }
    const data = {
        taskId: id,
        webhook,
        action: action,
        state,
        status: TaskStatus.NOT_START,
        submitTime: Date.now(),
        createTime: getCurrentTime(),
        index,
        parentId: taskId,
        content: message.data.content
    }
    await Message.add(data)
    return { taskId: taskId, length: lastMessage.data.length }
}


function getCurrentTime() {
    let now = Date.now();

    // 定义你的时区偏移量，比如你在东八区（北京时间），偏移量应该是 +8
    let timezoneOffsetHours = 8;
    // 转换偏移量为毫秒
    let timezoneOffsetMilliseconds = timezoneOffsetHours * 60 * 60 * 1000;

    // 添加时区偏移量
    let correctedTime = new Date(now + timezoneOffsetMilliseconds);

    return correctedTime.toISOString();
}
