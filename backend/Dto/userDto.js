class UserDto {
  constructor(user) {
    this._id = user._id;
    this.name = user.name;
    this.username = user.username;
    this.createdAt = user.createdAt;
  }
}
export default UserDto;
