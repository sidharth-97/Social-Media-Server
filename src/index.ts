require('dotenv').config()
import { initServer } from "./app/server";

async function init() {
    const app = await initServer();
    app.listen(3001,()=>console.log("server connected"))
}

init()