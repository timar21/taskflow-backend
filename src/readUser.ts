import fs from "fs/promises";
import path from "path";
import { User } from "./interfaces/types";

async function readUsers(): Promise<void> {
    try {
        const filePath = path.join(__dirname, "data", "mock-users.json");
        const raw = await fs.readFile(filePath, "utf-8");
        const users: User[] = JSON.parse(raw);
        console.log("Users loaded:", users);
    } catch (error) {
        console.error("Failed to read users file:", error);
    }
}

readUsers();