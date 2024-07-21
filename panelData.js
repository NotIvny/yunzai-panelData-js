import { getTargetUid } from '../miao-plugin/apps/profile/ProfileCommon.js'
import fs from 'fs'
export class characterRank extends plugin {
    constructor() {
        super({
            name: '导出面板数据',
            dsc: '导出面板数据',
            event: 'message',
            priority: -89001,
            rule: [
                {
                    reg: '#(星铁|原神)?(导出面板数据)(.*)',
                    fnc: 'uploadPanelData',
                },
                {
                    reg: '#(星铁|原神)?(导入面板数据)(.*)',
                    fnc: 'downloadPanelData',
                }
            ]
        })
    }
    async uploadPanelData(e){
        e.game = e.game || 'gs'
        let prefix = e.game == 'gs' ? '#' : '*'
        let user = e?.runtime?.user || {}
        let uid = await getTargetUid(e)
        if (!user.hasCk && !e.isMaster) {
            e.reply('为确保数据安全，目前仅允许绑定CK用户导出自己UID的面板数据，请联系Bot主人导出...')
            return true
        }
        let playerData = fs.readFileSync(`./data/PlayerData/${e.game}/${uid}.json`,'utf8')
        let ret = await this.sendApi('uploadPanelData', {uid: uid, type: e.game, data: playerData})
        switch(ret.retcode){
            case 100:
                e.reply(`导出成功，请在另一个安装此插件的Bot上输入 ${prefix}导入面板数据${uid} ，有效期十分钟~`)
                break
            default:
                e.reply(await this.dealError(ret.retcode))
        }
    }
    async downloadPanelData(e){
        e.game = e.game || 'gs'
        let user = e?.runtime?.user || {}
        let uid = await getTargetUid(e)
        if (!user.hasCk && !e.isMaster) {
            e.reply('为确保数据安全，目前仅允许绑定CK用户导入自己UID的面板数据，请联系Bot主人导入...')
            return true
        }

        let ret = await this.sendApi('downloadPanelData', {uid: uid, type: e.game})
        switch(ret.retcode){
            case 100:
                fs.writeFileSync(`./data/playerData/${e.game}/${uid}.json`, JSON.stringify(ret.data, null, 2))
                e.reply('导入成功')
                break
            default:
                e.reply(await this.dealError(ret.retcode))
        }
    }
    async sendApi(type, data){
        data = {
            type: type,
            data: data,
            version: '0.2.0'
        }
        const url = 'http://8.147.110.49:3000/api'
        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            if (!response.ok) {
                return {retcode: 105}
            }
            const ret = await response.json()
            return ret
        }
        catch(err){
            return {retcode: 105}
        }
    } 
    async dealError(retcode){
        switch(retcode){
            case -1:
                return '插件版本过低，请更新插件'
            case 104:
                return '请求超过速率限制'
            case 105:
                return '未知错误'
            case 106:
                return '数据过大，请确保导出的数据小于2MB'
            case 201:
                return '请求超过速率限制，请5分钟后重试'
            case 202:
                return '未发现该用户的数据，请重新导出面板'
            default:
                return '未知错误'
        }
    }                   
}

