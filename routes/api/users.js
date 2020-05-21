const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');
const User = require('../../models/User.js');
// @route POST api/users
// @desc register a user
// @access Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'please enter valid email').isEmail(),
    check('password', 'Please enter valid password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    //validating checks

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //getting fields from post req

    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email: email });

      //checking if user already exists
      if (user) {
        return res
          .status(400)
          .json({ erros: [{ msg: 'userid(email) already exists' }] });
      }

      //if the user does not exist
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });
      user = new User({
        name,
        email,
        avatar,
        password,
      });
      const salt = await bcrypt.genSalt(10);

      const hash = await bcrypt.hash(user.password, salt);

      user.password = hash;

      (await user).save();
      const payload = {
        user: {
          id: user.id,
        },
      };

      const token = await jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3600000 }
        // (err, token) => {
        //   if (err) throw err;
        //   res.json({ token });
        // }
      );
      res.json({ token: token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
