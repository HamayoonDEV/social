import jwt from "jsonwebtoken";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../config/index.js";
import RefreshToken from "../models/token.js";

class JwtService {
  //signAccessToken
  static signAccessToken(payload, expiryTime) {
    return jwt.sign(payload, ACCESS_TOKEN, { expiresIn: expiryTime });
  }
  //signRefreshToken
  static signRefreshToken(payload, expiryTime) {
    return jwt.sign(payload, REFRESH_TOKEN, { expiresIn: expiryTime });
  }
  //verifyAccessToken
  static verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_TOKEN);
  }
  //verifyRefreshToken
  static verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_TOKEN);
  }
  //storeRefreshToken
  static async storeRefreshToken(userId, token) {
    const newToken = new RefreshToken({
      userId,
      token,
    });
    await newToken.save();
  }
}
export default JwtService;
