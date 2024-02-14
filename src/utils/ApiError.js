class ApiError extends Error {//node ke ander class h error define
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack="" //providing an empty stack...
){

    super(message)
    this.statusCode=statusCode
    this.data=null
    this.message=message
    // this.success=success
    this.errors=errors //array of errors...

    if(stack){
        this.stack=stack
    }
    else{
        Error.captureStackTrace(this,this.constructor)
    }
}
}
export {ApiError}
