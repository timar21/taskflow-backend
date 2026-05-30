import http, { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {

    if (req.method === "GET" && req.url === "/projects") {
        const filePath = path.join(__dirname, "data", "mock-projects.json");

        fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Failed to read projects data" }));
                return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(data);
        });

    } else if (req.method === "GET" && req.url === "/users") {
        const filePath = path.join(__dirname, "data", "mock-users.json");

        fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Failed to read users data" }));
                return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(data);
        });

    } else {
        // Step 5: Handle missing routes
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Route not found" }));
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});