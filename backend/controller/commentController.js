import Joi from "joi";
import Comment from "../models/comments.js";
const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
const commentController = {
  //create Comment method
  async createComment(req, res, next) {
    const createCommentSchema = Joi.object({
      content: Joi.string().required(),
      author: Joi.string().regex(mongoIdPattern).required(),
      blog: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = createCommentSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { content, author, blog } = req.body;
    try {
      const newComment = new Comment({
        content,
        author,
        blog,
      });
      await newComment.save();
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(201).json({ message: "comment created!" });
  },
  //read comments by blog id method
  async readComment(req, res, next) {
    const readCommentSchema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = readCommentSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    try {
      const comments = await Comment.find({ blog: id });
      const commentArr = [];
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        commentArr.push(comment);
      }
      return res.status(200).json({ comments: commentArr });
    } catch (error) {
      return next(error);
    }
  },
};
export default commentController;
