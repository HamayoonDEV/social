import Joi from "joi";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import UserDto from "../Dto/userDto.js";
import JwtService from "../services/JwtServices.js";
import RefreshToken from "../models/token.js";

const passwordPattren =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[ -/:-@\[-`{-~]).{6,64}$/;
const authController = {
  //create register method
  async register(req, res, next) {
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattren).required(),
    });
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { username, name, email, password } = req.body;
    //password hashing using bcrypt js
    const hashedPassword = await bcrypt.hash(password, 10);

    //handle username and email conflict
    try {
      const emailInUse = await User.exists({ email });
      const usernameInUse = await User.exists({ username });

      if (emailInUse) {
        const error = {
          status: 409,
          message: "email is already in use please use an other email!!",
        };
        return next(error);
      }
      if (usernameInUse) {
        const error = {
          status: 409,
          message:
            "username is not available please choose an other username!!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //saving in database
    let user;
    try {
      const userToRegister = new User({
        username,
        name,
        email,
        password: hashedPassword,
      });
      user = await userToRegister.save();
    } catch (error) {
      return next(error);
    }

    const accessToken = JwtService.signAccessToken({ _id: user._id }, "30m");
    const refreshToken = JwtService.signRefreshToken({ _id: user._id }, "60m");
    //store refreh Token in dataBase
    await JwtService.storeRefreshToken(user._id, refreshToken);
    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    //Dto
    const userDto = new UserDto(user);
    //sending response
    res.status(201).json({ user: userDto, auth: true });
  },
  //login method
  async login(req, res, next) {
    const userLoginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattren).required(),
    });
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { username, password } = req.body;
    let user;
    try {
      user = await User.findOne({ username });
      if (!user) {
        const error = {
          status: 401,
          message: "invalid username!!",
        };
        return next(error);
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        const error = {
          status: 401,
          message: "invalid password!!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    const accessToken = JwtService.signAccessToken({ _id: user._id }, "30m");
    const refreshToken = JwtService.signRefreshToken({ _id: user._id }, "60m");
    //update refreshToken in database
    await RefreshToken.updateOne(
      { _id: user._id },
      { token: refreshToken },
      { upsert: true }
    );
    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    //Dto
    const userDto = new UserDto(user);
    //sending response
    res.status(200).json({ user: userDto, auth: true });
  },
  //logout method
  async logout(req, res, next) {
    //fetch refresh Token from cookies
    const { refreshToken } = req.cookies;

    //delete cookie from data base
    try {
      await RefreshToken.deleteOne({ token: refreshToken });
      console.log("logoutRefreshToken", refreshToken);
    } catch (error) {
      return next(error);
    }
    //clearcookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    //sending response
    res.status(200).json({ user: null, auth: false });
  },
  //refresh method
  async refresh(req, res, next) {
    //geting refresh Token from cookies
    const originalRefrehToken = req.cookies.refreshToken;
    console.log(originalRefrehToken);

    //verify RefreshToken
    let id;
    try {
      id = await JwtService.verifyRefreshToken(originalRefrehToken)._id;
    } catch (error) {
      const e = {
        status: 401,
        message: "unAuthorized!!",
      };
      return next(e);
    }
    try {
      const match = await RefreshToken.findOne({
        _id: id,
        token: originalRefrehToken,
      });
      if (!match) {
        const error = {
          status: 401,
          message: "unAuthrozied!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //genrate new tokens
    const accessToken = JwtService.signAccessToken({ _id: id }, "30m");
    const refreshToken = JwtService.signRefreshToken({ _id: id }, "60m");
    //update refreshToken in database
    await RefreshToken.updateOne({ _id: id }, { token: refreshToken });
    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    //sending response
    const user = await User.findOne({ _id: id });
    const userDto = new UserDto(user);
    res.status(200).json({ user: userDto, auth: true });
  },
};

export default authController;
