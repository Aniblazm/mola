const AUA = require('../src/AUA');

AUA.initServer();
getLocation();
async function getLocation(){
    const result = await AUA.Location.searchByString('calle Azor');
    console.log(result);
}