import dotenv from 'dotenv'
import ConnectDB from "./db/index.js";

dotenv.config({path : '/.env'})
ConnectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () =>{
        console.log(`Server is running on Port :${process.env.PORT }`);
    })
})
.catch((error) => {
    console.log(`MonogoDB Connection Failed !!! ${error}`);
})