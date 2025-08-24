import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

// basically the "brain" of your chat app that stores and manages 
// chat-related data so all your components can use it.

export const ChatContext = createContext();

export const ChatProvider = ({ children })=>{
  const [messages, setMessages] = useState([]); // Chat messages with the currently selected use
  const [users, setUsers] = useState([]); //  List of all users (for the sidebar).
  const [selectedUser, setSelectedUser] = useState(null); // Whichever user you clicked on to chat with.
  const [unseenMessages, setUnseenMessages] = useState({}); // format to track unread messages.

  const { socket, axios } = useContext(AuthContext);

  // Calls backend API to get all users.
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Jis user par click kiya hai (chat ke liye), uske saare messages backend se laata hai.
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

// Selected user ko message bhejne ke liye use hota hai. Agar message bhejna successful raha to screen par turant dikhata hai.
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };


//  Ye real-time messages ke liye hai. Jab naya message aaye socket se:
// Agar aap us user se baat kar rahe ho → message screen par turant dikhai dega aur backend ko mark as "seen" bhejega.
// Agar aap kisi aur user ke saath ho → unseenMessages me +1 kar dega.

  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });
  };

  
//Jab component band ho jaye ya user badal jaye, to purana listener hata dega (taaki duplicate na ho).
  const unsubscribeFromMessages = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}