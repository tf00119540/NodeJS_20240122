const http = require("http");
// 在Files system 中 使用promiss的方法 
const fs = require('fs/promises')

const server = http.createServer(async (request, response) => {

    // fs.writeFile,拿一個promiss的物件
    await fs.writeFile(__dirname+'/header.txt', JSON.stringify(request.headers));
    


    response.writeHead(200, {
    "Content-Type": "text/html",
    });

    response.end(`
    <h2>OK</h2>
    
    `);
});
server.listen(3000);