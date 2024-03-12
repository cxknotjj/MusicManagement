const express = require('express');  
const app = express();  
const fs = require('fs');
const path = require('path')
const cors = require('cors'); 
const port = 4000;  
const jwt = require('jsonwebtoken'); // 导入jwt库
require('dotenv').config();  
let router = require('./src/routes/index')
let bodyParser  = require('body-parser');

// 请求资源
app.use('/node_modules/', express.static('./node_modules/'))
app.use('/public/', express.static('./public/'))
// 设置静态文件目录，这样我们可以直接通过URL访问这些文件  
// app.use(express.static(path.join(__dirname, 'public')));  

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// app.engine('html',require('express-art-template'))
app.use(cors());  

// 路由处理函数之外的任意位置添加中间件来验证JWT令牌
app.use((req, res, next) => {
  const authHeader = req.headers['authorization']; // 从请求头中获取Authorization字段值
  console.log(req.url);
  if (req.url.includes('/login') || req.url.includes('/about') || req.url.includes('/log')) {
    next()
  }
  else if (req.url.includes('/music')) {
    console.log(req.url.includes('/about'));
    console.log('验证token');
    console.log(authHeader);
    if(!authHeader || !authHeader.startsWith('Bearer')){
      return res.status(401).send('Unauthorized request'); // 没有提供有效的令牌则返回未授权状态
    }
      
    const token = authHeader.split(' ')[1]; // 分割出真正的令牌
    console.log(token);
    try {
      const decodedUser = jwt.verify(token, 'secretKey'); // 解密令牌并验证签名
      req.userId = decodedUser.id; // 设置已验证用户ID到request对象中
      next(); // 调用下一个中间件或路由处理函数
    } catch (err) {
      console.error(err);
      return res.status(500).send('Internal server error'); // 内部服务器错误
    }
  }else {
    next()
  }

});

// 挂载路由
app.use(router)




  
app.listen(port, () => {  
  console.log(`App listening at http://localhost:${port}`);  
});


// 暂时放在这里
// function  downloadVideo(url) {
//   return download({
//     downloadRange: "byVedio",
//     downloadType: "mp3",
//     downloadPath: url,
//     downloadFolder: "D:/Desktop/code/Vue-mmPlayer/public",
//   })

// }

// async function deleteMusic(name) {
//   let musicList = await fs.readFileSync(`D:/Desktop/code/Vue-mmPlayer/public/musicList.txt`,'utf-8');
//   let txt = JSON.parse(musicList);
//   let data = txt;
//   txt.forEach((element,index) => {
//     if (element.name === name) {
//       data.splice(index,1)
//     }
//   });

//   await fs.writeFileSync(`D:/Desktop/code/Vue-mmPlayer/public/musicList.txt`,JSON.stringify(data))


// }

// async function editMusic(name,newName) {
//   let musicList = await fs.readFileSync(`D:/Desktop/code/Vue-mmPlayer/public/musicList.txt`,'utf-8');
//   let txt = JSON.parse(musicList);
//   let data = [];
//   let index = 0;

//   data = txt.map((item,i) => {
//     if (item.name === name) {
//       index = i;
//       item.name = newName
//     }
//     return item
//   })
//   // 更新数据
//   await fs.writeFileSync(`D:/Desktop/code/Vue-mmPlayer/public/musicList.txt`,JSON.stringify(data))

//   // 重命名
//   if (fs.existsSync(`D:/Desktop/code/Vue-mmPlayer/public/music/${name}.mp3`)) {
//     try {
//       fs.rename(`D:/Desktop/code/Vue-mmPlayer/public/music/${name}.mp3`,`D:/Desktop/code/Vue-mmPlayer/public/music/${newName}.mp3`,(err) => {
//         if (err) {
//           console.log(err);
//         }
//       })
//       console.log(name,'已重命名为：',newName);
//     }
//     catch(err) {
//       console.log('命名时发生错误:',err);
//     }
//   }

// }