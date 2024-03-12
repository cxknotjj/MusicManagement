


// 歌曲属性，包含了歌曲的各种信息
class music {
  constructor(name) {
    this.name = name;
  }
  async deleteMusic() {
    let musicList = await fs.readFileSync(`D:/Desktop/code/Vue-mmPlayer/public/musicList.txt`,'utf-8');
    let txt = JSON.parse(musicList);
    let data = txt;
    txt.forEach((element,index) => {
      if (element.name === this.name) {
        data.splice(index,1)
      }
    });
  
    await fs.writeFileSync(`D:/Desktop/code/Vue-mmPlayer/public/musicList.txt`,JSON.stringify(data))
  
    // 文件存在才会删除
    if (fs.existsSync(`D:/Desktop/code/Vue-mmPlayer/public/music/${this.name}.mp3`)) {
      fs.unlink(`D:/Desktop/code/Vue-mmPlayer/public/music/${this.name}.mp3`,(err) => {
        if (err) {
          console.log(err);
        }else {
          console.log('删除',this.name,'成功');
        }
  
      })
    }
  
  }
  async editMusic(newName) {
    let musicList = await fs.readFileSync(`D:/Desktop/code/Vue-mmPlayer/public/musicList.txt`,'utf-8');
    let txt = JSON.parse(musicList);
    let data = [];
    let index = 0;
  
    data = txt.map((item,i) => {
      if (item.name === name) {
        index = i;
        item.name = newName
      }
      return item
    })
    // 更新数据
    await fs.writeFileSync(`D:/Desktop/code/Vue-mmPlayer/public/musicList.txt`,JSON.stringify(data))
  
    // 重命名
    if (fs.existsSync(`D:/Desktop/code/Vue-mmPlayer/public/music/${name}.mp3`)) {
      try {
        fs.rename(`D:/Desktop/code/Vue-mmPlayer/public/music/${name}.mp3`,`D:/Desktop/code/Vue-mmPlayer/public/music/${newName}.mp3`,(err) => {
          if (err) {
            console.log(err);
          }
        })
        console.log(name,'已重命名为：',newName);
      }
      catch(err) {
        console.log('命名时发生错误:',err);
      }
    }
  
  }
}

module.exports = music