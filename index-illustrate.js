// 從process.argv為陣列值 以旁為例 ['node', 'index.js', 'production']
// 如果符合'production'則連線的檔案為'./production.env'其他則連線檔案為'./dev.env'
if(process.argv[2] && process.argv[2]==='production' ){
    require('dotenv').config({
        path:'./production.env'
    });
}else{
    require('dotenv').config({
        path:'./dev.env'
    });
}

// 引入 express
const express = require('express');

// const multer = require('multer');
// 設定上傳暫存目錄
// const upload = multer({dest:'tmp_uploads/'});

// 引入modules upload-imgs.js
const upload = require('./modules/upload-imgs');

// 註冊樣板引擎EJS
// expree() 內部就會使用ejs的套件
app.set('view engine', 'ejs');
// 設定views路徑 (選擇性設定)
// app.set('views', __dirname + '/要修改的資料夾名稱')

// top-LeveL middLeware
// 在頂端的特性，有符合可以解析的才做 沒有就跳過
// 處理x-www-form-urlencoded
app.use(express.urlencoded({extended: false}));
// 處理raw JSON 
app.use(express.json());

// 建立web server 物件
// 他不是一個類別，所以不會前面有NEW，設計時就是一個function,所以直接呼叫即可，呼叫後會直接拿到server的個體
const app = express();
// ------------------------------------------------------------
// 建構路由
// 當用戶端用get的方式請求時，我才接受
// get(path: "/", ...handlers)
// 有定義的路由才讓你拜訪，否則都轉入404頁面
// response.render('main', {name: '小新'}) 第一個值就要呈現哪個樣板，第二個值為要傳給樣板的變數，後面的部分需要包成物件
app.get('/',(request,response)=>{
    // response.send('你好');
    response.render('main', {name: '小新'})
});

app.get('/spotspot',(request,response)=>{
    //  resquire() 中的json檔 會轉換成JavaScript的資料類型
    const spotspot =  require(__dirname + '/data/spotspot.json');
    // console.log({spotspot}); 
    // 輸出 JSON的格式
    response.json({spotspot});
});

app.get('/try-qs', (req, res) => {
  res.json(req.query);
});

// 取得urlencoded Parser，{extended: false} 代表不使用qs lib，而使用內建的 querystring lib 
// 把urlencodedParser 當 middleware ， 資料通過中介軟體放到req.body裡面
// const urlencodedParser = express.urlencoded({extended: false});
// app.post(['/try-post', '/try-post1'], urlencodedParser,(req, res) => {
//   res.json({
//     query: req.query, 
//     body: req.body
//   });
// });

app.post(['/try-post', '/try-post1'], (req, res) => {
  res.json({
    query: req.query, 
    body: req.body
  });
});

// 相同的路徑 接收不同的方法
app.get('/try-post-form', (req, res) => {
    res.render('try-post-form');
});
app.post('/try-post-form', (req, res) => {
    res.json(req.body);
});

app.post('/try-upload', upload.single('avatar'), (req, res)=>{
    res.json(req.file);
});

// 如果沒上傳file 會是undefined
app.post('/try-upload', upload.single('avatar'), (req, res)=>{
    res.json(req.file);
});

// 五個檔案進入套件後會跑五次
// 如果沒上傳file 會是空的array
app.post('/try-uploads', upload.array('photos', 5), (req, res)=>{
    res.json({
        body: req.body,
        files: req.files
    });
});

// http://localhost:3002/p1/abc/123 ; get url 即取得abc 及 123的值
// {
//   "action": "abc",
//   "id": "123"
// }

// 代表id段 可有可無
app.get('/p1/:action/:id?', (req, res)=>{
    res.json(req.params);
}); 

app.get('/p2/*/*?', (req, res)=>{
    res.json(req.params);
}); 

// $為結束 i代表為小寫才可接受
// 取得第三個字串後的字串，分裂以?為主 的兩段並取前面一段，只要有-號全部替代為空字串
app.get(/\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res)=>{
    let u = req.url.slice(3);
    u = u.split('?')[0];
    // u = u.split('-').join('');
    u = u.replaceAll('-', '');
   
    res.send({u});
}); 






// ------------------------------------------------------------
// 設定 public 以及 dist 為靜態資料夾
app.use(express.static('public'));
app.use(express.static('node_modules/bootstrap/dist'));



// 404路由
// 所有路由在放在404之前
// contain type 預設為text/html  
app.use((req,res)=>{
    // res.type('text/plain');
    res.status(404).send(`<h1>找不到頁面</h1>
    <p>404</p>
    <img src="/images/1.jpg">`);
});

// 取得.env物件中取得PORT 沒有的話則取3000
const port = process.env.PORT || 3000;

// server 偵聽
// listen(連接阜， CKF
app.listen(port, ()=>{
    console.log(`伺服器啟動: ${port}`);
});
