//REST API demo in Node.js
var express = require('express'); // requre the express framework
var upload = require('express-fileupload')
var app = express();
var fs = require('fs'); //require file system object
var cors = require('cors');


app.use(cors());
app.use(express.json())
app.use(upload())

app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    let response = JSON.stringify({status: 300, data: {}});
    fs.readFile(__dirname + "/" + "users.json", 'utf8', function(err, data){
        data = JSON.parse(data);    
        Object.keys(data).forEach(function(key) {

            if(data[key].username === username){
                if(data[key].password === password){
                    response = JSON.stringify({status: 200, data: data[key]}) 
                }
                else{
                    response = JSON.stringify({status: 500, data: {}}) 
                }
            }
        });
        res.send(response);
        
    });
})


app.post('/signup', (req, res) => {
    const {name, username, password} = req.body

    fs.readFile(__dirname + '/users.json', 'utf8', (error, data) => {
        if (error) {
          console.log(error);
          return;
        }
        const parsedData = JSON.parse(data);
        let duplicate = false
        Object.keys(parsedData).map((key, i) => {
            if(parsedData[key].username === username)
                duplicate = true

        })
        if (duplicate){
            res.send({status: 300})
            return
        }
        const size = data.length
        const userstr = 'user' + size + 1
        parsedData[userstr] = {
            name : name,
            username: username,
            password: password,
            type: "user"
        }
        console.log(parsedData)
        fs.writeFile(__dirname + '/users.json', JSON.stringify(parsedData, null, 2), (err) => {
          if (err) {
            console.log('Failed to write updated data to file');
            return;
          }
          const dataToWrite = {
            data: {
                username: username,
                name: name
            },
            images: [],
            audio: [],
            video: [],
            others: []
          }
          fs.writeFile(__dirname + '/user_db/' + username + '.json', JSON.stringify(dataToWrite), (err) => {
            if (err) {
                console.log('Failed to write updated data to file');
                res.send({status: 500})
                return;
            }

            res.send({status: 200})

          })
        });
    
    })

    
})


app.post('/upload', function(req, res) {
    try{
        if(req.files){
            const key = Object.keys(req.files)[0]
            var file = req.files[key]

            let filetype = file.mimetype.split("/")[0];
            let dir = ""
            let mdir = ""
            if(filetype === "image"){
                dir =  __dirname + "/Uploads/Images/"
                mdir = __dirname + "/meta_db/images.json"
            }
            else if(filetype === "audio"){
                dir = __dirname + "/Uploads/Audio/"
                mdir = __dirname + "/meta_db/audio.json"
            }
            else if (filetype === "video"){
                dir = __dirname + "/Uploads/Video/"
                mdir = __dirname + "/meta_db/video.json"
            }
            else{
                dir = __dirname + "/Uploads/Others/"
                mdir = __dirname + "/meta_db/others.json"
            }


            file.mv(dir + file.name, function(err) {
                if(!err){

                    fs.readFile(mdir, 'utf8', (error, data) => {
                        if (error) {
                          console.log(error);
                          return;
                        }
                        const parsedData = JSON.parse(data);
                        parsedData.data.push(file.name)
                        fs.writeFile(mdir, JSON.stringify(parsedData, null, 2), (err) => {
                          if (err) {
                            console.log('Failed to write updated data to file');
                            return;
                          }
                          res.send({
                            status: true,
                            message: 'File is uploaded',
                            data: {
                              name: file.name,
                              mimetype: file.mimetype,
                              size: file.size,
                              des: dir
                            }
                          })
                        });
                    
                    })
                }
            })
    
        }
    }catch(err){
        console.log(err)
        res.status(500).send(err);
    }
    
        
})


app.get('/alldb', (req, res) => {
    let audio, video, images, others, data;
    audio = fs.readFileSync(__dirname + '/meta_db/audio.json', 'utf8')
    audio = JSON.parse(audio).data;

    video = fs.readFileSync(__dirname + '/meta_db/video.json', 'utf8')
    video = JSON.parse(video).data;

    images = fs.readFileSync(__dirname + '/meta_db/images.json', 'utf8')
    images = JSON.parse(images).data;

    others = fs.readFileSync(__dirname + '/meta_db/others.json', 'utf8')
    others = JSON.parse(others).data;

    data = {
        images,
        audio,
        video,
        others
    }

    const jsonData = JSON.stringify(data);
    res.status(200).send(jsonData);

})

app.get('/alluser', (req, res) => {
    fs.readFile(__dirname + "/" + "users.json", 'utf8', function(err, data){
        data = JSON.parse(data);    
        let resData = {data:[]}
        Object.keys(data).forEach(function(key) {
            if(data[key].type === "user"){
                resData.data.push({name: data[key].name, username: data[key].username})
            }
        });
        resData = JSON.stringify(resData)
        res.send(resData);
        
    });
})

app.post('/distribute',  (req, res) => {
    const reqdata  = req.body
    const users = reqdata.users;
    users.map(user => {
        fs.readFile(__dirname + "/user_db/" + user + ".json", 'utf8', (error, data) => {
            if (error) {
              console.log(error);
              return;
            }
            const parsedData = JSON.parse(data);
            parsedData[reqdata.ftype].push({file: reqdata.fname, timestamp: reqdata.timestamp, ftype: reqdata.ftype})
            fs.writeFile(__dirname + "/user_db/" + user + ".json", JSON.stringify(parsedData, null, 2), (err) => {
              if (err) {
                console.log('Failed to write updated data to file');
                return;
              }
            });
        
        })
    })
    res.send(JSON.stringify({status: 200}))
})


app.post('/userdata', (req, res) => {
    const user =  req.body.username
    fs.readFile(__dirname + "/user_db/" + user + ".json", 'utf8', function(err, data){
        res.send(data)
        
    });
})


app.get('/download', (req, res) => {
    console.log(req.query.fname, req.query.ftype)
    const ftype = req.query.ftype
    const fname = req.query.fname
    let dir = ""
    if(ftype === "images"){
        dir = __dirname + "/Uploads/Images/" + fname
    }
    else if(ftype === "audio"){
        dir = __dirname + "/Uploads/Audio/" + fname
    }
    else if (ftype === "video"){
        dir = __dirname + "/Uploads/Video/" + fname
    }
    else{
        dir = __dirname + "/Uploads/Others/" + fname
    }
    res.download(dir)
})

// Create a server to listen at port 8080
port = 8080
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })