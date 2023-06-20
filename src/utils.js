import {fileURLToPath} from 'url';
import { dirname } from 'path';
import multer from 'multer';
import bcrypt from 'bcrypt';
import  jwt  from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const private_key = "Codigosecreto"

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,`${__dirname}/public/images`)
    },
    filename:function(req,file,cb){
        console.log(file);
        cb(null,`${Date.now()}-${file.originalname}`)
    }
})

export const uploader = multer({storage,onError:function(err,next){
    console.log(err);
    next();
}});

export const generateToken = ( user ) => {
    const token = jwt.sign({user}, private_key, {expiresIn:'1m'})
    console.log(token)
    return token
}

export const authToken = (req, res, next) => {
    
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).send({error: 'No hay autenticacion'})

    const token = authHeader.split(' ')[1]
    jwt.verify(token,private_key,(error,credentials)=> {
        if(error) return res.status(403).send({error: 'no hay autorizacion'})

        req.user = credentials.user
        next()
    })

}

export const createHash = password => bcrypt.hashSync(password,bcrypt.genSaltSync(10));

export const isValidPassword = (user, password) => bcrypt.compareSync(password, user.password);


export default __dirname;