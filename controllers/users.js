import { register, login, isMember, isUser, getUserInfo, createRequest, 
  getAllRequests, getAllRequestsCount, treatRequest, updateProfile, getStudentRequests } from "../models/users.js";
import bcrypt from "bcrypt";
import jwt  from "jsonwebtoken";
import nodemailer from'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import dotenv from "dotenv";
import qrCode from 'qrcode';
import fs from 'fs';

dotenv.config();

export const _register = async (req, res) => {
  try {
      const { email, password } = req.body;

      // Check if the user exists in the members table
      const existingMember = await isMember(email.toLowerCase());
      if (existingMember.length === 0) {
          return res.status(404).send({ message: "User is not a member", success: false });
      }
      const member_id = existingMember[0].member_id;
    
      // Check if the user already exists 
      const existingUser = await isUser(email.toLowerCase());
      if (existingUser.length !== 0) {
          return res.status(404).send({ message: "User already exists", success: false });
      }

      const hash = await bcrypt.hash(password + "", 10);
      const lower_email = email.toLowerCase();
      await register(lower_email, hash, member_id);
      return res.status(200).send({ message: "User created successfully", success: true });

  } catch (err) {
      res.status(500).send({ message: "Error creating user", success: false });
  }
};

export const _login = async(req, res) =>{
    try{
       const row = await login(req.body.email.toLowerCase())
        if (row.length === 0) return res.status(404).send({ message: "User doesn't exists", success: false });

       const match = await bcrypt.compare(req.body.password, row[0].password);
       if (!match) return res.status(400).send({ message: "Password is incorrect", success: false });

       const member_id = row[0].member_id;

       const accessToken = jwt.sign({member_id }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1d",
        });

      return res.status(200).send({ message: "Login successful", success: true, token: accessToken});
    }
    catch(err){
        res.status(500).send({ message: "Error logging in", success: false, err });
      }
}

export const _getUserInfoById = async (req, res) => {
  try {
    const user = await getUserInfo( req.body.userId );
    console.log('info =>>>',user);
    if (user.length === 0) {
      return res
        .status(404)
        .send({ message: "User does not exist", success: false });
    } else {
      res
      .status(200)
      .send({success: true, user_data: {
        member_id : user[0].member_id,
        role: user[0].role,
        firstname: user[0].firstname,
        lastname: user[0].lastname,
        email: user[0].email,
        image: user[0].location
      }
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
};

export const _createRequest =  async (req, res) => {
  try {
    console.log('create request', req.body);
    const {member_id, destination, exitTime, returnTime, comments} = req.body
    const request = await createRequest( member_id, destination, exitTime, returnTime, comments );
    res.status(200).json({
      message: "Request sent successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error sending request",
      success: false,
    });
  }
};

export const _getAllRequests = async (req, res) => {
  try{
    const {member_id,status} = req.query;

    const requests = await getAllRequests(member_id, status);
    console.log(requests.rows);

    res.status(200).json({
      message: "Requests fetched successfully",
      success: true,
      data: requests.rows,
  });
} catch(error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching requests",
      success: false,
    });
  }
}

export const _getAllRequestsCount = async (req, res) => {
  try{
    const {member_id,status} = req.query;

    const requests = await getAllRequestsCount(member_id, status);
    console.log(requests.rows);

    res.status(200).json({
      message: "Requests fetched successfully",
      success: true,
      data: requests.rows,
  });
} catch(error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching requests",
      success: false,
    });
  }
}

export const _treatRequest =  async (req, res) => {
  try {
    const { request_id, status, approval_date, approval_member_id, uuid } = req.body;
    await treatRequest(request_id, status, approval_date, approval_member_id, uuid);

    res.status(200).send({
      message: "Request treated successfully",
      success: true
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error treating request",
      success: false,
      error,
    });
  }
};

export const _uploadPhoto = async (req, res) => {
  // req.file contains a file object
  try {
    const row = await uploadPhoto(req.file);
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const _updateProfile = async (req, res) => {
  try {
   const {firstname,lastname,email,userid} = req.body;
   const img = await updateProfile(req.file,firstname,lastname,email,userid);
   res.json(img);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const _getStudentRequests = async(req, res) => {
  try {
    const {member_id} = req.query;
    const requests = await getStudentRequests( member_id);
    console.log('requests => ', requests);
    res.status(200).json({
      message: "Requests fetched successfully",
      success: true,
      data: requests,
  });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const _sendQrCode = async (req, res) => {//TODO: split to some separated functions

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  const{recipientEmail, uuid} = req.body;

  const transporter = nodemailer.createTransport(
    smtpTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  );

try {
  const buffer = await new Promise((resolve, reject) => {
    qrCode.toBuffer(uuid, { errorCorrectionLevel: 'H' }, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });

  fs.writeFileSync('qrcode.png', buffer);
  console.log('QR code saved as qrcode.png');
} catch (err) {
  console.error('Error generating QR code:', err);
  //TODO: Handle the error here
}

  const mailOptions = {
    from: emailUser,
    to: recipientEmail, 
    subject: 'QR Code',
    text: 'This is your exit permission',
    attachments: [
      {
        filename: 'qrcode.png', 
        path: 'qrcode.png', 
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.status(200).json({
      message: "Email sent successfully",
      success: true,
  });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      message: "Error sending email",
      success: false,
  });
  }
};






