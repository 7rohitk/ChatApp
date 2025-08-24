import { createContext, useEffect, useState } from "react";
import axios from "axios"; //for API calls.
import toast from "react-hot-toast"; //for showing success/error notifications.
import {io} from "socket.io-client";


// 1. What is React Context?
// React Context is a way to create global state that all components can access without passing props manually through every level.

// Think of it as a central storage + delivery system:

// Storage — keeps data like logged-in user, chat messages, online users.

// Delivery — any component can read or update that data without prop drilling.




// 2. AuthContext.jsx — Authentication State Manager
// Purpose:
// Keeps track of the logged-in user and authentication details so that any component knows:

// Who is logged in

// Whether the user is authenticated

// How to log in/out



const backendUrl = import.meta.env.VITE_BACKEND_URL;  // loaded from .env file (your backend’s URL).
axios.defaults.baseURL = backendUrl;  // storing base URL so instead of writing  axios.get("http://localhost:5000/api/auth/check"); we can write axios.get("/api/auth/check");


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

const [token, setToken] = useState(localStorage.getItem("token")); // JWT saved from login; stored in localStorage so it persists after refresh.
const [authUser, setAuthUser] = useState(null); // current logged-in user’s info.
const [onlineUsers, setOnlineUsers] = useState([]); //  array of IDs of currently online users (from socket server).
const [socket, setSocket] = useState(null); //Socket.IO connection object.



// Check if user is authenticated and if so, set the user data and connect the socket
const checkAuth = async () => {
  try {
    const { data } = await axios.get("/api/auth/check"); //  to see if the stored token is valid. - retrieving data from server
    if (data.success) {
      setAuthUser(data.user);
      connectSocket(data.user);
    }
  } catch (error) {
    toast.error(error.message)
  }
}


// Login function to handle user authentication and socket connection
//Handles both login and signup based on the state passed

// If state = "login", request goes to /api/auth/login.
// If state = "signup", request goes to /api/auth/signup
// backend me jayega daata aayega login ke baad use set kr dega


const login = async (state, credentials)=>{
  try {
    const { data } = await axios.post(`/api/auth/${state}`, credentials);  //Create a new resource on the server.
    if (data.success){
      setAuthUser(data.userData);
      connectSocket(data.userData);
      axios.defaults.headers.common["token"] = data.token;
      setToken(data.token);
      localStorage.setItem("token", data.token);
      toast.success(data.message);
    }
    else {
        toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  }
}


// Logout function to handle user logout and socket disconnection
// Clears all user data and token.
// Disconnects socket so user is no longer considered online.

const logout = async () =>{
  localStorage.removeItem("token");
  setToken(null);
  setAuthUser(null);
  setOnlineUsers([]);
  axios.defaults.headers.common["token"] = null;
  toast.success("Logged out successfully")
  socket.disconnect();
} 

// Sends updated profile data to server.
const updateProfile = async (body)=>{
  try {
    const { data } = await axios.put("/api/auth/update-profile", body);  //Update/replace an existing resource 
    if(data.success){
      setAuthUser(data.user);
      toast.success("Profile updated successfully")
    }
  } catch (error) {
    toast.error(error.message)
  }
}

// agar pahele se socket connected nhi hai to naya socket banao or connect karo
const connectSocket = (userData) => {
  if (!userData || socket?.connected) return;
 
// Connects to backend with userId in query (so server knows which user is connecting). 
  const newSocket = io(backendUrl, {
    query: {
      userId: userData._id,
    },
  });

  newSocket.connect();
  setSocket(newSocket);
 
  newSocket.on("getOnlineUsers", (userIds) => {
    setOnlineUsers(userIds);
  });
};

// Runs once when app loads.

// If a token exists in localStorage → set it in axios headers.

// Then call checkAuth() to verify token and log user in automatically.
useEffect(() => {
  if (token) {
    axios.defaults.headers.common["token"] = token;
  }
  checkAuth();
}, []);


// Makes all these values/functions available to any component
  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


