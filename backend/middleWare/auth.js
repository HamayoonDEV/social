import JwtService from "../services/JwtServices.js";
import User from "../models/user.js";
import UserDto from "../Dto/userDto.js";

const auth = async (req, res, next) => {
  //fetch accessTokem and refreshToken from cookies

  const { accessToken, refreshToken } = req.cookies;

  if (!accessToken || !refreshToken) {
    const error = {
      status: 401,
      message: "unAuthorized!!",
    };
    return next(error);
  }
  //verifyAccessToken
  let id;
  try {
    id = await JwtService.verifyAccessToken(accessToken)._id;
  } catch (error) {
    return next(error);
  }
  let user;
  try {
    user = await User.findOne({ _id: id });
  } catch (error) {
    return next(error);
  }
  //dto
  const userDto = new UserDto(user);
  req.user = userDto;
  next();
};
export default auth;
