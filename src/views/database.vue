<template>
    <div ref="wrap" style="margin-top: 100px">
        <!-- 云盘 -->
        <div class="yun-file" v-bind:style="{'height': $isIPad ? '332wx': '664px'}">
            <div class="pb20">
                <div class="yun-file-title flex" v-bind:style="{'height': $isIPad ? '44wx': '88px', 'margin-bottom': $isIPad ? '7wx': '15px'}">
                    <div class="title flex">
                        <span class="line" v-bind:style="{'background-color': themeColor}"></span>
                        <text class="c0 f30">{{i18n.personal}}</text>
                    </div>
                    <text class="f24 c153 fw4 pl20 pt10 pb10" @click="yunFileMoreEvent">{{i18n.All}}</text>
                </div>
                <div class="prl30">
                    <div v-if='isShowRE'>
                        <div v-if='yunFileReleArr.length != 0' v-bind:style="{'height': $isIPad ? '270wx': '540px'}">
                            <div class="flex-dr flex-ac" v-for="(item, index) in yunFileReleArr" :key='index' @click='yunFileUserEvent(item.id, item.name, item.isExitDoc, item.dir)' v-bind:style="{'height': $isIPad ? '40wx': '90px'}">
                                <bui-image :src="item.image" width="26wx" height="26wx" radius='10px' @click='yunFileUserEvent(item.id, item.name, item.isExitDoc, item.dir)'></bui-image>
                                <text class="f28 c51 fw4 pl20 lines1">{{item.name}}</text>
                            </div>
                        </div>
                        <div class="no-file flex-ac flex-jc" v-if='yunFileReleArr.length == 0'>
                            <div class="flex-dr">
                                <text class="f26 c51 fw4 pl15 center-height" v-bind:style="{'lineHeight': $isIPad ? '240wx': '480px'}">{{isErrorRele?i18n.NoneData:i18n.ErrorLoadData}}</text>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const link = weex.requireModule("LinkModule");
