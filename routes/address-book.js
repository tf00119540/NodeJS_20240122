const express = require('express');
const moment = require('moment-timezone');
const db = require('./../modules/db_connect2');
const upload = require('./../modules/upload-imgs');

const router = express.Router();

// router.get('/', async (req, res)=>{
//     // 每一頁要顯示的筆數
//     const perPage = 5;
//     // 目前為顯示為第幾頁
//     // 以+號將字串轉換為數值，如果轉換失敗即為NaN 則page為 1 
//     let page = +req.query.page || 1;
//     // 保證該數值為整數
//     page = parseInt(page);

//     // totalRows為總筆數
//     const [[{totalRows}]] = await db.query("SELECT COUNT(1) totalRows FROM address_book");

//     // totalPage為總頁數
//     const totalPages = Math.ceil(totalRows/perPage);

//     // 建立一個新的陣列
//     let rows = [];

//     // 如果page<1 則轉向到別頁
//     if(page < 1){
//         return res.redirect(req.baseUrl);
//     }

//     // 確認如果有資料，且如果page>總頁數 則轉向到最後一頁
//     if(totalRows > 0){
//         if(page > totalPages){
//             return res.redirect(req.baseUrl + `?page=` +totalPages);
//         }
//         // 降冪的方式，限制查詢結果的數量。 第一個參數表示返回結果的起始索引，第二個參數表示返回的記錄數量
//         const sql =  `SELECT * FROM address_book
//          ORDER BY sid DESC 
//          LIMIT ${(page-1)*perPage}, ${perPage}`;
         
//          // SQL 除錯方式之一
//         //  return res.send(sql);
    
//          // 連線查詢的資料放入rows的陣列裡面
//          [rows] = await db.query(sql);

//     }

//     /*
//     res.json({
//         totalRows,
//         totalPages,
//         perPage,
//         page,
//         rows,
//     });
//     */

//    // 轉換Date類型物件變成格式化字串
//     const fm = 'YYYY-MM-DD'
//     rows.forEach(v=>{
//         // 將birthday動態轉換成所需的日期格式
//         v.birthday2 = moment(v.birthday).format(fm);
//         v.birthday3 = res.locals.myToDateString(v.birthday);
//     })

//     // 引入使用相對路徑
//     res.render('address-book/list', {
//         totalRows,
//         totalPages,
//         perPage,
//         page,
//         rows,
//     });
// });

router.use((req, res, next)=>{
    //如果沒登入 當進入/adress 此路由時 會轉跳ejs到登入頁
    // if(! req.session.admin){
    //     return res.redirect('/login');
    // }


    next();
});

const getListData = async (req, res)=>{
    let redirect = '';
    // 每一頁要顯示的筆數
    const perPage = 5;
    // 目前為顯示為第幾頁
    // 以+號將字串轉換為數值，如果轉換失敗即為NaN 則page為 1 
    let page = +req.query.page || 1;
    
    let queryObj = {};
    // 條件式的開頭
    let sqlWhere = ' WHERE 1 ';
    // 取的搜尋欄內的url?後面的參數
    let search = req.query.search;
    if(search &&  search.trim()){
        // 得到的資料去掉頭尾空白
        search = search.trim();

        // 接起來跳脫
        const searchEsc = db.escape('%'+search+'%');
        sqlWhere+= ` AND \`name\` LIKE ${searchEsc}` ;
        queryObj = {...queryObj, search};
    }

    // console.log({sqlWhere});
    res.locals.search = search;  //傳到 ejs
    res.locals.queryObj = queryObj;  //傳到 ejs


    // 保證該數值為整數
    page = parseInt(page);

    // totalRows為總筆數
    const [[{totalRows}]] = await db.query(
        `SELECT COUNT(1) totalRows FROM address_book  ${sqlWhere} `
        );

    // totalPage為總頁數
    const totalPages = Math.ceil(totalRows/perPage);

    // 建立一個新的陣列
    let rows = [];

    // 設定要轉向的URL
    if(page < 1){
         redirect = req.baseUrl;
    }

    if(totalRows > 0){
        if(page > totalPages){
             redirect = req.baseUrl + `?page=` +totalPages;
        }
        // 降冪的方式，限制查詢結果的數量。 第一個參數表示返回結果的起始索引，第二個參數表示返回的記錄數量
        const sql =  `SELECT * FROM address_book
         ${sqlWhere}
         ORDER BY sid DESC 
         LIMIT ${(page-1)*perPage}, ${perPage}`;
         
         // SQL 除錯方式之一
        //  return res.send(sql);
    
         // 連線查詢的資料放入rows的陣列裡面
         [rows] = await db.query(sql);

    }

   // 轉換Date類型物件變成格式化字串
    const fm = 'YYYY-MM-DD'
    rows.forEach(v=>{
        // 將birthday動態轉換成所需的日期格式
        v.birthday2 = moment(v.birthday).format(fm);
    })

    return {
        totalRows,
        totalPages,
        perPage,
        page,
        rows,
        redirect,
    }
}

