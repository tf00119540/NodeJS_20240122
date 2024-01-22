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
const Jimp = require('jimp');
const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);
const moment = require('moment-timezone');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// const multer = require('multer');
// 設定上傳暫存目錄
// const upload = multer({dest:'tmp_uploads/'});
// 引入modules upload-imgs.js
const upload = require('./modules/upload-imgs');

// 連線MySQL
const db = require('./modules/db_connect2');
// 在既有的連線上掛入外掛
const sessionStore = new MysqlStore({}, db);

// 建立web server 物件
const app = express();

// 註冊樣板引擎EJS
app.set('view engine', 'ejs');

// top-LeveL middLeware

// 設定session (顯示頁面刷新次數)
app.use(session({
    //新用戶沒有使用到 session 物件時不會建立 session 和發送cookie
    saveUninitialized: false,
    // 沒變更內容是否強制回存
    resave: false,
    secret: 'asdfqerzcvasdfasdf',
    // 需要掛入express-mysql-session
    store: sessionStore,
    // 決定存活時間
    cookie: {
        // 20分鐘，單位毫秒
        maxAge: 1200_000,
    }
}));

// 處理x-www-form-urlencoded
app.use(express.urlencoded({extended: false}));
// 處理raw JSON 
app.use(express.json());
// 使用cors,credentials設定為true 伺服器端才會開放cookie權限
// cb內設定true，在Headers中Response Header裡的Access-Control-Credentials設定為true
const corsOptions = {
    credentials: true,
    origin: function(origin,cb){
        console.log({origin});
        cb(null, true);
    }
};
app.use(cors(corsOptions));
// 需要下next() 才會繼續下去其他的路由
app.use((req, res, next)=>{
    res.locals.title = '小新的網站';
    res.locals.pageName = '';

    res.locals.myToDateString  = d => moment(d).format('YYYY-MM-DD');
    res.locals.myToDatetimeString  = d => moment(d).format('YYYY-MM-DD: HH:mm:ss');
    // 把 session 資料傳給 ejs 用
    res.locals.session = req.session;

    next();
});


// 建構路由
app.get('/',(request,response)=>{
    // response.send('你好');
    response.locals.title = '首頁-' + response.locals.title;
    response.render('main', {name: '小新'})
});

app.get('/spotspot',(request,response)=>{
    const spotspot =  require(__dirname + '/data/spotspot');
    response.render('spotspot', {spotspot, title:'SpotSpot'})
});

app.get('/try-qs', (req, res) => {
  res.json(req.query);
});

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
    res.render('try-post-form', req.body);
});

app.post('/try-upload', [upload.single('avatar'), async (req, res, next)=>{
    console.log(req.file);
    if(req.file && req.file.filename){
        req.file.myAttr = '123';
        const lenna =  await Jimp.read(req.file.path);
        lenna.resize(256, 256) // resize
        .quality(60) // set JPEG quality
        .greyscale() // set greyscale
        .write(__dirname + "/public/uploads/lena-small-bw.jpg"); // save
        next();
    } else {
        next();
    }
}], (req, res)=>{
    res.json(req.file);
});

app.post('/try-uploads', upload.array('photos', 5), (req, res)=>{
    res.json({
        body: req.body,
        files: req.files
    });
});

app.get('/p1/:action/:id?', (req, res)=>{
    res.json(req.params);
}); 
app.get('/p2/*/*?', (req, res)=>{
    res.json(req.params);
}); 
app.get(/\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res)=>{
    let u = req.url.slice(3);
    u = u.split('?')[0];
    // u = u.split('-').join('');
    u = u.replaceAll('-', '');
   
    res.send({u});
}); 

// 當成middleware 使用
// /admin 可以新增路由名稱
app.use('/admin', require('./routes/admin2'));
app.use('/address', require('./routes/address-book'));

// 每重新整理時 myVar得屬性值+1
app.get('/try-sess', (req,res)=>{
    req.session.myVar = req.session.myVar || 0 ;
    req.session.myVar++;
    res.json(req.session);
});


app.get('/try-moment', (req,res)=>{
    //取得當下的時間
    const m1 = moment(); 
    const m2 = moment('2024-02-30');
    const fmStr = 'YYYY-MM-DD HH:mm:ss';

    res.json({
        m1a: m1.format(fmStr),
        m1b: m1.tz('Europe/London').format(fmStr),
        m1c: m1.tz('Asia/Tokyo').format(fmStr),
        // 判斷格式是否正確，若不符合則為false
        m2isValid: m2.isValid(),
    });
});

// 因自訂模組中的檔案匯出是promise 所以要加上async await
// result會得到CKB ， function(結果，欄位資訊) , 所以取第一個array結果
//  [result] 代表 取第一層內第一個陣列的值
app.get('/try-db', async (req, res)=> {
    const [result] = await db.query("SELECT * FROM address_book LIMIT 5");
    res.json(result);
});


app.get('/login', async (req, res)=> {
    res.render('login'); //呈現登入的表單
});
app.post('/login', async (req, res)=> {
    const output = {
        success: false,
        error: '',
        code: 0,
        postData: req.body,
    };

    // 登入時比對帳號是否有資料
    const sql = "SELECT * FROM admins WHERE account=?";
    
    const [rows] =  await db.query(sql, [req.body.account]);
    if(! rows.length){
        // 帳號是錯誤的
        output.code = 401;
        return res.json(output);
    };

    // 用戶輸入的密碼 以及 資料庫內的雜湊碼 進行比對
    if(!await bcrypt.compare(req.body.password, rows[0].password_hash)){
        //密碼是錯誤的
         output.code = 402;
    } else {
        output.success = true;
        output.code = 200;
        output.error = '';

        req.session.admin = {
            sid: rows[0].sid,
            account: rows[0].account,
        }
    }

    res.json(output);
});
app.get('/logout', async (req, res)=> {
    delete req.session.admin;
    res.redirect('/'); //登出後跳到首頁
});

app.get('/hash', async (req, res)=> {
    const p = req.query.p || '123456';
    const hash = await bcrypt.hash(p, 10);
    res.json({hash});
});





// public
app.use(express.static('public'));
app.use(express.static('node_modules/bootstrap/dist'));

// 404
app.use((req,res)=>{
    // res.type('text/plain');
    res.status(404).send(`<h1>找不到頁面</h1>
    <p>404</p>
    <img src="/images/1.jpg">`);
});

const port = process.env.PORT || 3000;
// server 偵聽
app.listen(port, ()=>{
    console.log(`伺服器啟動: ${port}`);
});
