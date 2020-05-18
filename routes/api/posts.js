const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Posts');

// @route Post api/posts
// @desc  send post
// @access private
router.post(
  '/',
  [auth, [check('text', 'text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      return res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'server error' });
    }
  }
);

// @route Get api/posts
// @desc  get all  posts
// @access private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    return res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Get api/posts/:post_id
// @desc  get post by id
// @access private
router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(400).json({ msg: 'post not found' });
    }
    return res.json(post);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Delete api/posts/:post_id
// @desc  delete a post
// @access private
router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'user not authorized' });
    }
    if (!post) {
      return res.status(400).json({ msg: 'post not found' });
    }
    await post.remove();
    return res.json({ msg: 'post removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Put api/posts/like/:post_id
// @desc  like a post
// @access private

router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //check if post is already liked
    if (
      post.likes.map((item) => item.user.toString()).indexOf(req.user.id) != -1
    ) {
      return res.status(400).json({ msg: 'post already liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    return res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Put api/posts/unlike/:post_id
// @desc  unlike a post
// @access private

router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //check if post is already liked
    const ind = post.likes
      .map((item) => item.user.toString())
      .indexOf(req.user.id);
    if (ind == -1) {
      return res.status(400).json({ msg: 'post not liked' });
    }
    post.likes.splice(ind, 1);
    await post.save();
    return res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

// @route Put api/posts/comment/post_id
// @desc  send a comment
// @access private
router.put(
  '/comment/:post_id',
  [auth, [check('text', 'text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.post_id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      post.comments.unshift(newComment);
      post.save();
      return res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'server error' });
    }
  }
);

// @route Delete api/posts/comment/:post_id/:comment_id
// @desc  delete a comment
// @access private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    // get the comment
    const comment = post.comments.find(
      (comment) => comment.id == req.params.comment_id
    );
    if (!comment) {
      return res.status(400).json({ msg: 'no such comment' });
    }
    if (req.user.id.toString() !== comment.user.toString()) {
      return res.status(401).jons({ msg: 'user not authorized' });
    }
    const ind = post.comments
      .map((item) => item._id)
      .indexOf(req.params.comment_id);
    post.comments.splice(ind, 1);

    await post.save();
    return res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'server error' });
  }
});

module.exports = router;
