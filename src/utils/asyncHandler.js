const asyncHandler=(requestHandler)=>{
    return(req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}

export {asyncHandler}


// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try{
//        return  await fn(req,res,next)
//     }
//     catch(err){
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }

// }
// export {asyncHandler}





// This code defines a higher-order function named asyncHandler. This function takes another function fn as its argument and returns a new asynchronous middleware function.

// Here's a breakdown of what each part of this code does:

// const asyncHandler = (fn) => async (req, res, next) => { ... }: This line defines the asyncHandler function. It's an arrow function that takes a function fn as its parameter. It returns another function, an asynchronous middleware function. This middleware function takes three parameters: req (the request object), res (the response object), and next (a callback function to pass control to the next middleware).

// try { await fn(req, res, next) }: Inside the asynchronous middleware function, it tries to await the execution of the fn function that was passed as an argument. This function presumably performs some asynchronous operation related to handling the request. By using await, the middleware function waits for this asynchronous operation to complete before moving on to the next step.

// catch (error) { ... }: If an error occurs during the execution of the fn function, the code inside the catch block is executed.

// res.status(err.code || 500).json({ success: false, message: err.message }): Inside the catch block, it sets the HTTP status code of the response to either the error code (err.code) if available or defaults to 500 (Internal Server Error). Then it sends a JSON response with success set to false and the message property set to the error message (err.message).

// So, in summary, the asyncHandler function is a utility function used to wrap other asynchronous middleware functions, providing error handling for them. It simplifies the process of handling errors in asynchronous middleware by centralizing error handling logic. This pattern is commonly used in Express.js applications to handle asynchronous operations within middleware.





