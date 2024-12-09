import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase, modelChanges, modelDb } from "@/utils/helpers/database";
import { createClient } from "@/utils/supabase/server";
import { decodeEmail } from "@/utils/helpers/email";
import { cookies } from "next/headers";

// Helper function to create Supabase client from token
async function createClientFromToken(token: string) {
    return createClient({
        get: () => token,
        set: () => {},
        remove: () => {},
    });
}

async function getUserDetails(request: NextRequest) {
    // Check for Authorization header first (mobile clients)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const supabase = await createClientFromToken(token);
        return await decodeEmail(supabase);
    }
    
    // Fallback to cookies (web clients)
    const cookiestore = await cookies();
    const supabase = await createClient(cookiestore);
    return await decodeEmail(supabase);
}

export async function GET(request: NextRequest) {
    console.log('GET request received at /api/timetable');
    
    try {
        await connectToDatabase();

        const userDetails = await getUserDetails(request);
        console.log('User details:', userDetails ? 'found' : 'not found');

        if (!userDetails) {
            return NextResponse.json(
                { message: 'Invalid or missing authentication' }, 
                { status: 401 }
            );
        }

        const Timetable = modelDb(userDetails);
        const data = await Timetable.find();
        console.log('Timetable data found:', data.length, 'entries');

        return NextResponse.json({ timetables: data });

    } catch (error) {
        console.error('Error in GET /api/timetable:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}