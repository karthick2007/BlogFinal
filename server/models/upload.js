var express  = require('express');
var app   =    express();
var crypto = require('crypto');
var path = require('path');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var multer = require('multer');
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
var methodOverride = require('method-override');
var configDb = require('../config/database');

module.exports =function(app){

    app.use(bodyParser.json());
    app.use(methodOverride('_method'));

    var gfs;
    var conn = mongoose.createConnection(configDb.url);

    conn.once('open',function(){
        gfs = Grid(conn.db,mongoose.mongo);
        gfs.collection('uploads');
    })
    //Create storage object
    var storage = new GridFsStorage({
        url: configDb.url,
        file: function(req, file) {
            return new Promise(function(resolve, reject) {
                crypto.randomBytes(16, function(err, buf)  {
                    if (err) {
                        return reject(err);
                    }
                    var filename = buf.toString('hex') + path.extname(file.originalname);
                    var fileUsername = req.user.username;
                    var fileUserId = req.user.id;
                    var fileTitle = req.body.title;
                    var fileDesc = req.body.description;
                    console.log(req.body.title);
                    var fileInfo = {
                        filename: filename,
                        metadata: {
                            username : fileUsername,
                            userId:fileUserId,
                            title:fileTitle,
                            description:fileDesc
                        },
                        bucketName: 'uploads'
                    };
                    resolve(fileInfo);
                });
            });
        }
    });
    var upload = multer({ storage:storage });

    app.post('/upload',upload.single('file'),function(req,res){
        //res.json({file:req.file});
        if(res.status === 500){
            res.render('profile',{message:'Upload error'});
        }else{
            res.render('profile',{message:'Upload successful'});
        }

    })



    app.get('/Portfolio',function(req,res){
        gfs.files.find().toArray(function(err,files){
            if(!files || files.length ==0) {
                res.render('Portfolio',{
                    files:false
                });
            }else{
                files.map(function(file){
                    if(file.contentType == 'image/jpeg' || file.contentType == 'image/png'){
                        file.isImage = true;
                    }else{
                        file.isImage = false;
                    }
                })

                res.render('Portfolio',{files:files
                });

            }

        })
    });

    app.get('/images',function(req,res){
        gfs.files.find().toArray(function(err,files){
            if(!files || files.length ==0) {
                return res.status(404).json(
                );
            }else{
                files.map(function(file){
                    if(file.contentType == 'image/jpeg' || file.contentType == 'image/png'){
                        file.isImage = true;
                    }else{
                        file.isImage = false;
                    }
                })

                return res.status(200).json({
                    files:files

                });

            }
        })
    })


    app.get('/image/:filename',function(req,res){
        gfs.files.findOne({filename:req.params.filename},function(err,file){
            if(!file || file.length==0){
                return res.status(404).json({
                    err: "No file exists"
                });
            }
            // Check if image
            if(file.contentType == 'image/jpeg' || file.contentType == 'image/png'){

                var readstream = gfs.createReadStream(file.filename);
                readstream.pipe(res);
            }else{
                res.status(404).json({
                    err: 'Not an Image'
                });
            }
        })
    })

    // Delete Pic from Profile page

    app.delete('/image/:filename',function(req,res){
        gfs.remove({filename:req.params.filename,root:'uploads'},function(err,gridStore){
            if(err){
                return res.status(404).json({err:err});
            }
            res.redirect('/profile');
        })
    })


}
