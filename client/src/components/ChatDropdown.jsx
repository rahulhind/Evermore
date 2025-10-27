import { useState } from "react";
import {
  IconButton,
  Badge,
} from "@mui/material";
import { Message } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const ChatDropdown = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/messages");
  };

  return (
    <IconButton onClick={handleClick}>
      <Badge badgeContent={0} color="error">
        <Message sx={{ fontSize: "25px" }} />
      </Badge>
    </IconButton>
  );
};

export default ChatDropdown;
