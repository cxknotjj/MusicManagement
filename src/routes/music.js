let express = require('express')
let fs = require('fs');
const path = require('path')
const mysql = require('mysql')
const axios = require("axios");
const { download } = require("bilibili-save-nodejs");
const jwt = require('jsonwebtoken'); // 导入jwt库
const http = require('http')
let music = require('../models/music');
let assetsUrl = path.join(__dirname,'../../public')
let resData = {
  status: 200,
  data: {}
}
let isDev = true;
let connection
if (process.env.NODE_ENV !== 'development') {
  isDev = false;
  // 阿里云服务器数据库
  connection = mysql.createConnection({
    host: '47.113.147.115',
    user: 'username',
    password: '0238CXK()cxk',
    // 数据库名字
    database: 'musiclist'
  })
}else {
  // 本机数据库
  connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '5201314',
    // 数据库名字
    database: 'musiclist'
  })
}



console.log(process.env.NODE_ENV);


connection.connect();

// 下载所有图片，并设置图片地址
function utils() {
  connection.query(`SELECT * FROM musiclist;`,async function (err,results,fiels) {
    if (err) throw err
    console.log(results[0].image);
    results = results.filter(item => item.image?.includes('http'))
    console.log(results);
    // 设置队列请求
    for (let index in results) {
      let item = results[index];
      if (item.image && item.image !== 'undefined') {
        let response = await axios.get(item.image,{ responseType: 'stream' })
        .catch(err => {
          console.log(err);
        })
        response.data.pipe(fs.createWriteStream(isDev ? assetsUrl + `/img/${item.name}.jpg` : `/usr/local/scnginx99/html/img/${item.name}.jpg`));        
        
        let sql = `UPDATE musiclist SET image = ? WHERE id = ${item.id}`;
        let fileName = assetsUrl + `/img/${item.name}.jpg`
        // 执行更新语句
        connection.query(sql,[fileName], (err, results) => {
          if (err) {
            console.log(err);
          }else {
            console.log('修改数据成功');
          }
        });
        console.log(index);
      }
    }
  })
}
// 执行分页查询
function findMusic(page, limit) {
  return connection.query(sql);
}
// utils()

let router = express.Router();

// 设置路由  
router.get('/', (req, res) => {  
  res.send('Hello World!');  
});

// 删除音乐
router.get('/delete',async function (req,res)  {
  let data = req.query;
  let sql = "DELETE FROM musiclist WHERE name = ?";
  connection.query(sql,[data.name],(err,results,fiels) => {
    if (err) throw err
    console.log('delete ',data ,' success');
    //* 文件存在才会删除(数据的name属性和图片地址并不相同)
    if (fs.existsSync(assetsUrl + data.url)) {
      fs.unlink(assetsUrl + data.url,(err) => {
        if (err) {
          resData.status = 500;
          res.end(JSON.stringify(resData))
        }

      })
    }
    if (fs.existsSync(assetsUrl + data.image)) {
      fs.unlink(assetsUrl + data.image,(err) => {
        if (err) {
          resData.status = 500;
          res.end(JSON.stringify(resData))
        }

      })
    }

    resData.status = 200;
    res.end(JSON.stringify(resData))
  })
})
console.log(path.join(__dirname,'../../public'));
// 下载音乐
router.get('/downloadMusic',async function (req,res)  {
  let data = req.query;
  res.end(JSON.stringify(data.url))
  download({
    downloadRange: "byVedio",
    downloadType: "mp3",
    downloadPath: data.url,
    downloadFolder: isDev ? assetsUrl + "/music" : '/usr/local/scnginx99/html/music',
  })
  .then(result => {
    let info = result.downloadList;
    console.log(info,'下载列表');
    info.forEach(element => {
      let sql = `INSERT INTO musiclist (id, name , singer , album , duration , image , url , baseUrl) VALUES (?,?,?,?,?,?,?,?)`;
      connection.query(sql,[element.id,element.name,element.singer,element.album,element.duration,element.image,element.url,element.baseUrl],(err,results,fiels) => {
        if (err) {
          console.log(err);
          resData.status = 200;
          res.end(JSON.stringify(resData))
        }
        console.log('添加数据成功');
      })
    });
    utils()
    resData.status = 200;
    res.end(JSON.stringify(data))


  })

})

