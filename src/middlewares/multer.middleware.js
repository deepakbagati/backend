import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})
//storage is used as middleware..
//localfilepath agar aachuka hai that means file server pe temporary aagi hai..so we have  to remove the from both cases..
//sabse pehle file multer pe upload karwarahe hai,means lstorage pe then filname cloudinary ko derhe hai for further upload  process..
