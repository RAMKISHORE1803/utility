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
    // Check for token in query parameters first (mobile clients)
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (token) {
        const supabase = await createClientFromToken(token);
        return await decodeEmail(supabase);
    }
    
    // Fallback to cookies (web clients)
    const cookiestore = await cookies();
    const supabase = await createClient(cookiestore);
    return await decodeEmail(supabase);
}

async function handleRequest(request: NextRequest) {
    try {
        await connectToDatabase();

        const userDetails = await getUserDetails(request);

        if (!userDetails) {
            return NextResponse.json(
                { message: 'Invalid or missing authentication' }, 
                { status: 401 }
            );
        }

        const Timetable = modelDb(userDetails);
        const data = await Timetable.find();

        return NextResponse.json({ timetables: data });

    } catch (error) {
        console.error('Error fetching timetable:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle GET requests
export async function GET(request: NextRequest) {
    return handleRequest(request);
}

// Handle POST requests
export async function POST(request: NextRequest) {
    return handleRequest(request);
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',  // Removed Authorization since we're using query params
            'Access-Control-Allow-Origin': '*'  // Configure this appropriately for production
        },
    });
}