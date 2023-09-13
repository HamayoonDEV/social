import Joi from "joi";
import fs from "fs";
import Blog from "../models/blog.js";
import { BACKEND_SERVER_PATH } from "../config/index.js";
import BlogsDto from "../Dto/BlogsDto.js";
import Comment from "../models/comments.js";
const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
const blogController = {
  //create blog method
  async createBlog(req, res, next) {
    const blogCreateSchema = Joi.object({
      content: Joi.string().required(),
      title: Joi.string().required(),
      photopath: Joi.string().required(),
      author: Joi.string().required(),
    });
    const { error } = blogCreateSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { content, title, photopath, author } = req.body;

    //read photo in buffer
    const buffer = Buffer.from(
      photopath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
      "base64"
    );
    //allocat random names
    const imagePath = `${Date.now()}-${author}.png`;
    try {
      //store locally
      fs.writeFileSync(`storage/${imagePath}`, buffer);
    } catch (error) {
      return next(error);
    }
    //store in database
    let blog;
    try {
      const newBlog = new Blog({
        content,
        title,
        author,
        photopath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`,
      });
      blog = await newBlog.save();
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(201).json({ blog });
  },
  //get all blogs
  async getAll(req, res, next) {
    try {
      const blogs = await Blog.find({});
      const blogsArr = [];
      for (let i = 0; i < blogs.length; i++) {
        const blog = new BlogsDto(blogs[i]);
        blogsArr.push(blog);
      }
      return res.status(200).json({ blogs: blogsArr });
    } catch (error) {
      return next(error);
    }
  },
  //get blog by id
  async getBlogById(req, res, next) {
    const blogByIdSchema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = blogByIdSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    let blog;
    try {
      blog = await Blog.findOne({ _id: id });
      if (!blog) {
        const error = {
          status: 503,
          message: "Blog unAvailable please add correct id!!!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    const blogDto = new BlogsDto(blog);
    //sending respone
    res.status(200).json({ blog: blogDto });
  },
  //update blog method
  async updateBlog(req, res, next) {
    const updateBlogSchema = Joi.object({
      content: Joi.string(),
      title: Joi.string(),
      photopath: Joi.string(),
      author: Joi.string().regex(mongoIdPattern).required(),
      blogId: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = updateBlogSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { author, blogId, content, title, photopath } = req.body;
    try {
      const blog = await Blog.findOne({ _id: blogId });
      if (photopath) {
        //delete prevoius photo
        let prevoius = blog.photopath;
        prevoius = prevoius.split("/").at(-1);
        fs.unlinkSync(`storage/${prevoius}`);

        //read photo in buffer
        const buffer = Buffer.from(
          photopath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
          "base64"
        );
        //allocat random names
        const imagePath = `${Date.now()}-${author}.png`;
        try {
          //store locally
          fs.writeFileSync(`storage/${imagePath}`, buffer);
        } catch (error) {
          return next(error);
        }
        try {
          await Blog.updateOne(
            { _id: blogId },
            {
              title,
              content,
              photopath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`,
            }
          );
        } catch (error) {
          return next(error);
        }
      } else {
        try {
          await Blog.updateOne({ _id: blogId }, { content, title });
        } catch (error) {
          return next(error);
        }
      }
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(200).json({ message: "Blog has been updated!!" });
  },
  //delte blog by id
  async deleteBlog(req, res, next) {
    const deleteBlogSchema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = deleteBlogSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    try {
      await Blog.deleteOne({ _id: id });
      await Comment.deleteMany({});
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(200).json({ message: "Blog has been deleted!!" });
  },
};

export default blogController;
