import express from "express";
import authController from "../controller/authController.js";
import auth from "../middleWare/auth.js";
import blogController from "../controller/blogController.js";
import commentController from "../controller/commentController.js";

const router = express.Router();

//authController endPoints
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", auth, authController.logout);
router.get("/refresh", authController.refresh);

//blogController endPoints
router.post("/blog", auth, blogController.createBlog);
router.get("/blog/all", auth, blogController.getAll);
router.get("/blog/:id", auth, blogController.getBlogById);
router.put("/blog/update", auth, blogController.updateBlog);
router.delete("/blog/delete/:id", auth, blogController.deleteBlog);

//commentController endPoints
router.post("/comment", auth, commentController.createComment);
router.get("/comment/:id", commentController.readComment);

export default router;
