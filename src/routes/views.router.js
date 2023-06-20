import express from "express";
import { createHash } from '../utils.js';
import passport from 'passport';
import productsModel from '../dao/models/products.js';
import cartsModel from '../dao/models/carts.js';
import userModel from '../dao/models/user.js';
import __dirname from '../utils.js';

const router = express.Router();

// Middleware para validar rutas privadas
const privateRoute = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};
// Middleware para validar rutas públicas
const publicRoute = (req, res, next) => {
    if (!req.session.user) {
        next();
    } else {
        res.redirect('/products');
    }
};

router.get('/', publicRoute, (req,res)=>{
    res.render('index')
})

router.post('/register', 
    passport.authenticate('register', {
        successRedirect: '/products',
        failureRedirect: '/',
        failureFlash: true
    })
)

router.get('/login', publicRoute, (req, res) => {
    res.render('login');
});

router.post('/login',
    passport.authenticate('login', 
        {failureRedirect: '/login',}
    ), 
    async (req, res) => {
        if(!req.user) return res.status(400).send({status: "error", error: "Credenciales incorrectas"})
        req.session.user = req.user;
        res.redirect('/products');
    }
);

router.get('/logout', privateRoute, (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

router.get('/recovery', publicRoute, (req, res) => {
    res.render('recovery');
})

router.post('/recovery', publicRoute, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            res.redirect('/recovery');
        } else {
            const passHash = createHash(password);
            user.password = passHash;
            await user.save();
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.redirect('/reset-password');
    }
})

router.get('/home', async (req, res) => {
    try {
        let products = await productsModel.find().lean();
        res.render('home', { products, style: 'index.css'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error.');
    }
});

router.get('/chat',(req,res)=>{
    res.render('chat');
})

router.get('/realtimeproducts', async (req, res) => {
    try {
        res.render('realTimeProducts', {style: 'index.css'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error.');
    }
});

router.get('/carts', async (req, res) => {
    try {
        let carts = await cartsModel.find().populate('products.product').lean();
        res.render('carts', { carts, style: 'index.css'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error.');
    }
});

router.get('/products', privateRoute, async (req,res)=>{
    try {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
    const {firstname, lastname, email, age} = req.session.user;    
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    let sort = req.query.sort;
    let category = req.query.category;
    let query = {};
    let options = {page, limit, lean:true, sort:{} };
    if (category && category !== 'undefined') {
        query.category = category;
    }
    if (sort === 'asc') {
    options.sort.price = 1;
    } else if (sort === 'desc') {
    options.sort.price = -1;
    }

    let result = await productsModel.paginate(query, options, {style: 'index.css'});

    result.prevLink = result.hasPrevPage ? `http://localhost:8080/products?page=${result.prevPage}&limit=${limit}&sort=${sort}&category=${category}` : '';
result.nextLink = result.hasNextPage ? `http://localhost:8080/products?page=${result.nextPage}&limit=${limit}&sort=${sort}&category=${category}` : '';
    result.isValid= !(page<=0||page>result.totalPages)
    result.firstname = firstname;
    result.lastname = lastname;
    result.email = email;
    result.age = age;
    res.render('products',result)
    console.log({
        status: result.status,
        payload: result.docs,
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.prevLink,
        nextLink: result.nextLink
      });
    }}  
    catch (error) {
    console.error(error);
    res.status(500).send('Internal server error.');
    }
    })
export default router;