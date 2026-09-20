import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('public/temp'))
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err)
      cb(null, file.fieldname + '-' + raw.toString('hex'))
    })
  }
})

const upload = multer({ storage , })

export { upload }