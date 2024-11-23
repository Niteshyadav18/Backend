class ApiError extends error{
  constructor(
    statusCode,
    message = "Something went wrong",
    erorrs =[],
    statck = ""
  ){
    super(message)
    this.statusCode = statusCode
    this.data = null
    this.message = message
    this.succes = false
    this.errors = errors

    if(statck){
        this.stack = statck
    }else{
        Error.captureStackTrace(this, this.constructor)
    }

  }
}

export{ApiError}
