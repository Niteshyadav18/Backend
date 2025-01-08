Backend Development Series - Chai or Backend
This repository contains the code for the Backend Development Series where I have developed a backend system using Node.js, Express, and MongoDB. This series helped me learn essential backend topics like JWT authentication, CRUD operations, API design, MongoDB aggregation pipeline, and much more. The goal of this project was to build a scalable and secure backend with clean, maintainable code.

Key Features
1. User Authentication:
JWT Authentication: Implemented JWT for secure access to user data. The system uses access tokens for secure user authentication and refresh tokens to maintain session integrity.
2. Controllers & Routes:
Developed various controllers and routes for handling user data, videos, comments, likes, tweets, and playlists.
3. CRUD Operations:
Implemented CRUD operations for handling user data:
loginUser: Secure login for users.
logoutUser: Log users out and terminate sessions.
registerUser: User registration with data validation.
refreshAccessToken: Refresh JWT tokens for extended sessions.
changeCurrentPassword: Allow users to change their passwords securely.
getCurrentUser: Fetch the currently logged-in user’s data.
updateUserAvatar: Allow users to update their profile avatar.
updateUserCoverImage: Allow users to update their cover image.
getUserChannelProfile: Fetch user’s channel profile.
getWatchHistory: Get the user's watch history.
updateAccountDetails: Update user account details.
4. Error Handling:
Implemented global error handling for catching errors throughout the application to ensure a smooth user experience.
5. MongoDB Operations & Aggregation Pipeline:
Utilized MongoDB for storing and retrieving user data efficiently.
Implemented aggregation pipeline for complex queries like calculating user statistics and retrieving data in specific formats.
6. Cloudinary Integration:
Integrated Cloudinary for image and media storage, enabling users to upload avatars, cover images, and other media files.
7. Unit Testing & Postman API Testing:
Wrote unit tests to ensure the functionality and security of the backend.
Performed Postman testing for API reliability, ensuring that all routes and controllers function as expected.
Installation
Follow the steps below to get the backend system up and running locally.

Prerequisites:
Node.js (v14 or higher)
MongoDB (locally or through a service like MongoDB Atlas)
Steps:
Clone the repository:

git clone https://github.com/yourusername/your-repository-name.git
Install dependencies:


cd your-repository-name
npm install
Set up environment variables in a .env file:


PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
CLOUDINARY_URL=your-cloudinary-url
Start the development server:


npm run dev
The server will now be running on http://localhost:5000.

API Documentation
1. POST /auth/register
Registers a new user.

Body:

{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}
2. POST /auth/login
Logs in a user and returns an access token.

Body:


{
  "email": "user@example.com",
  "password": "password123"
}
3. GET /user/current
Fetches the current logged-in user's data (requires JWT token).

4. PUT /user/update-avatar
Allows users to update their avatar image.

Body:

{
  "avatarUrl": "new-avatar-url"
}
5. PUT /user/update-cover-image
Allows users to update their cover image.

Body:


{
  "coverImageUrl": "new-cover-image-url"
}


Contributing
Feel free to fork this project, open issues, and submit pull requests. Contributions are welcome!