// 替换id为网易云歌曲id
router.post('/checkMusicId',(req,res) => {
  let sql = `SELECT * from musicList`;
  connection.query(sql,(err,result) => {
    if(err) throw err;
    result.forEach( async (item) => {
      let song = await axios.get(`http://127.0.0.1:3000/search?offset=0&limit=30&keywords=${item.name}`)
      console.log(song.data.result.songs[0].id);
      if (song.data.result.songs[0].id == item.id) {
        console.log('id重复，不用修改');
        return
      }
      let searchData = [];
      connection.query(`SELECT * from musicList WHERE id = ${song.data.result.songs[0].id}`,(err , search) => {
        if (err) throw err
        searchData = search;
      })
      
      if (searchData.length === 0) {
        return
      }

      // 替换歌曲id
      let isFinish = await new Promise(
        (resolve, reject) => {
          connection.query(`UPDATE musiclist SET id = ? WHERE id = ${item.id}`,[song.data.result.songs[0].id],
            (err, results)  => {
              if (err) throw(err)
              resolve(true)
            })
        }
      ) 
      console.log(isFinish);

    })
    resData = {}
    resData.status = 200;
    res.end(JSON.stringify(resData))
  })
})

// 更新音乐信息
router.get('/updateMusic',(req,res) => {
  let data = req.query;
  let sql = `UPDATE musiclist SET id = ?, name = ?, singer = ?, album = ?, image = ?, url = ? WHERE id = ${data.searchId}`;
  console.log(data);
  // 执行更新语句
  connection.query(sql,[data.id,data.name,data.singer,data.album,data.image,data.url], (err, results) => {
    if (err) {
      console.log(err);
      resData.status = 500;
      res.end(JSON.stringify(resData))
    }else {
      console.log('修改数据成功');
      resData.status = 200;
      res.end(JSON.stringify(resData))
    }
  });

})


// 获取音乐信息(分页查询)
router.get('/about',(req,res) => {
  let data = req.query;
  let limit = data.limit || 1000;
  let page = data.page || 1;
  let order = data.order || 'id'
  console.log(data);
  const sql = `SELECT * FROM musiclist ORDER BY ${order} DESC`;
  // const sql = `SELECT * FROM musiclist LIMIT ${limit} OFFSET ${limit * (page - 1)}`;
  connection.query(sql,(err, results) => {
    if (err) throw err;
    // 计算要获取的元素的索引范围  
    const startIndex = (page - 1) * limit;  
    const endIndex = startIndex + Number(limit);  
    resData.status = 200;
    resData.data = results.slice(startIndex,endIndex);
    console.log(startIndex,endIndex);
    resData.total = results.length;
    res.end(JSON.stringify(resData))
  })

})

// 获取日志
router.get('/log',async (req,res) => {
  let data = req.query;
  let text = `${new Date()} \n ${data.name} 无法播放；\n`
  let directoryPath = './log.txt'
  if (!fs.existsSync(directoryPath)) {  
    console.log('没有找到文件');
  }else {
    fs.readFile(directoryPath,'utf-8',(err,result) => {
      if (err) throw err
      if (result.includes(data.name)) {
        console.log('log已经存在');
      }else {
        // 使用appendFile方法追加内容  
        fs.appendFile(directoryPath, text,'utf-8', (err) => {  
          if (err) {  
            console.error('追加内容时发生错误:', err);  
            return;  
          }  
          console.log('内容已成功追加到文件!');  
        });
      }
    })

  }

  resData = {}
  resData.status = 200;
  res.end(JSON.stringify(resData))
})



// 存储所有音乐信息到数据库

// 登录后台管理系统
router.post('/login',(req,res) => {
  let data = req.body;
  console.log('login');
  // 设置中文编码防止乱码
  res.set('Content-Type', 'text/plain; charset=utf-8'); 
  if(!data.userName || !data.password){
    res.end(JSON.stringify({
			code: 2,
			data: null,
			msg: '参数不合法'
    }))
	}
  connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [data.userName, data.password], (err, results) => {  
    if (err) throw err;  
    console.log(results);
    if (results.length > 0) {  
      const token = jwt.sign({ id: results[0].id }, 'secretKey', { expiresIn: '24h' }); // 创建JWT令牌
      res.end(JSON.stringify({
        code: 200,
        data: token,
        msg: '登录成功'
      }))
    } else {  
      res.end(JSON.stringify({
        code: 1,
        data: "null",
        msg: '密码或账户错误'
      }))
    }  
  });
  console.log(data)

})

function renameImg () {
  fs.readdir('/img',(err,files) => {
    if (err) throw err
    files.forEach(item => {
      let name = item.split('.')[0];
      connection.query(`SELECT * from musicList WHERE url = '/music/${name}.mp3'`,(err,results) => {
        if (err) throw err
        if (results.length === 0) return
        console.log(results[0].image);
        fs.rename(`${assetsUrl}/img/${item}`,`/img/${results[0].image.split('/')[2]}`,(err) => {
          if (err) throw err
          console.log('成功');
        })
      })
    })

    // console.log(files);
  })
}
module.exports = router