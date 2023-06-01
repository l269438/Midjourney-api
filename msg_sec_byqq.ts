import cloud from '@lafjs/cloud'

export async function main(ctx: FunctionContext) {
    console.log("传入消息:" + ctx.body.message)
    const message = ctx.body.message // 测试时注释本行
    if (!message) {
        return {
            errCode: 0,
            msg: "请传入文本后再尝试"
        }
    }
    const access_token = await getCachedQqAccessToken()
    const api_url = `https://api.q.qq.com/api/json/security/MsgSecCheck?access_token=${access_token}`
    const res = await cloud.fetch.post(`${api_url}`, {
        appid: cloud.env.QQ_APPID,
        content: message
    })
    return res.data
}

// 获取QQ小程序access_token
async function getQqAccessToken() {
    let token_url = `https://api.q.qq.com/api/getToken?grant_type=client_credential&appid=${cloud.env.QQ_APPID}&secret=${cloud.env.QQ_APPSECRET}`;
    let accessToken = (await cloud.fetch(token_url)).data
    if (accessToken.errcode == 0) {
        delete accessToken.errcode
        // 过期时间改成7000秒后
        accessToken.expires_in = 7000000 + new Date().getTime()
        return accessToken
    }
}

// 获取保存在全局缓存的QQ小程序access_token
async function getCachedQqAccessToken() {
    let QQ_access_token = await cloud.shared.get("QQ_access_token")
    //判断本地缓存中是否存有 AccessToken
    if (!QQ_access_token) {
        let access_token = await getQqAccessToken();
        console.log(access_token)
        await cloud.shared.set("QQ_access_token", access_token)
        return access_token.access_token
    } else {
        let {
            expires_in,
            access_token
        } = QQ_access_token;
        const nowTime = new Date().getTime()
        if (nowTime >= expires_in) {
            // 已过期，并重新获取
            let access_token = await getQqAccessToken();
            await cloud.shared.set("QQ_access_token", access_token)
            return access_token.access_token
        } else {
            //查询的数据有效，直接返回数据
            return access_token
        }
    }
}
