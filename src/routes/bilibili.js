let express = require('express');
const { route } = require('./music');
const axios = require("axios");
const puppeteer = require('puppeteer');  
const { getToken , getAudioStream } = require('../utils/util')
console.log(puppeteer);
let router = express.Router();
let cookies = [];

router.get('/search',async (req,res) => {
    const query = req.query;
    const params = getToken(query)
    console.log(query);
    params.then(async tokenUrl => {
        console.log(tokenUrl);
        let {data} = await axios.get('https://api.bilibili.com/x/web-interface/wbi/search/all/v2?' + tokenUrl,{
            headers: {
                'cookie':cookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
        })
        res.end(JSON.stringify(
            {
                data:data.data.result[11].data,
                code: 200
            }
            ))
        // res.end('bilibili搜索')
    })
    .catch(err => {
        console.log(err);
        res.end(JSON.stringify({
            code: 500,
            data: 'request error'
        }))
    })

})

router.get('/audio',async (req,res) => {
    const query = req.query;
    const downloadList = await getAudioStream(query.bvid,'mp3','title');
    // console.log(downloadList);
    if (downloadList.length === 1) {

        const audioStream = axios.get(downloadList[0].baseUrl, {
            headers: {
              Referer:`https://www.bilibili.com/video/${query.bvid}`,
            },
            responseType: "stream",
        }).then(response => {
            // console.log(response.data);
            return response.data
        }).catch(err => {
            // 处理错误  
            console.error('Error fetching video stream:', err);  
            res.writeHead(500);  
            res.end('Internal Server Error');  
        })

        audioStream.then(stream => {  
            // 设置响应头，告诉客户端这是一个视频流  
            res.writeHead(200, {  
              'Content-Type': 'audio/mpeg',  
              'Content-Disposition': 'inline; filename="audio.mp3"', // 告诉浏览器以内联方式处理，并提供文件名
              // 其他可能需要的头信息，比如Transfer-Encoding等  
            });  
        
            // 将视频流通过管道传输到响应流  
            stream.pipe(res);  
        })
    }
    else {
        res.writeHead(500); 
        res.end('Not supporting multi-level playback')
    }

})

getBilibiliCookie();

async function getBilibiliCookie() {
    const browser = await puppeteer.launch({  
        headless: true, // 设置为 true 则在无头模式下运行  
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // 可能需要额外的参数来在某些环境中运行  
      });  
    const page = await browser.newPage();
    // 导航到 Bilibili 登录页面  
    await page.goto('https://bilibili.com');  
    cookies = await page.cookies();
    // 使用map方法将每个cookie对象转换为name=value格式的字符串  
    const cookieStrings = cookies.map(cookie => `${cookie.name}=${cookie.value}`);  
  
    // 使用join方法将字符串连接起来，以逗号分隔  
    cookies = cookieStrings.join(',');  
    console.log(cookies);
}

module.exports = router
