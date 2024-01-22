// 會拿到之前的參照
const express = require('express');

const router = express.Router();

router.get('/', (req, res)=>{
    res.send('<h2>hello world! </h2>');
});
router.get('/admin2/:action?/:id?', (req, res)=>{
    const { url, baseUrl, originalUrl } = req;
    res.json({url, baseUrl, originalUrl, params: req.params});
});

module.exports = router;