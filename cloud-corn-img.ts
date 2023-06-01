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
import { S3 } from '@aws-sdk/client-s3';
const BUCKET = 'bucketName';

async function uploadImage(imageUrl) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type');
    const filename = uuid.v4() + '.png';
    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2); // 月份从 0 开始，因此需要 +1
    const day = ('0' + now.getDate()).slice(-2);

    const folderPath = `${year}/${month}/${day}`;

    // 构造文件夹路径
    const newPath = `${folderPath}/${filename}`;

    console.log(newPath)

    console.log("生成的ImageUrl:" + `https://xxx/${newPath}`)

    const res = await ossClient.putObject({
        Bucket: BUCKET,
        Key: newPath,
        Body: buffer,
        ContentType: contentType,
    });


    return `https://xxx/${newPath}`;
}

const Action = {
    IMAGINE: 'IMAGINE',
    UPSCALE: 'UPSCALE',
    VARIATION: 'VARIATION',
    RESET: 'RESET',
};

const ossClient = new S3({
    region: cloud.env.OSS_REGION,
    endpoint: cloud.env.OSS_EXTERNAL_ENDPOINT,
    credentials: {
        accessKeyId: cloud.env.OSS_ACCESS_KEY,
        secretAccessKey: cloud.env.OSS_ACCESS_SECRET,
    },
    forcePathStyle: true,
});

const TaskStatus = {
    NOT_START: 'NOT_START',
    IN_PROGRESS: 'IN_PROGRESS',
    FAILURE: 'FAILURE',
    SUCCESS: 'SUCCESS',
};

export default async function (ctx: FunctionContext) {
    const lastMessage = await Message.where({
        status: TaskStatus.NOT_START,
        action: Action.IMAGINE
    }).orderBy("createTime", "asc").get()
    if (lastMessage.data && Array.isArray(lastMessage.data) && lastMessage.data.length > 0) {
        console.log(JSON.stringify(lastMessage))
        console.log("进入");
        for (const message of lastMessage.data) {
            console.log("循环");
            const result = await client.FilterMessages(message.taskId);
            const fileUrl = await uploadImage(result.uri);
            if (!fileUrl) {
                continue
            }
            console.log(fileUrl);
            result.uri = fileUrl
            console.log(message.webhook);
            console.log(result);
            const data = {
                ...result,
                state: message.state,
                promptEn: message.promptEn,
                prompt: message.prompt,
                content: result.content
            };
            fetch.post(message.webhook, data);

            Message.where({ taskId: message.taskId }).update({
                status: TaskStatus.SUCCESS,  // 更新为成功状态
                uri: fileUrl,
                hash: result.hash,
                messageId: result.id,
                content: result.content
            });
        }
    }

    const upMessage = await Message.where({
        status: TaskStatus.NOT_START,
        action: Action.UPSCALE
    }).orderBy("createTime", "asc").get()

    if (upMessage.data && Array.isArray(upMessage.data) && upMessage.data.length > 0) {
        console.log(JSON.stringify(upMessage))
        console.log("进入U");
        for (const message of upMessage.data) {
            console.log("循环:" + JSON.stringify(message));
            const parentId = message.parentId
            if (!parentId) {
                continue
            }
            const parentMessage = await Message.where({
                messageId: parentId
            }).orderBy("createTime", "desc").getOne()
            if (!parentMessage) {
                continue
            }
            message.content = parentMessage.data.content + "** - Image"; // 然后你可以使用message
            const result = await client.FilterMessages(message.content);
            console.log(result)
            const fileUrl = await uploadImage(result.uri);
            console.log(fileUrl);
            result.uri = fileUrl
            console.log(message.webhook);
            const data = {
                ...result,
                state: message.state,
                action: message.action,
                content: parentMessage.data.content
            };
            fetch.post(message.webhook, data);

            Message.where({ taskId: message.taskId }).update({
                status: TaskStatus.SUCCESS,  // 更新为成功状态
                uri: fileUrl,
                hash: result.hash,
                messageId: result.id
            });
        }
    }

    const vMessage = await Message.where({
        status: TaskStatus.NOT_START,
        action: Action.VARIATION
    }).orderBy("createTime", "asc").get()
    if (vMessage.data && Array.isArray(vMessage.data) && vMessage.data.length > 0) {
        console.log(JSON.stringify(lastMessage))
        console.log("进入V");
        for (const message of vMessage.data) {
            console.log("循环:" + JSON.stringify(message));
            const parentId = message.parentId
            if (!parentId) {
                continue
            }
            const parentMessage = await Message.where({
                messageId: parentId
            }).orderBy("createTime", "desc").getOne()
            if (!parentMessage) {
                continue
            }
            console.log(parentMessage.data)
            message.content = parentMessage.data.content + "** - Variations";
            console.log(message.content)
            const result = await client.FilterMessages(message.content);
            console.log(result)
            const fileUrl = await uploadImage(result.uri);
            console.log(fileUrl);
            result.uri = fileUrl
            console.log(message.webhook);
            const data = {
                ...result,
                state: message.state,
                action: message.action,
                promptEn: parentMessage.data.promptEn,
                prompt: parentMessage.data.prompt,
                content: parentMessage.data.content
            };
            fetch.post(message.webhook, data);

            Message.where({ taskId: message.taskId }).update({
                status: TaskStatus.SUCCESS,  // 更新为成功状态
                uri: fileUrl,
                hash: result.hash,
                messageId: result.id
            });
        }
    }
    return null
}
