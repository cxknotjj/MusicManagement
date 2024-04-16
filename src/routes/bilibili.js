let express = require('express');
const { route } = require('./music');
const axios = require("axios");
const { getToken , getAudioStream } = require('../utils/util')
let router = express.Router();
const fs = require('fs');
const path = require('path');
const { log } = require('console');
let public = path.join(__dirname,'../../public');
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
    if (downloadList[0] && downloadList.length >= 1) {
        let url = path.join(public,'/'+query.bvid+'.mp3')
        console.log(url);
        fs.exists(url,async function(exists) {
            if(!exists) {
                await axios.get(downloadList[0].baseUrl, {
                    headers: {
                      Referer:`https://www.bilibili.com/video/${query.bvid}`,
                      Range: `bytes=0-`,
                    },
                    responseType: "stream",
                }).then(async function (response) {
                    const pipeline = require('stream').pipeline;
                    const writer = fs.createWriteStream(url);
                    pipeline(response.data, writer, (err) => {
                        if (err) {
                            console.error('Error writing audio file:', err);
                            res.writeHead(500);
                            res.end('Internal Server Error');
                        } else {
                            console.log('Audio file saved successfully');
                        }
                    });
                    // const fileStream = fs.createReadStream(response.data);
                    // res.writeHead(206, {
                    //     'Content-Type': 'audio/mp3',
                    //     'Content-Length': response.headers['content-length'],
                    //     'Content-Range': response.headers['content-range']
                    // });
                    // fileStream.pipe(res);
        
                    // Send audio data to client while writing to file system
                    response.data.on('data', (chunk) => {
                        res.write(chunk);
                    });
        
                    response.data.on('end', () => {
                        res.end();
                    });
                }).catch(err => {
                    console.error('Error fetching video stream:', err);
                    res.writeHead(500);
                    res.end('Internal Server Error');
                });
 
            }else {
                console.log('Audio file already exists');
                // 读取服务端音频文件，并返回给客户端
                fs.stat(url, (err, stats) => {
                    if (err) {
                      res.writeHead(500);
                      res.end('File not found');
                      return;
                    }
                    const fileSize = stats.size;
                    const range = req.headers.range;
                    // range字段存在则触发分段下载，否则直接返回整个文件
                    if (range) {
                      const parts = range.replace(/bytes=/, '').split('-');
                      const start = parseInt(parts[0], 10);
                      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                      const chunkSize = end - start + 1;
                      const fileStream = fs.createReadStream(url, { start, end });
                      res.writeHead(206, {
                        'Content-Type': 'audio/mp3',
                        'Content-Length': chunkSize,
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`
                      });
                      fileStream.pipe(res);
                    } else {
                      res.writeHead(200, { 'Content-Type': 'audio/mp3', 'Content-Length': fileSize });
                      fs.createReadStream(path).pipe(res);
                    }
                  });
            }

        })
    }
    else {
        res.writeHead(500); 
        res.end('Not supporting multi-level playback')
    }

})
       
                // audioStream.then(stream => {  
                //     // 设置响应头，告诉客户端这是一个视频流  
                //     res.writeHead(200, {  
                //       'Content-Type': 'audio/mpeg',  
                //       'Content-Disposition': 'inline; filename="audio.mp3"', // 告诉浏览器以内联方式处理，并提供文件名
                //       // 其他可能需要的头信息，比如Transfer-Encoding等  
                //     });  
                
                //     // 将视频流通过管道传输到响应流  
                //     stream.pipe(res);  
                // })
function serveCachedAudio(fileName, cb) {
    console.log(fileName);
  }
    

async function getCookies(url) {  
    try {  
        const response = await axios.get(url, {  
            withCredentials: true, // 如果需要跨域cookie，设置这个为true  
            headers: {  
                // 这里可以添加额外的请求头，例如User-Agent等  
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537'  
            }  
        });  
  
        // 检查响应头中的Set-Cookie字段  
        const setCookieHeader = response.headers['set-cookie'];  
        if (setCookieHeader) {  
            // setCookieHeader可能是一个数组，因为可能有多个cookie  
            cookies = setCookieHeader.join(';');  
            cookies = cookies.replace(/;/g, ',');  
            console.log('Cookies:', cookies);  
            return cookies;  
        } else {  
            console.log('No cookies found in the response.');  
            return null;  
        }  
    } catch (error) {  
        console.error('Error fetching cookies:', error);  
        return null;  
    }  
}  
  
// 获取cookie
getCookies('https://bilibili.com')   
    .catch(error => {  
        console.error('An error occurred:', error);  
    });


module.exports = router
