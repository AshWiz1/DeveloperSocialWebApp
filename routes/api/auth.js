const express = require('express');
const router = express.Router();
const config = require('config');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route GET api/auth
// @desc get the user from token
// @access Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

//Post call
router.post(
  '/',
  [
    check('email', 'please enter valid email').isEmail(),
    check('password', 'Please enter valid password').not().isEmpty(),
  ],
  async (req, res) => {
    //validating checks

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //getting fields from post req

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email: email });

      //checking if user already exists
      if (!user) {
        return res
          .status(400)
          .json({ erros: [{ msg: 'userid(email) does not  exists' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'incorrect credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      // generate token
      const token = await jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3600000 }
        // (err, token) => {
        //   if (err) throw err;
        //   res.json({ token });
        // }
      );
      res.json({ user, token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
