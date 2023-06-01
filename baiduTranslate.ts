import cloud from '@lafjs/cloud'
import crypto from 'crypto';
function containsChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
}

async function translateToEnglish(prompt) {
    if (!containsChinese(prompt)) {
        return prompt;
    }
    const appid = process.env.BAIDU_APPID;
    const appSecret = process.env.BAIDU_SECRET;

    const salt = Math.random().toString().slice(2, 7);
    const sign = crypto
        .createHash('md5')
        .update(appid + prompt + salt + appSecret)
        .digest('hex');

    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?from=zh&to=en&appid=${appid}&salt=${salt}&q=${encodeURIComponent(prompt)}&sign=${sign}`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const result = await response.json();
            if (result.error_code) {
                throw new Error(result.error_code + ' - ' + result.error_msg);
            }
            return result.trans_result[0].dst;
        } else {
            throw new Error(response.status + ' - ' + response.statusText);
        }
    } catch (error) {
        console.warn('调用百度翻译失败:', error.message);
        return prompt;
    }
}

export default async function (ctx: FunctionContext) {
    let { prompt } = ctx.body;
    if (!prompt) {
        return {};
    }
    if (!containsChinese(prompt)) {
        return prompt;
    }
    const data = await translateToEnglish(prompt)
    return { data }
}
