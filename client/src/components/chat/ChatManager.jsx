import React, { useState } from "react";
import FloatingChatList from "./FloatingChatList";
import FloatingChatWindow from "./FloatingChatWindow";
import CreateGroupDialog from "components/messages/CreateGroupDialog";

const ChatManager = ({ showChatList, onCloseChatList }) => {
  const [openChats, setOpenChats] = useState([]);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);

  const handleSelectFriend = (friend) => {
    const existingChat = openChats.find(
      (chat) => chat.id === friend._id && chat.type === "dm"
    );
    
    if (!existingChat) {
      if (openChats.length >= 3) {
        setOpenChats([...openChats.slice(1), { id: friend._id, data: friend, type: "dm" }]);
      } else {
        setOpenChats([...openChats, { id: friend._id, data: friend, type: "dm" }]);
      }
    }
  };

  const handleSelectGroup = (group) => {
    const existingChat = openChats.find(
      (chat) => chat.id === group._id && chat.type === "group"
    );
    
    if (!existingChat) {
      if (openChats.length >= 3) {
        setOpenChats([...openChats.slice(1), { id: group._id, data: group, type: "group" }]);
      } else {
        setOpenChats([...openChats, { id: group._id, data: group, type: "group" }]);
      }
    }
  };

  const handleCloseChat = (chatId) => {
    setOpenChats(openChats.filter((chat) => chat.id !== chatId));
  };

  const handleGroupCreated = () => {
    setOpenCreateGroup(false);
    // Optionally refresh the chat list
  };

  return (
    <>
      {/* Floating Chat List */}
      {showChatList && (
        <FloatingChatList
          onClose={onCloseChatList}
          onSelectFriend={handleSelectFriend}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={() => setOpenCreateGroup(true)}
        />
      )}

      {/* Floating Chat Windows */}
      {openChats.map((chat, index) => (
        <FloatingChatWindow
          key={chat.id}
          friend={chat.type === "dm" ? chat.data : null}
          group={chat.type === "group" ? chat.data : null}
          isGroup={chat.type === "group"}
          position={index}
          onClose={() => handleCloseChat(chat.id)}
        />
      ))}

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={openCreateGroup}
        onClose={() => setOpenCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
};

export default ChatManager;
