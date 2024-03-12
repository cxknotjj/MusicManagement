;

let url = document.querySelector('#url');
let send = document.querySelector('button');

send.onclick = function (event) {
  let params = url.value;
  let link = '127.0.0.1:4000/send?url=' + params;
  event.preventDefault(); // 阻止默认行为  
  console.log(link);
  fetch(link, {  
    method: 'GET',  
  })  
    .then(response => {
      return response.text()
    })  
    .then(body => {
      let data = JSON.parse(body);
      if (data.status === 200) {
        alert(`${data.song}下载成功`)
      }else {
        alert('下载失败（输入的url有问题）')
      }
    })
    .catch(error => console.error('Error:', error));
  alert('正在下载中！')
}

