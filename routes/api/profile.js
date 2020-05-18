const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');
// @route GET api/profile/me
// @desc  get current users profile
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Post api/profile
// @desc create or update a user profile
//@acces private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'status required').not().isEmpty(),
      check('skills', 'skills required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // return res.json(req.body);
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills)
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    // console.log(profileFields.skills);
    // if (company) profileFields.company = company;
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'server error' });
    }
  }
);

// @route Post api/profile/all
// @desc get all profiles
//@acces public

router.get('/all', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Get  api/profile/user/:user_id
// @desc get  profile by user_id placeholder(parameter)
//@acces public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'not such profile with given id' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Delete api/profile
// @desc delete profile by token(user_id)
//@acces private
router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'user deleted ' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Put api/profile/experience
// @desc add profile exp
//@acces private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'title is requried').not().isEmpty(),
      check('company', 'company is requried').not().isEmpty(),
      check('from', 'from date is requried').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ errors: error.array() });
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;
    const newexp = {
      title: title,
      company: company,
      location: location,
      from: from,
      to: to,
      current: current,
      description: description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.json({ msg: 'no such profile' });
      }
      profile.experience.unshift(newexp);
      await profile.save();
      return res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'server error' });
    }
  }
);

// @route Delete api/profile/experience/:exp_id
// @desc delete profile experience
//@acces private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.json({ msg: 'no such profile' });
    }
    const ind = profile.experience
      .map((exp) => exp._id)
      .indexOf(req.param.exp_id);
    profile.experience.splice(ind, 1);
    await profile.save();
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Put api/profile/education
// @desc add educatiom
//@acces private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'school is requried').not().isEmpty(),
      check('degree', 'degree is requried').not().isEmpty(),
      check('fieldofstudy', 'field date is requried').not().isEmpty(),
      check('from', 'from date is requried').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ errors: error.array() });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;
    const newexp = {
      school: school,
      degree: degree,
      fieldofstudy: fieldofstudy,
      from: from,
      to: to,
      current: current,
      description: description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.json({ msg: 'no such profile' });
      }
      profile.education.unshift(newexp);
      await profile.save();
      return res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'server error' });
    }
  }
);

// @route Delete api/profile/education/:edu_id
// @desc delete profile education
//@acces private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.json({ msg: 'no such profile' });
    }
    const ind = profile.education
      .map((edu) => edu._id)
      .indexOf(req.param.edu_id);
    profile.education.splice(ind, 1);
    await profile.save();
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route get api/profile/github/:user_name
// @desc get github profile by user_name
//@acces public

router.get('/github/:user_name', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.user_name
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubclientid'
      )}&client_secret=${config.get('githubsecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };
    request(options, (error, response, body) => {
      if (error) console.error(error.message);
      if (response.statusCode != 200) {
        res.status(400).json({ msg: 'no github profile' });
      }
      return res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

module.exports = router;
