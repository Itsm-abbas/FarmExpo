import { getCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";

const getDecodedToken = () => {
  // Retrieve the token from cookies
  const token = getCookie("token");

  if (!token) {
    console.error("No token found.");
    return null;
  }

  try {
    // Decode the token
    const decoded = jwtDecode(token);

    // Return the decoded data
    return decoded;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

// Usage
export default getDecodedToken;
