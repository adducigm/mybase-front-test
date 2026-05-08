const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 5173;
const apiOrigin = "http://3.36.54.178:8000";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    proxyApi(req, res);
    return;
  }

  const pathname = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.join(root, pathname);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
    });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`MyBase frontend: http://127.0.0.1:${port}`);
});

function proxyApi(clientReq, clientRes) {
  const target = new URL(clientReq.url, apiOrigin);
  const proxyReq = http.request(
    target,
    {
      method: clientReq.method,
      headers: {
        ...clientReq.headers,
        host: target.host,
      },
    },
    (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(clientRes);
    },
  );

  proxyReq.on("error", () => {
    clientRes.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    clientRes.end("API server is not reachable.");
  });

  clientReq.pipe(proxyReq);
}
