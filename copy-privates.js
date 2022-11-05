const fs = require('fs');

fs.copyFile("./src/private/private.json", "./build/private/private.json", fs.constants.COPYFILE_FICLONE, (err) => {if(err) console.log("err", err);});
