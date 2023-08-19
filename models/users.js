import { db } from "../config/db.js";

export const updateLastLogin = (email) => {
  return db("users").update({ last_login: new Date() }).where({ email });
};

export const isMember = (email) => {
  return db('members')
      .select('member_id', 'email')
      .where({ email })
};

export const isUser = (email) => {
  return db('users')
      .select('user_id', 'email')
      .where({ email })
};

export const register = (email, password, member_id) => {
  return db('users')
  .insert({
    email,
    password,
    member_id,
    last_login: new Date()
  })
  .returning(['user_id','email', 'member_id'])
}

export const login = (email) => {
  return db('users')
  .select('user_id','email','password', 'member_id')
  .where({email})
}

export const getUserInfo = (user_id) => {
  return db('members')
  .select('*')
  .leftJoin('uploads','members.image_id', '=', 'uploads.id')
  .where({member_id: user_id})
}

export const createRequest= (member_id, destination, exitTime, returnTime, comments) => {
  return db('requests')
  .insert({
    member_id,
    destination, 
    request_start_date: exitTime, 
    request_end_date: returnTime,
    comments
  })
}

export const getAllRequests = (member_id,status)=>{
  console.log('status',status);
  if(status === 'pending'){
    return db.raw(`select * from requests
                  inner join config
                    on requests.member_id = config.member_id
                  inner join members 
                    on members.member_id = config.member_id
                  where requests.status in ('pending') and config.class_id in (
                      select class_id from config
                        inner join members
                          on config.member_id = members.member_id 
                        where members.member_id = ?
                        and members.role = 'teacher'
                  )`,[member_id]);
   }
   return db.raw(`select a.*, m.firstname || ' ' || m.lastname teachername  from (
    select * from requests
       inner join config
         on requests.member_id = config.member_id
       inner join members m1
         on m1.member_id = config.member_id
       where requests.status in ('approved','rejected') and config.class_id in (
           select class_id from config
             inner join members
               on config.member_id = members.member_id 
             where members.member_id = ?
             and members.role = 'teacher'
       )
    ) a
    left join members m
    on m.member_id = a.approval_member_id`,
    [member_id]);
  }



export const getAllRequestsCount = (member_id,status)=>{
  return db.raw(`select count(1) from requests
                  inner join config
                    on requests.member_id = config.member_id
                  inner join members 
                    on members.member_id = config.member_id
                  where requests.status = ? and config.class_id in (
                      select class_id from config
                        inner join members
                          on config.member_id = members.member_id 
                        where members.member_id = ?
                        and members.role = 'teacher'
                  )`,[status,member_id]);
}

export const treatRequest = (request_id, status, approval_date, approval_member_id, uuid) => {
  return db('requests')
    .where({ request_id })
    .update({ status, approval_date, approval_member_id, uuid });
}

export const uploadPhoto = ({ key, mimetype, location, originalname }) => {
  return db("members").insert({ key, mimetype, location, originalname }, [
    "key",
    "mimetype",
    "location",
    "originalname",
  ]);
};

export const updateProfile = async (file, firstname,lastname,email, userid) => {
  const { key, mimetype, location, originalname } = file;
console.log(key, mimetype, location, originalname,firstname,lastname,email, userid);
  
  try {
    let returndata = {};
    if(firstname){
      const trx = await db.transaction();
      const member = await db("members")
      .where({member_id:userid})
      .update(
        {
          firstname
        },["firstname"])
      .transacting(trx);
      await trx.commit();
      returndata = {...returndata, ...member[0]}
    }

    if(lastname){
      const trx = await db.transaction();
      const member = await db("members")
      .where({member_id:userid})
      .update(
        {
          lastname
        },["lastname"])
      .transacting(trx);
      await trx.commit();
      returndata = {...returndata, ...member[0]}
    }

    if(email){
      const trx = await db.transaction();
      const member = await db("members")
      .where({member_id:userid})
      .update(
        {
          email
        },["email"])
      .transacting(trx);
      returndata = {...returndata, ...member[0]}
      const user = await db('users')
      .where({member_id:userid})
      .update({email},['user_id','email'])
      .transacting(trx);
      await trx.commit();
    }
    if(file){
      const trx = await db.transaction();
      const img = await db("uploads").insert({ key, mimetype, location, originalname }, [
        "id",
        "location"
      ])
      .transacting(trx);

      console.log("image id=>", img);
      const member = await db("members")
      .where({member_id:userid})
      .update(
        {
          image_id:img[0].id
        },["image_id"])
      .transacting(trx);

      await trx.commit();
      returndata = {...returndata, ...img[0]}
    }
    console.log('returndata =>',returndata);
    return returndata;
  } catch (err) {
    console.log("err=>", err);
    await trx.rollback();
    throw new Error(err.message);
  }
}

export const getStudentRequests = (member_id) => {
  return db('requests')
  .select('request_start_date', 'destination', 'request_end_date', 'comments', 'status', )
  .where({member_id})
}







