import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";


// Signup a new user
// Reads fullName, email, password, and bio from the request.

// Checks if any field is missing → sends error if yes.

// Checks if a user already exists with the given email.

// Hashes the password with bcrypt (salt for extra security).

// Saves the new user to the database.

// Generates a JWT token using generateToken (so they stay logged in).

// Sends back success: true, the new user’s data, token, and a message.
export const signup = async (req, res)=>{
    const { fullName, email, password, bio } = req.body;
    
    try {
        if (!fullName || !email || !password || !bio){
            return res.json({success: false, message: "Missing Details" })
        }
        const user = await User.findOne({email});
        
        if(user){
            return res.json({success: false, message: "Account already exists" })
        }

       const salt = await bcrypt.genSalt(10);
       const hashedPassword = await bcrypt.hash(password, salt);

       const newUser = await User.create({
       fullName, email, password: hashedPassword, bio});

       const token = generateToken(newUser._id);
       res.json({success: true, userData: newUser, token, message: "Account created successfully"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})

    }
}


// Controller to login a user 
// Reads email and password from the request.

// Finds the user in the database by email.

// Compares the given password with the hashed password in DB using bcrypt.

// If passwords match → generate JWT token.

// Sends back user data, token, and success message.
export const login = async (req, res) =>{
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({email}) // from database

        const isPasswordCorrect = await bcrypt.compare(password, userData.password); 
        
        if (!isPasswordCorrect){
       return res.json({ success: false, message: "Invalid credentials" });
}

const token = generateToken(userData._id)

res.json({success: true, userData, token, message: "Login successful"})
} catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}


// Controller to check if user is authenticated
// req.user is already set by the protectRoute middleware (from the token).

// Just returns success: true with the user info.
export const checkAuth = (req, res)=>{
    res.json({success: true, user: req.user});
}


// Controller to update user profile details
// Reads profilePic, bio, and fullName from request.

// Gets the current user’s ID from req.user.

// If no profile picture → just update bio and fullName.

// If there is a profile picture → upload it to Cloudinary (image hosting service).

// Update the user in MongoDB with new image URL and details.

// Return the updated user data.
export const updateProfile = async (req, res)=>{
    try {
        const { profilePic, bio, fullName } = req.body;
        
        const userId = req.user._id;
        let updatedUser;
        
       if(!profilePic){
    updatedUser = await User.findByIdAndUpdate(userId, {bio, fullName}, 
    {new: true});
} else{
    const upload = await cloudinary.uploader.upload(profilePic);
    
    updatedUser = await User.findByIdAndUpdate(userId, {profilePic: upload.
    secure_url, bio, fullName}, {new: true});
}
res.json({success: true, user: updatedUser})
} catch (error) {
    console.log(error.message);
    
    res.json({success: false, message: error.message})
}
}