// require('dotenv').config({path:'./env'}) aise bhi kr skte h..

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'



dotenv.config({
    path:'./env'
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(` Server is running at port: ${process.env.PORT}`);
    app.on('error', (err) => {
        console.error('Server error:', err);
          });

    })
})
.catch((err)=>{
    console.log("MONGO db connection failed !!!",err);
})

//env variable:: jitne jaldi hamare app load ho utne jaldi hamare env variable har jagah  avlb ho jane chaiye..
//toh first file jo load hoti hai ham kya koshish karte hai hamrae env variable wahi pe load ho jaaye..



// const app =express()

// (async ()=>{
//     try{
//        await  mongoose.connect(`&{process.env.MONGODB_URL}/${DB_NAME}`)
//        app.on("error", ()=>{ //listening fnc we are checking chalo database toh cnct hogya laiken kayi baar ho skta h express ke app baat nahi kr paarhe hai..
//         console.log("ERR:",error)
//         throw error
//        })

//        app.listen(process.env.PORT, () => {
//         console.log(`App is listening on port ${process.env.PORT}`)
//        })
//     }
//     catch(error){
//         console.log("ERROR: ",error);
//         throw err
//     }

// })()
