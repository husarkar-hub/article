import { db } from "@/lib/db";

export async function GET(request: Request) {
   try {
     const getAllArticles = await db.article.findMany();
    return new Response(JSON.stringify(getAllArticles), { status: 200 });
   } catch (error) {
    return new Response("Failed to fetch articles", { status: 500 });
    
   }
}