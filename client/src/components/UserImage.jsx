import { Box } from "@mui/material";
// import { host } from "hs";
//const host="https://res.cloudinary.com/"

const UserImage = ({ image, size = "60px" }) => {
  console.log("Profile Image",image);
  return (
   
    <Box width={size} height={size}>
      <img
        style={{ objectFit: "cover", borderRadius: "50%" }}
        width={size}
        height={size}
        alt="user"
         src={`https://res.cloudinary.com/${process.env.CLOUD_NAME}/${image}`}
       // src={`${host}/dsrlvqk3i/assets/${image}`}
      />
    </Box>
  );
};

export default UserImage;
