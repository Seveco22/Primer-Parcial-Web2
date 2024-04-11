const fs = require('fs');

function readData(path) {
    try{
      const data = fs.readFileSync(path);
      return JSON.parse(data);
    } catch (error) {
      console.log(error);
    }
   };
  
function writeData(data, path) {
    try{
      return fs.writeFileSync(path, JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
   };

module.exports = {
    readData,
    writeData
}