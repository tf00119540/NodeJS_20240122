const http = require("http");

const server = http.createServer((request, response) => {
 
  response.writeHead(200, {
    "Content-Type": "text/html",
  });

  response.end(`
  <h2>HELLO !</h2>
  <p>${request.url}</p>
  `);
});
server.listen(3000);