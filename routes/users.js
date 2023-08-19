import express from "express";
import { _register, _login, _getUserInfoById, _createRequest, _getAllRequests, 
    _getAllRequestsCount, _treatRequest, _uploadPhoto, _updateProfile, _getStudentRequests, _sendQrCode } from "../controllers/users.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../utils/upload.utils.js";

const u_router = express.Router();

u_router.post("/register", _register);
u_router.post("/login", _login);
u_router.post("/get-user-info-by-id", verifyToken, _getUserInfoById);
u_router.post("/createRequest", verifyToken, _createRequest);
u_router.get("/getAllRequests", verifyToken, _getAllRequests);
u_router.get("/getStudentRequests", verifyToken, _getStudentRequests);
u_router.get("/getAllRequestsCount", verifyToken, _getAllRequestsCount);
u_router.post("/treatRequest", verifyToken, _treatRequest);
u_router.post("/update-profile", upload.single("file"), _updateProfile);
u_router.post("/upload-photo", verifyToken, upload.single("file"), _uploadPhoto);
u_router.post("/sendQrCode", verifyToken, _sendQrCode);

export default u_router;