const linkapi = require("linkapi");
const dom = weex.requireModule('dom');
const util = require('ser/util')
const storage = weex.requireModule('storage');
const globalEvent = weex.requireModule('globalEvent');
const navigator = weex.requireModule('navigator');
export default {
    data() {
        return {
            yunFileReleArr: [],
            isErrorRele: true,
            isShowRE: false,
            channel: new BroadcastChannel('WidgetsMessage'),
            i18n: '',
            themeColor: '',
            $isIPad: false,
            urlParams: {}
        }
    },
    created() {
        this.$fixViewport();
        linkapi.getLanguage((res) => {
            this.i18n = this.$window[res]
        })
        linkapi.getThemeColor(res => {
            this.themeColor = res.background_color;
        })
        this.$isIPad = this.$isIPad()
        this.urlParams = this.resolveUrlParams(weex.config.bundleUrl)
    },
    mounted() {
        var that = this
        this.channel.onmessage = (event) => {
            if (event.data.action === 'RefreshData') {
                this.getYunFile()
            }
        }
        // this.getStorage(function () {
        that.getYunFile()
        // })
        if (this.$isAndroid()) {
            globalEvent.addEventListener("androidback", function (e) {
                navigator.close()
            });
        }
    },
    methods: {
        getStorage(callback) {
            let pageId = this.urlParams.userId ? this.urlParams.userId : ''
            let ecode = this.urlParams.ecode ? this.urlParams.ecode : 'localhost'
            storage.getItem('database20201124' + ecode + pageId, res => {
                if (res.result == 'success') {
                    var data = JSON.parse(res.data)
                    this.yunFileReleArr = data
                    this.isShowRE = true
                    this.isErrorRele = true
                    this.broadcastWidgetHeight()
                    setTimeout(() => {
                        this.getYunFile()
                    }, 2000)
                } else {
                    callback()
                }
            })
        },
        yunFileMoreEvent() {
            link.launchLinkService(['[OpenBuiltIn] \n key=ShareToMeList'], (res) => { }, (err) => { });
        },
        yunFileUserEvent(id, name, isExitDoc, item) {
            if (!isExitDoc) {
                link.startSharedDirectory([{ model: item }])
                return
            }
            if (!id) return
            if (id.indexOf('https://') > -1 || id.indexOf('http://') > -1) {
                linkapi.openLinkBroswer(name, id)
            } else {
                link.launchLinkService(['[OpenBuiltIn] \n key=DiskDetail \n diskId=' + id], (res) => { }, (err) => { });
            }
        },
        getFileImages(ext) {
            let fileImageTypes = {
                'excel': ['xls', 'xlsx'],
                'music': ['mp3', 'wma', 'wav', 'mod', 'ogg', 'm4a'],
                'pdf': ['pdf'],
                'photo': ['bmp', 'gif', 'jpeg', 'jpg', 'svg', 'png', 'psd'],
                'ppt': ['ppt', 'pptx'],
                'txt': ['txt', 'key'],
                'video': ['rm', 'rmvb', 'wmv', 'avi', 'mp4', '3gp', 'mkv', 'flv', 'mov', 'mpg'],
                'word': ['doc', 'docx', 'wps'],
                'zip': ['zip', 'rar', '7z'],
                'unknow': ['file'],
                'folder2': ['folder'],
                'team': ['team']
            }
            let fileImages = {};
            let fileTypeImages = {};
            for (let fext in fileImageTypes) {
                fileImages[fext] = '/image/' + fext + '.png';
                let arr = fileImageTypes[fext];
                if (arr.length > 0) {
                    for (let i = 0; i < arr.length; i++) {
                        fileTypeImages[arr[i]] = fext;
                    }
                }
            }
            let type = fileTypeImages[ext];
            if (type) {
                return fileImages[type];
            } else {
                return fileImages['unknow'];
            }
        },
        back: function () {
            // 返回上一个页面
            this.$pop();
        },
        getYunFile() {
            link.getServerConfigs([], (params) => {
                link.getLoginInfo([], (user) => {
                    let url = params.diskUrl ? params.diskUrl : params.diskUri
                    let objDataTo = {
                        path: '/Private',
                        orders: JSON.stringify([{ "by": "type", "ascending": true }, { "by": "name", "ascending": true }]),
                        options: JSON.stringify({ "dataLimitMode": "hasMore" }),
                        bounds: JSON.stringify({ "offset": 0, "limit": 5 })
                    }
                    linkapi.get({
                        url: url + '/openapi/file/list',
                        data: objDataTo
                    }).then((res) => {
                        try {
                            this.isShowRE = true
                            this.isErrorRele = true
                            let fileArr = [], files = [];
                            for (let index = 0; index < res.rows.length; index++) {
                                let fileObj = {}
                                const element = res.rows[index];
                                fileObj['name'] = element.name
                                fileObj['id'] = element.fileId || element.id || ''
                                if (element.type == 'D') {
                                    fileObj['isExitDoc'] = false
                                    fileObj['dir'] = element
                                    fileObj['image'] = '/image/folder2.png'
                                } else {
                                    fileObj['isExitDoc'] = true
                                    fileObj['image'] = this.getFileImages(element.extension)
                                }
                                fileArr.push(fileObj)
                            }
                            let pageId = this.urlParams.userId ? this.urlParams.userId : ''
                            let ecode = this.urlParams.ecode ? this.urlParams.ecode : 'localhost'
                            this.yunFileReleArr = fileArr
                            storage.setItem('database20201124' + ecode + pageId, JSON.stringify(fileArr))
                        } catch (error) {
                            this.isShowRE = true
                            this.isErrorRele = false
                            this.yunFileReleArr = []
                        }
                        this.broadcastWidgetHeight()
                    }, (err) => {
                        this.error()
                    })
                }, (err) => {
                    this.error()
                })
            }, () => {
                this.error()
            });
        },
        error() {
            this.yunFileReleArr = []
            this.isShowRE = true
            this.isErrorRele = false
            this.broadcastWidgetHeight()
        },
        getComponentRect(_params) {
            dom.getComponentRect(this.$refs.wrap, (ret) => {
                this.channel.postMessage({
                    widgetHeight: ret.size.height,
                    id: _params.id
                });
            });
        },
        resolveUrlParams(url) {
            if (!url) return {};
            url = url + "";
            var index = url.indexOf("?");
            if (index > -1) {
                url = url.substring(index + 1, url.length);
            }
            var pairs = url.split("&"),
                params = {};
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                var indexEq = pair.indexOf("="),
                    key = pair,
                    value = null;
                if (indexEq > 0) {
                    key = pair.substring(0, indexEq);
                    value = pair.substring(indexEq + 1, pair.length);
                }
                params[key] = value;
            }
            return params;
        },
        broadcastWidgetHeight() {
            let _params = this.$getPageParams();
            // 防止高度通知失败
            setTimeout(() => {
                this.getComponentRect(_params)
            }, 200)
            setTimeout(() => {
                this.getComponentRect(_params)
            }, 1200)
        }
    }
}
</script>

<style lang="css" src="../css/common.css"></style>
<style>
.yun-file {
    background-color: #fff;
}

.line {
    width: 5px;
    height: 36px;
    margin-right: 12px;
}

.yun-file-title {
    padding: 0 12wx;
    border-bottom: 1px solid #f2f2f2;
}

.no-file {
    height: 240wx;
    flex: 1;
}

.center-height {
    /* line-height: 240wx; */
}
</style>