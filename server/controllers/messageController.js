import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


// Get all users except the logged in user
// Take req.user._id → this is the logged-in user.

// Find all other users in the User collection ($ne means “not equal”).

// For each user, search Message for messages they sent to you that are not seen yet.

// Store that count in unseenMessages.

// Send both users and unseenMessages to the frontend.
export const getUsersForSidebar = async (req, res)=>{
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password");
        
        // Also counts how many unread messages each user has sent to the logged-in user.
        const unseenMessages = {};
        const promises = filteredUsers.map(async (user)=>{
            const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false})
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length;
            }
        });

        
await Promise.all(promises);
res.json({ success: true, users: filteredUsers, unseenMessages });
} catch (error) {
  console.log(error.message);
  res.json({ success: false, message: error.message });
}

}


// Get all messages for selected user
// Take selectedUserId from the request URL.

// Find messages where:

// You sent it to them, OR

// They sent it to you.

// Update all their messages sent to you → set seen: true.

// Return all messages to the frontend.
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ]
    });

    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    res.json({ success: true, messages });
} catch (error) {
  console.log(error.message);
  res.json({ success: false, message: error.message });
}
}


// api to mark message as seen using message id
// Get id (message ID) from the URL.

// Update that message → seen: true.

// Return success.
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true })
} catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
} 



// Send message to selected user

// Get text and image from the request body.
// Get receiverId from the URL.
// Get senderId from the logged-in user.
// If an image is attached, upload it to Cloudinary and get the image URL.
// Save the message to the database.
// If the receiver is online (userSocketMap), send them the new message via Socket.IO.
// Return the new message to the sender.

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    
    let imageUrl;
if (image) {
  const uploadResponse = await cloudinary.uploader.upload(image);
  imageUrl = uploadResponse.secure_url;
}

const newMessage = await Message.create({
  senderId,
  receiverId,
  text,
  image: imageUrl
});

// Emit the new message to the receiver's socket
const receiverSocketId = userSocketMap[receiverId];
if (receiverSocketId){
    io.to(receiverSocketId).emit("newMessage", newMessage)
}


res.json({ success: true, newMessage });

    
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}
