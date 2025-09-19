import React, { useEffect, useState, useRef } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadSideData, setLoadSideData] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  // 🔑 Refs for latest values inside socket handlers
  const contactsRef = useRef(contacts);
  const selectedUserRef = useRef(selectedUser);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Load contacts after login
  useEffect(() => {
    if (user) socket.emit("addUser", user.username);

    const fetchContacts = async () => {
      setLoadSideData(true);
      try {
        // ✅ fetch from new endpoint (includes unread counts)
        const { data } = await axios.get(
          `${API_URL}/api/messages/contacts/list`,
          { withCredentials: true }
        );
        setContacts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadSideData(false);
      }
    };
    fetchContacts();
  }, [user]);

  // 🔥 Socket listeners (register once per user session)
  useEffect(() => {
    if (!user) return;

    const handleMessage = (msg) => {
      const contacts = contactsRef.current;
      const selectedUser = selectedUserRef.current;

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
        setMessages((prev) => {
          // 🔑 Replace optimistic fake msg with real one
          const idx = prev.findIndex(
            (m) =>
              m.optimistic &&
              m.text === msg.text &&
              m.sender === msg.sender &&
              m.receiver === msg.receiver
          );
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = enriched;
            return copy;
          }
          return [...prev, enriched];
        });
      } else {
        setContacts((prev) =>
          prev.map((c) =>
            c.username === msg.sender
              ? {
                  ...c,
                  unread: (c.unread || 0) + 1, // ✅ increment unread
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
        prev.map((m) => (messageIds.includes(m._id) ? { ...m, read: true } : m))
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

    // ✅ New: live updates for users
    const handleUserJoined = (newUser) => {
      setContacts((prev) => {
        const exists = prev.find((c) => c.username === newUser.username);
        if (exists) {
          return prev.map((c) =>
            c.username === newUser.username ? { ...c, ...newUser } : c
          );
        }
        return [...prev, newUser];
      });
    };

    const handleUserLeft = (username) => {
      setContacts((prev) =>
        prev.map((c) =>
          c.username === username
            ? { ...c, online: false, lastSeen: new Date().toISOString() }
            : c
        )
      );
    };

    socket.on("receiveMessage", handleMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("messageDeleted", handleDeleted);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);

    return () => {
      socket.off("receiveMessage", handleMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("messageDeleted", handleDeleted);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
    };
  }, [user]); // ✅ only re-run if user changes

  // Keep selectedUser in sync with contacts
  useEffect(() => {
    if (!selectedUser) return;
    const updated = contacts.find((c) => c.username === selectedUser.username);
    if (updated && JSON.stringify(updated) !== JSON.stringify(selectedUser)) {
      setSelectedUser(updated);
    }
  }, [contacts, selectedUser]);

  // Load messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        setLoading(true);
        const { data } = await axios.get(
          `${API_URL}/api/messages/${selectedUser.username}`,
          { withCredentials: true }
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
                ? { ...c, lastMessageAt: last.createdAt, unread: 0 } // ✅ reset unread on open
                : c
            )
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedUser?.username, user.username]);

  // 🔥 Optimistic message sending
  const sendAndSave = async (text) => {
    if (!text || !selectedUser) return;

    // Optimistic update
    const fakeMsg = {
      _id: Date.now().toString(),
      sender: user.username,
      receiver: selectedUser.username,
      text,
      createdAt: new Date().toISOString(),
      read: false,
      senderAvatar: user.avatar,
      senderName: user.name,
      optimistic: true, // 🔑 mark as optimistic
    };
    setMessages((prev) => [...prev, fakeMsg]);

    // Send to server
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
      await axios.post(`${API_URL}/api/auth/logout`, {
        withCredentials: true,
      });
      socket.disconnect();
      setTimeout(() => socket.connect(), 1000);
    } catch (err) {
      console.error(err);
    }
    logout();
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden bg-gray-100 flex flex-col ">
      <Navbar
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden ">
        {/* Sidebar */}
        <Sidebar
          contacts={[...contacts].filter((c) => c.username !== user?.username)}
          selectUser={handleSelectUser}
          selected={selectedUser?.username}
          isOpen={isSidebarOpen}
          loading={loadSideData}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Chatbox */}
        <div className="flex-1 bg-gray-50 px-4">
          {selectedUser ? (
            <ChatBox
              messages={messages}
              onSend={sendAndSave}
              selectedUser={selectedUser}
              loading={loading}
            />
          ) : (
            <div className="text-center min-h-screen -mt-16 flex flex-col items-center justify-center">
              <p className="text-gray-500 mb-4 text-sm md:text-lg">
                Select a contact to start chatting
              </p>

              {/* Start Chat button (mobile only) */}
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