// 新增列表
router.get('/add', async (req, res)=>{
    // 呈現表單
    res.render('address-book/add', {pageName : 'ab-add'});
});
// 需要加上middleware 才能解析form-data資料; .none() 代表沒有要上傳
router.post('/add', upload.none(), async (req, res)=>{
   
    /* // 不建議使用
    const sql = "INSERT INTO `address_book` SET ?";
    req.body.created_at = new Date();
    const [result] = await db.query(sql, [req.body]);
    */

    let {name, email, mobile, birthday, address} = req.body;

    // TODO 檢查表單各欄位的資料

    // 檢查生日日期是否合法，如果是false 那就設定為空值
    if(! moment(birthday).isValid()){
        birthday = null;
    } else {
        birthday = moment(birthday).format('YYYY-MM-DD');
    }

    // 將資料寫入後台
    // 定義 SQL 查詢語句
    const sql = "INSERT INTO `address_book`(`name`, `email`, `mobile` ,`birthday`, `address`, `created_at`) VALUES (?,?,?,?,?, NOW())";
    // 使用 query() 執行查詢；query中第二個用來塞參數
    const [result] = await db.query(sql, [name,email,mobile,birthday,address]);

     
    res.json({
        success: !!result.affectedRows,
        postData: req.body,
        result
    });
});

// delete
router.delete('/:sid', async (req, res)=>{
    // req.params.sid
    const sql = "DELETE FROM address_book WHERE sid=?";
    const [result] = await db.query(sql, [req.params.sid]);
    res.json(result);
});

//edit
router.get('/edit/:sid', async (req, res)=>{
    //讀取資料
    const sql = "SELECT * FROM address_book WHERE sid=?";

    const [rows] = await db.query(sql , [req.params.sid]);

    if(rows.length){
        //res.render('address-book/edit', rows[0]); //呈現編輯標單
        // 利用res.get() 拿到Referer 檔頭的設定
        res.render('address-book/edit', {
            ...rows[0],
            Referer: req.get('Referer') || ''
        }); 
        
    } else {
        res.redirect(req.baseUrl);
    }
});
router.put('/edit/:sid',upload.none(), async (req, res)=>{
    const sid = req.params.sid;
    let {name, email, mobile, birthday, address} = req.body;

    // TODO 檢查表單各欄位的資料

    // 檢查生日日期是否合法，如果是false 那就設定為空值
    if(! moment(birthday).isValid()){
        birthday = null;
    } else {
        birthday = moment(birthday).format('YYYY-MM-DD');
    }

    const sql = "UPDATE `address_book` SET `name`=?,`email`=?,`mobile`=?,`birthday`=?,`address`=? WHERE `sid`=?";

    const [result] = await db.query(sql, [name, email, mobile, birthday, address, sid]);

    res.json({
        success: !! result.changedRows,
        FormData: req.body,
        result
    });
});




//頁面呈現
router.get('/', async (req, res)=>{
    const output = await getListData(req, res);
    if(output.redirect){
        return res.redirect(output.redirect);
    }
    // 匯入模板以及output的參數
    res.render('address-book/list', output);
});

//資料輸出
router.get('/api', async (req, res)=>{
    res.json( await getListData(req, res));
});


module.exports = router;