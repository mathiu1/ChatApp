import React, { useEffect, useState } from "react";
import axios from "axios";
import socket from "./socket";
import { useAuth } from "./context/AuthContext";
import ChatBox from "./components/ChatBox";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

axios.defaults.withCredentials = true;

export default function App() {
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 👈 mobile sidebar state

  // Load contacts after login
  useEffect(() => {
    if (user) socket.emit("addUser", user.username);

    const fetchContacts = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/auth/users");
        setContacts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContacts();
  }, [user]);

  // Socket listeners
  useEffect(() => {
    if (!user) return;

    const handleMessage = (msg) => {
      const senderInfo =
        msg.sender === user.username
          ? { username: user.username, avatar: user.avatar, name: user.name }
          : contacts.find((c) => c.username === msg.sender) || {
              username: msg.sender,
            };

      const receiverInfo =
        msg.receiver === user.username
          ? { username: user.username, avatar: user.avatar, name: user.name }
          : contacts.find((c) => c.username === msg.receiver) || {
              username: msg.receiver,
            };

      const enriched = {
        ...msg,
        senderAvatar: senderInfo.avatar,
        senderName: senderInfo.name,
        receiverAvatar: receiverInfo.avatar,
      };

      if (
        selectedUser &&
        (msg.sender === selectedUser.username ||
          msg.receiver === selectedUser.username)
      ) {
        setMessages((prev) => [...prev, enriched]);
      } else {
        setContacts((prev) =>
          prev.map((c) =>
            c.username === msg.sender
              ? {
                  ...c,
                  unread: (c.unread || 0) + 1,
                  lastMessageAt: msg.createdAt,
                }
              : c
          )
        );
      }

      setContacts((prev) =>
        prev.map((c) =>
          c.username === msg.sender || c.username === msg.receiver
            ? { ...c, lastMessageAt: msg.createdAt }
            : c
        )
      );
    };

    const handleMessagesRead = ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id) ? { ...m, read: true } : m
        )
      );
    };

    const handleOnlineUsers = (onlineUsernames) => {
      setContacts((prev) =>
        prev.map((c) => ({
          ...c,
          online: onlineUsernames.includes(c.username),
        }))
      );
    };

    const handleDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on("receiveMessage", handleMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("messageDeleted", handleDeleted);

    return () => {
      socket.off("receiveMessage", handleMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("messageDeleted", handleDeleted);
    };
  }, [selectedUser?.username, user]);

  // Keep selectedUser synced
  useEffect(() => {
    if (!selectedUser) return;
    const updated = contacts.find(
      (c) => c.username === selectedUser.username
    );
    if (updated && JSON.stringify(updated) !== JSON.stringify(selectedUser)) {
      setSelectedUser(updated);
    }
  }, [contacts, selectedUser]);

  // Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/messages/${selectedUser.username}`
        );

        const enriched = data.map((msg) => {
          const senderInfo =
            msg.sender === user.username
              ? {
                  username: user.username,
                  avatar: user.avatar,
                  name: user.name,
                }
              : contacts.find((c) => c.username === msg.sender) || {
                  username: msg.sender,
                };
          return {
            ...msg,
            senderAvatar: senderInfo.avatar,
            senderName: senderInfo.name,
          };
        });

        setMessages(enriched);

        if (data.length > 0) {
          const last = data[data.length - 1];
          setContacts((prev) =>
            prev.map((c) =>
              c.username === selectedUser.username
                ? { ...c, lastMessageAt: last.createdAt }
                : c
            )
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [selectedUser?.username, contacts, user]);

  // Send message
  const sendAndSave = async (text) => {
    if (!text || !selectedUser) return;
    socket.emit("sendMessage", {
      sender: user.username,
      receiver: selectedUser.username,
      text,
    });
  };

  // Select user
  const handleSelectUser = (contact) => {
    setSelectedUser(contact);
    setContacts((prev) =>
      prev.map((c) =>
        c.username === contact.username ? { ...c, unread: 0 } : c
      )
    );
    setIsSidebarOpen(false);
  };

  // Logout
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout");
      socket.disconnect();
      setTimeout(() => socket.connect(), 1000);
    } catch (err) {
      console.error(err);
    }
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1  flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          contacts={contacts}
          selectUser={handleSelectUser}
          selected={selectedUser?.username}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Chatbox */}
        <div className="flex-1 bg-gray-50  px-4  ">
          {selectedUser ? (
            <ChatBox
              messages={messages}
              onSend={sendAndSave}
              selectedUser={selectedUser}
            />
          ) : (
             <div className=" text-center min-h-screen -mt-16 flex flex-col items-center justify-center">
      <p className="text-gray-500 mb-4 text-sm md:text-lg ">Select a contact to start chatting</p>

      {/* Start Chat button (only visible on mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-full shadow"
      >
        Start Chat
      </button>
    </div>
          )}
        </div>
      </div>
    </div>
  );
}
