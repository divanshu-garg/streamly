import multer from "multer";

const storage = multer.diskStorage({
    // returns a call back which stores file to destination. if there is any error it returns null
    destination: function (req, file, cb) {
      cb(null, "./public/temp/")
    },
    filename: function (req, file, cb) {
        // generate a unique filename to handle a situation where multiple files of same name
        // note: file will be in local for a very minute time then moved to cloudinary
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + '')
    }
  })
  
export const upload = multer({ 
  storage, 
})