# MidJourney-api

## 项目优势
- 采用云函数开发(免费)
- 节省海外服务器资源
- 自带OSS解决国内图片无法访问

## 项目体验

| QQ频道                                                    | 微信公众号                                                      |                                        微信号                                        |
|:--------------------------------------------------------|:-----------------------------------------------------------|:---------------------------------------------------------------------------------:|
| <img src="img.png" alt="Image" width="200" height="200">| <img src="img_1.png" alt="Image" width="300" height="100"> | <img src="img_2.png" alt="Image" width="200" height="200"> |

## 配合服务接入微信机器人
https://github.com/l269438/Midjourney-WeChatBot

## 现有功能
- [x] 支持 Imagine 指令和相关UPSCALE、VARIATION操作
- [x] 支持中文 prompt 翻译，需配置百度翻译
- [x] prompt 敏感词判断

## 使用方法

### 搭建服务

####登录 https://laf.dev

![img.png](img/img.png)

#### 新建服务
![img_1.png](img/img_1.png)
![img_2.png](img/img_2.png)

#### 安装依赖
![img_3.png](img/img_3.png)
![img_4.png](img/img_4.png)

### 构建函数：cloud-mid-img(生成图片函数)

![img_5.png](img/img_5.png)

![img_6.png](img/img_6.png)
#### 将cloud-mid-img.ts代码复制到函数中，点击发布

### 构建函数：cloud-corn-img(定时任务函数)

![img_7.png](img/img_7.png)

#### 将cloud-corn-img.ts代码复制到函数中，点击发布

### 构建函数：cloud-mid-ex(变化图片函数)

![img_8.png](img/img_8.png)

#### 将cloud-mid-ex.ts代码复制到函数中，点击发布

### 构建函数baiduTranslate(翻译函数)
需要在百度翻译Api 获取 appID和 SECRET https://api.fanyi.baidu.com

![img_2.png](img2/img.png)

#### 将baiduTranslate.ts代码复制到函数中，点击发布

![img_1.png](img2/img_1.png)

![img_3.png](img2/img_3.png)

#### 将获取的环境变量写入

### 构建违禁词检测函数
需要在QQ开放平台 获取 appID和 SECRET https://q.qq.com/#/app/bot

![img_4.png](img2/img_4.png)

### 将msg_sec_byqq.ts代码复制函数中，点击发布

![img_5.png](img2/img_5.png)

#### 将获取的环境变量写入

### 获取discord数据

#### 在自己频道里按 F12 打开页面选择 Fetch 在过滤框输入 lib 找到下面authorization
![img_7.png](img2/img_7.png)

#### 获取自己频道的serverId 和 channeId 
![img_8.png](img2/img_8.png)


![img_9.png](img2/img_9.png)
#### 把获取的值存入环境变量

### 构建存储

#### 新建数据库midjourney-task
![img_11.png](img2/img_11.png)
![img_12.png](img2/img_12.png)

#### 新建存储桶midjourney-task
![img_13.png](img2/img_13.png)
![img_14.png](img2/img_14.png)
![img_15.png](img2/img_15.png)
#### 保存存储桶名：上图左侧 和 托管地址：上图右侧 ，找到之前创建的
![img_16.png](img2/img_16.png)
#### 改成存储桶名

![img_17.png](img2/img_17.png)
#### 改成托管地址

![img_18.png](img2/img_18.png)
![img_19.png](img2/img_19.png)
#### 新建触发器 如图设置

### 测试
### 生成图片

![img_20.png](img2/img_20.png)

![img_21.png](img2/img_21.png)
```json
curl https://xxxxx/cloud-mid-img
{
  "webhook": "website获取测试的回调地址",
  "action": "IMAGINE",
  "prompt": "美丽的女孩"
}
```
![img_22.png](img2/img_22.png)
#### 等待生成完成后回调地址就有任务显示且图片能够国内访问

### 变形图片

![img_23.png](img2/img_23.png)
```json
curl https://xxxxx/cloud-mid-ex
{
  "webhook": "与之前website的网址一样",
  "taskId": "刚刚website在返回的id",
  "button": "按钮包含V1 V2 V3 V4 U1 U2 U3 U4",
  "action": "什么操作包含 VARIATION UPSCALE"
}
```
![img_24.png](img2/img_24.png)
#### 等待生成完成后回调地址就有任务显示且图片能够国内访问
