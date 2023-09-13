class BlogsDto {
  constructor(blog) {
    this._id = blog._id;
    this.content = blog.content;
    this.title = blog.title;
    this.photopath = blog.photopath;
    this.createdAt = blog.createdAt;
    this.author = blog.author;
  }
}
export default BlogsDto;
