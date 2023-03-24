const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const validator = require('validator');

const db = require('../utils/database');
const { response } = require('../app');
const promisePool = db.promise();



/* GET home page. */


router.get('/', async function (req, res, next) {
    const [rows] = await promisePool.query("SELECT asforum.*, asuser.name FROM asforum JOIN asuser ON asforum.authorId = asuser.id");
    res.render('index.njk', {
        rows: rows,
        title: 'Forum',
    });
});

router.get('/login', async function (req, res, next) {
    res.render('login.njk',
        {
            title: 'Login'
        });
});


router.get('/new', async function (req, res, next) {
    const [users] = await promisePool.query('SELECT * FROM asuser');
    res.render('new.njk', {
        title: 'Nytt inlägg',
        users,
    });
});

router.post('/new', async function (req, res, next) {
    const { title, content } = req.body;
    const [rows] = await promisePool.query('INSERT INTO asforum (authorId, title, content) VALUES (?, ?, ?)', [req.session.user.id, title, content]);
    res.redirect('/'); // den här raden kan vara bra att kommentera ut för felsökning, du kan då använda tex. res.json({rows}) för att se vad som skickas tillbaka från databasen
});



router.post('/login', async function (req, res, next) {
    const { username, password } = req.body;
    if (username === "" && password === "") {
        return res.send('Username is Required')
    }
    else if (username === "") {
        return res.send('Username is Required')
    }
    else if (password === "") {
        return res.send('Password is Required')
    }
    else {
        const [user] = await promisePool.query(`SELECT * FROM asuser WHERE name = ?`, [username])
        bcrypt.compare(password, user[0].password, function (err, result) {
            if (result === true) {
                req.session.user = user[0]  //Ifall det går att logga in, spara användarens data i sessions variabeln 'user'
                return res.redirect('/profile')

            }
            else {
                return res.send('Invalid username or password')
            }
        })
    }
});

router.get('/profile', async function (req, res, next) {
    if (req.session.user) {        //Kollar ifall det finns en 'user' i sessionen
        res.render('profile.njk', {
            name: req.session.user.name
        })
    }
    else {
        return res.status(401).send('Access denied')
    }
})

router.post('/logout', async function (req, res, next) {
    if (req.session.user) {
        req.session.destroy()
        return res.redirect('/')
    }
    else {
        return res.status(401).send('Access denied')
    }
})

router.get('/register', async function (req, res, next) {
    res.render('register.njk')

})

router.post('/register', async function (req, res, next) {
    const { username, password, passwordConfirmation } = req.body;
    if (username === "" && password === "" && passwordConfirmation === "") {
        return res.send('Username is Required')
    }
    else if (username === "") {
        return res.send('Username is Required')
    }
    else if (password === "") {
        return res.send('Password is Required')
    }
    else if (passwordConfirmation === "") {
        return res.send('Passwords should match')
    }

    if (password == passwordConfirmation) {

        bcrypt.hash(password, 10, async function (err, hash) {
            console.log(hash)
            const [rows] = await promisePool.query("SELECT * FROM asuser WHERE name = ?", [username])
            console.log(rows[0])
            if (rows.length === 0) {
                const [user] = await promisePool.query("INSERT INTO asuser (name, password) VALUES (?, ?)", [username, hash])
                const [sessionUser] = await promisePool.query("SELECT * FROM asuser WHERE name = ?", [username])
                req.session.user = sessionUser[0]
                return res.redirect('/profile')
            }
            else {
                return res.send('Username is already taken')
            }
            //const [rows] = await promisePool.query("INSERT INTO efusers (name, password) VALUES (?, ?)", [username, hash])
        });

    }
    else {
        return res.send('Passwords do not match')
    }
})

router.get('/crypt/:password', async function (req, res, next) {
    console.log(req.params)
    const password = req.params.password

    bcrypt.hash(password, 10, function (err, hash) {
        console.log(hash)
        return res.json({ hash });

    });

})



module.exports = router;
