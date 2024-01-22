const multer = require('multer');
// 解構的寫法，直接從物件中找到對應v4的key 取出該值
const {v4:uuidv4} =  require('uuid');

const extMap =  {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
};

// multer() 當檔案上傳時則會呼叫 fileFilter 來決定上傳或者跳過檔案，req為物件，file 則是上傳檔案的檔案內容，cd則是檔案篩選
// 當有檔案上傳時呼叫此函數做檔案的篩選；過濾檔案的規則:有找到對應的物件key 才會上傳或者跳過檔案
// 如果有對應到file.mimetype 的key 則拿到對應的key值，沒有則拿到undefined，前面加上!! 將其轉化成布林值如果有對應是true 沒有則是false
// cb(錯誤時對應參數，當呼叫時得到true or false)，而這樣的套件是做在multer()裡面的
const fileFilter = (req, file, cb)=>{
    cb(null, !!extMap[file.mimetype])
};

// 定義要儲存的目的地以及檔案名稱
const storage =  multer.diskStorage({
    destination: (req,file, cb)=>{
        cb(null, __dirname+'/../public/uploads')
    },
    filename: (req, file, cb)=>{
        const ext = extMap[file.mimetype];
        const fid = uuidv4();
        cb(null, fid+ext);
    },
});

module.exports = multer({fileFilter,storage});