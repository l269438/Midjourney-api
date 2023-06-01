import cloud from '@lafjs/cloud'
import { Midjourney } from "midjourney";
const uuid = require('uuid');
const db = cloud.database()
const Message = db.collection('midjourney_task')
const client = new Midjourney({
    ServerId: <string>process.env.SERVER_ID,
    ChannelId: <string>process.env.CHANNEL_ID,
    SalaiToken: <string>process.env.SALAI_TOKEN,
    Debug: true,
});

const TaskStatus = {
    NOT_START: 'NOT_START',
    IN_PROGRESS: 'IN_PROGRESS',
    FAILURE: 'FAILURE',
    SUCCESS: 'SUCCESS',
};


const Action = {
    IMAGINE: 'IMAGINE',
    UPSCALE: 'UPSCALE',
    VARIATION: 'VARIATION',
    RESET: 'RESET',
};

async function resultData(code = 0, msg = '', data = null) {
    return { code, msg, data }
}


export default async function (ctx: FunctionContext) {
    let { prompt, webhook, state, action, content } = ctx.body;
    if (!webhook || !prompt || !action) {
        return resultData(400, '缺少必要的参数：prompt 或 webhook,action');
    }
    const lastMessage = await Message.where({
        status: TaskStatus.NOT_START,
    }).get()

    const trans_result = await cloud.invoke('baiduTranslate', { body: { prompt: prompt } })

    const id = uuid.v4()
    const promptEn = trans_result.data
    let prompts = `[${id}] ${promptEn}`
    console.log(prompts)


    client.Imagine(prompts)

    const data = {
        prompt,
        taskId: id,
        webhook,
        promptEn,
        action: action,
        state,
        status: TaskStatus.NOT_START,
        submitTime: Date.now(),
        createTime: getCurrentTime()
    }
    await Message.add(data)
    // return { data2 }
    return { prompt, promptEn, taskId: id, length: lastMessage.data.length }
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
