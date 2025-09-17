import { db } from "@/lib/db"

export const POST =async()=>{
    const createadmin= await db.user.create({
        data:{
            email:"admin@example.com",
            hashedPassword:"03102003" // bcrypt hash for "password123"
        }
    })
    return new Response (JSON.stringify(createadmin))
}