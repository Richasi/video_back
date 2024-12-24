const multer = require('multer');
const path = require('path');

const storageConfig = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    callback(null, uniqueName);
  },
});

const upload = multer({ storage: storageConfig });

module.exports = upload.single('video');
