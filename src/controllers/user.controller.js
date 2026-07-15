import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateHeaderName } from "http";
import { response } from "express";
import jwt from "jsonwebtoken";

// we use this both token in many place so that, s why we make one method for it , so we can use every where when we needed , its generate new token
// THE use of access and refresh token is that the user did not gave "email" and "Password " in login again and again
// Access Token : Short live , 15, 30 mints , 1 hour
// Refresh Token or session storage: we also take in db , if user access token is expired or invalid , user will get "401 request" , if "401" occurs did not ask user to login again , then hit an "endpoint" from there your or user "Access Token" maked "Refreshed" , then that user will get new "Token"
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAcessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; // it save in db means we here save refresh token in db
    await user.save({ validateBeforeSave: false }); // validateBeforeSave: in modal its required so we applied check dont check validation bcz here there is no need of validation

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user information from the frontend
  // validation - not empty
  // check if user already exits: username , email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove pasword and refresh token field from the response
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  //   if (fullName === "") {
  //     throw new ApiError(400, "fullName is required");
  //   }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUSer = await User.findOne({
    $or: [{ username }, { email }], // it is used to check if the username or email already exists in the database. The $or operator allows us to specify multiple conditions, and if any of them are true, the query will return a matching document. In this case, we are checking if there is a user with the same username or email as the one provided in the request body.
  });

  if (existingUSer) {
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file  is required ");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //   console.log("BODY:", req.body);
  //   console.log("FILES:", req.files);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ",
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body =>  data
  // username or email validation
  //find the user in db
  // if username or email avaible check password
  //access token and refresh token
  // send token in cookies

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or password is required");
  }
  // console.log("Request Body:", req.body);
  // console.log("Email:", email);
  // console.log("Username:", username);
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // console.log("User Found:", user);

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully",
      ),
    );
});

const loggedOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // This remove field from the document
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshAccessToken || req.body.refreshAccessToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unAuthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refresh Successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changes Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username, email } = req.body;

  if (!fullName && !username && !email) {
    throw new ApiError(400, "All Fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        // $set : it is mongdb where we use for update the data in db
        fullName,
        username,
        email: email, // it same  if we write email:email or only email
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  // Get current user to find old avatar
  const currentUser = await User.findById(req.user?._id);

  if (!currentUser) {
    throw new ApiError(400, "User not found");
  }
  // Delete old avatar first (if exists)
  if (currentUser.avatar) {
    await deleteFromCloudinary(currentUser.avatar);
  }
  // Upload new avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Avatar updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Cover Image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // Aggregation: Processing data inside MongoDB using the aggregation framework. It allows for complex data transformations and computations to be performed directly within the database, reducing the need for additional processing in the application layer. Aggregation is used here to fetch the user channel profile along with the number of subscribers, the number of channels they are subscribed to, and whether the current user is subscribed to this channel.
  // Pipline: A pipeline is a series of steps that MongoDB executes one by one. Like " $match, $lookup, $addFields, $project" are the steps in the pipline. Each step takes the input from the previous step, processes it, and passes the output to the next step. This allows for complex data transformations and computations to be performed directly within the database, reducing the need for additional processing in the application layer.

  // Why We use Aggregation: The Real Example of Aggregation is that we want to get the user channel profile with the number of subscribers, the number of channels they are subscribed to, and whether the current user is subscribed to this channel. This requires joining data from multiple collections (users and subscriptions) and performing calculations (counting subscribers and subscriptions). Aggregation allows us to do all of this in a single query, which is more efficient than making multiple queries and processing the data in the application layer.

  const channel = await User.aggregate([
    {
      $match: {
        // Filtering the documents in the "users" collection to find the user with the specified username. The username is converted to lowercase to ensure case-insensitive matching.
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        // it is used to Join the "users" collection with the "subscriptions" collection to get the subscribers of the user. It matches the "_id" field of the user with the "channel" field in the "subscriptions" collection and creates a new array field called "subscribers" in the output documents.
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        // Same as above but here we are getting the channels that the user is subscribed to. It matches the "_id" field of the user with the "subscriber" field in the "subscriptions" collection and creates a new array field called "subscribedTo" in the output documents.
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        // it is used to add new fields to the output documents. Here we are adding three new fields: "subscribersCount", "channelSubscribedToCount", and "isSubscribed". The first two fields are calculated using the "$size" operator, which counts the number of elements in the "subscribers" and "subscribedTo" arrays, respectively. The "isSubscribed" field is a boolean that indicates whether the current user (from the request) is subscribed to this channel. It uses the "$cond" operator to check if the current user's "_id" is in the "subscribers.subscriber" array.
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },

    {
      $project: {
        // it is used to specify which fields should be included or excluded in the output documents. Here we are including the "fullName", "username", "subscribersCount", "channelSubscribedToCount", "isSubscribed", "avatar", "coverImage", and "email" fields, and excluding all other fields (like "password" and "refreshToken"). The value of 1 means include the field, and 0 means exclude the field.
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel fetched successfully"),
    );
});

const getUserHistory = asyncHandler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id: new moongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully",
      ),
    );
});

export {
  registerUser,
  loginUser,
  loggedOut,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserHistory,
};
